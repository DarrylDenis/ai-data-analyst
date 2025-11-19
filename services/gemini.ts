import { GoogleGenAI, Type } from "@google/genai";
import { DataSet, AIAnalysisResult, CleaningPlan, ColumnType } from "../types";

const getClient = () => {
  // According to guidelines, use process.env.API_KEY.
  // Ensure your environment defines this (e.g. via define in vite.config.ts or proper env setup).
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeDataQuality = async (dataset: DataSet): Promise<AIAnalysisResult> => {
  try {
    const ai = getClient();
    
    // Limit columns to prevent token overflow for large datasets
    const profileSummary = dataset.columnProfiles.slice(0, 50).map(p => 
      `- Column "${p.name}": Type ${p.type}, Missing ${p.missingCount} (${p.missingPercentage.toFixed(1)}%), Unique ${p.uniqueCount}`
    ).join('\n');

    const prompt = `
      Analyze the quality of the following dataset.
      
      Dataset: ${dataset.fileName} (${dataset.totalRows} rows)
      Columns (First 50):
      ${profileSummary}

      Provide:
      1. Summary of the data.
      2. Quality score (0-100).
      3. List of issues.
      4. Recommendations.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            dataQualityScore: { type: Type.NUMBER },
            issues: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "dataQualityScore", "issues", "recommendations"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return {
      summary: "Analysis unavailable.",
      dataQualityScore: 0,
      issues: ["Error connecting to AI service"],
      recommendations: []
    };
  }
};

export const generateCleaningPlan = async (dataset: DataSet): Promise<CleaningPlan> => {
  try {
    const ai = getClient();
    
    const profileSummary = dataset.columnProfiles.slice(0, 50).map(p => 
      `- Col "${p.name}": ${p.type}, Missing ${p.missingCount} (${p.missingPercentage.toFixed(1)}%), Ex: ${p.example}`
    ).join('\n');

    const prompt = `
      You are an expert Data Engineer. Create a cleaning plan for this dataset.
      
      Metadata:
      ${profileSummary}
      Total Rows: ${dataset.totalRows}

      Rules:
      1. If headers contain spaces or special chars, suggest 'normalize_headers'.
      2. If a Numeric column has missing values, suggest 'impute' with 'mean' or 'median'.
      3. If a Categorical (String) column has missing values, suggest 'impute' with 'mode' or 'drop_row' if critical.
      4. If columns look like Mixed types but should be Numbers/Dates, suggest 'cast_type'.
      5. Always check for 'remove_duplicates'.
      6. Return a valid JSON object matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { 
                    type: Type.STRING, 
                    enum: ['impute', 'remove_duplicates', 'normalize_headers', 'cast_type', 'drop_column'] 
                  },
                  column: { type: Type.STRING },
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      strategy: { type: Type.STRING, enum: ['mean', 'median', 'mode', 'remove_row', 'fill_zero'] },
                      targetType: { type: Type.STRING, enum: ['Number', 'String', 'Date', 'Boolean'] }
                    }
                  },
                  description: { type: Type.STRING }
                },
                required: ["type", "description"]
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["actions", "summary"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CleaningPlan;
    }
    throw new Error("Failed to generate cleaning plan");

  } catch (error) {
    console.error("Error generating cleaning plan:", error);
    return {
      actions: [],
      summary: "Could not generate cleaning plan."
    };
  }
};