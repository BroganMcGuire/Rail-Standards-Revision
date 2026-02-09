
import React, { useState } from 'react';
import { UploadedStandard } from '../types';
import { Search, FileText, ArrowLeft, BookOpen, ExternalLink, AlertCircle } from 'lucide-react';
import { COLORS } from '../constants';

interface StandardsPageProps {
  standards: UploadedStandard[];
  onOpenPDF: (standardName: string, page: number, clause?: string) => void;
}

export const StandardsPage: React.FC<StandardsPageProps> = ({ standards, onOpenPDF }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStandards = standards.filter(std => 
    std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    std.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-1">Standards Library</h2>
            <p className="text-gray-500 text-sm">Browse and view all uploaded Network Rail standards.</p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
            />
          </div>
        </div>

        {standards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4 border-2 border-dashed border-gray-100 rounded-2xl">
            <div className="bg-gray-50 p-4 rounded-full">
              <BookOpen size={48} />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900">Your library is empty</p>
              <p className="text-sm">Upload PDF standards via the sidebar to get started.</p>
            </div>
          </div>
        ) : filteredStandards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="font-bold">No matches found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStandards.map((std) => (
              <button
                key={std.id}
                onClick={() => onOpenPDF(std.originalName, 1)}
                className="group relative bg-white border border-gray-100 rounded-xl p-5 text-left transition-all hover:border-blue-300 hover:shadow-md active:scale-[0.98] overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 text-blue-100 group-hover:text-blue-500 transition-colors">
                  <FileText size={40} strokeWidth={1} />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-lg w-fit mb-4">
                    <BookOpen size={20} />
                  </div>
                  
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-tight pr-8" title={std.name}>
                    {std.name}
                  </h3>
                  
                  <p className="text-[10px] text-gray-400 font-medium truncate mt-auto uppercase tracking-wider">
                    {std.originalName}
                  </p>
                  
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View Document</span>
                    <ExternalLink size={12} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Need more standards?</h3>
            <p className="text-slate-400 text-sm max-w-md">
              Access the official Network Rail standards portal to download the latest versions of technical specifications.
            </p>
          </div>
          <button 
            onClick={() => window.open('http://networkrailstandards/NewSearch.aspx?q=', '_blank')}
            className="whitespace-nowrap bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2"
          >
            <Search size={18} />
            Go to Search Portal
          </button>
        </div>
        {/* Decorative background element */}
        <div className="absolute -right-4 -bottom-4 text-white/5 pointer-events-none">
          <FileText size={160} />
        </div>
      </div>
    </div>
  );
};
