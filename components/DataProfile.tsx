import React from 'react';
import { DataSet, ColumnType } from '../types';
import { AlertTriangle, CheckCircle, Hash, Type as TypeIcon, Calendar, HelpCircle } from 'lucide-react';

interface DataProfileProps {
  dataset: DataSet;
}

export const DataProfile: React.FC<DataProfileProps> = ({ dataset }) => {
  
  const getTypeIcon = (type: ColumnType) => {
    switch (type) {
      case ColumnType.Number: return <Hash className="w-4 h-4 text-blue-500" />;
      case ColumnType.String: return <TypeIcon className="w-4 h-4 text-green-500" />;
      case ColumnType.Date: return <Calendar className="w-4 h-4 text-purple-500" />;
      default: return <HelpCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Column Validation</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detected Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missing Values</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dataset.columnProfiles.map((profile) => (
              <tr key={profile.name}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {profile.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(profile.type)}
                    <span>{profile.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${profile.missingPercentage > 0 ? 'bg-red-400' : 'bg-green-400'}`} 
                        style={{ width: `${Math.max(profile.missingPercentage, 0)}%` }}
                      ></div>
                    </div>
                    <span>{profile.missingCount} ({profile.missingPercentage.toFixed(1)}%)</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {profile.missingPercentage === 0 && profile.type !== ColumnType.Mixed ? (
                     <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                       <CheckCircle className="w-3 h-3" /> Valid
                     </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="w-3 h-3" /> Attention
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
