
import React from 'react';
import { DataSet } from '../types';

interface DataPreviewProps {
  dataset: DataSet;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ dataset }) => {
  const PREVIEW_LIMIT = 100;
  const previewRows = dataset.rows.slice(0, PREVIEW_LIMIT);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-2">
           <h3 className="text-lg font-semibold text-gray-900">Raw Data Preview</h3>
           <span className="px-2 py-0.5 bg-gray-200 rounded text-xs font-medium text-gray-600">Top 100</span>
        </div>
        <span className="text-sm text-gray-500">
          Total Rows: <span className="font-mono font-medium text-gray-900">{dataset.totalRows.toLocaleString()}</span>
        </span>
      </div>
      
      <div className="overflow-auto flex-1 scrollbar-thin w-full">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16 border-r border-gray-200 bg-gray-50/95 backdrop-blur">
                #
              </th>
              {dataset.headers.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap min-w-[150px] bg-gray-50/95 backdrop-blur"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {previewRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap text-xs font-medium text-gray-400 border-r border-gray-100 bg-gray-50/30">
                  {idx + 1}
                </td>
                {dataset.headers.map((header) => (
                  <td key={`${idx}-${header}`} className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                    {row[header] !== null && row[header] !== undefined ? (
                      String(row[header])
                    ) : (
                      <span className="text-gray-300 text-xs uppercase italic">null</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dataset.totalRows > PREVIEW_LIMIT && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500 flex-shrink-0">
             Showing first {PREVIEW_LIMIT} rows. Download cleaned data to see full set.
          </div>
      )}
    </div>
  );
};
