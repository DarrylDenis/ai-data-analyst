import React, { useCallback } from 'react';
import { UploadCloud, FileType } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  }, [onFileSelect, isProcessing]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`
        w-full max-w-2xl mx-auto p-12 rounded-xl border-2 border-dashed transition-all duration-300 ease-in-out
        ${isProcessing 
          ? 'bg-gray-50 border-gray-300 cursor-not-allowed opacity-70' 
          : 'bg-white border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer shadow-sm hover:shadow-md'
        }
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className={`p-4 rounded-full ${isProcessing ? 'bg-gray-100' : 'bg-indigo-100'}`}>
          {isProcessing ? (
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          ) : (
            <UploadCloud className="w-8 h-8 text-indigo-600" />
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {isProcessing ? 'Processing File...' : 'Upload your dataset'}
          </h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Drag and drop your CSV or Excel file here, or click to browse.
          </p>
        </div>

        {!isProcessing && (
          <>
            <label htmlFor="file-upload" className="relative">
              <span className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors duration-200 cursor-pointer">
                Browse Files
              </span>
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept=".csv,.xlsx,.xls" 
                onChange={handleChange} 
              />
            </label>
            
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-4">
              <span className="flex items-center gap-1"><FileType className="w-3 h-3" /> .CSV</span>
              <span className="flex items-center gap-1"><FileType className="w-3 h-3" /> .XLSX</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
