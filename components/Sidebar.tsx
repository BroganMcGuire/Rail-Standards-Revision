
import React, { useRef } from 'react';
import { Section, UploadedStandard } from '../types';
import { COLORS } from '../constants.tsx';
import { extractTextFromPDF } from '../services/pdfService';
import { 
  FileSearch, 
  MessageSquare, 
  CreditCard, 
  Trophy, 
  Upload, 
  ChevronLeft,
  BookOpen,
  TrainFront,
  Trash2,
  Library
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  uploadedStandards: UploadedStandard[];
  onUpload: (standards: UploadedStandard[]) => void;
  onRemoveStandard: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeSection,
  setActiveSection,
  uploadedStandards,
  onUpload,
  onRemoveStandard
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const processed = await Promise.all(files.map(extractTextFromPDF));
      onUpload(processed);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const navItems = [
    { id: Section.RailStandardAI, name: 'RailStandardAI', icon: <MessageSquare size={20} /> },
    { id: Section.FlashCards, name: 'Flash Cards', icon: <CreditCard size={20} /> },
    { id: Section.Quiz, name: 'Quiz', icon: <Trophy size={20} /> },
    { id: Section.Standards, name: 'Standards', icon: <Library size={20} /> },
  ];

  return (
    <aside 
      className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transition-transform duration-300 transform 
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col border-r border-slate-700 font-sans`}
    >
      {/* Header */}
      <div className="p-8 border-b border-slate-700 flex flex-col items-center text-center gap-3">
        <div className="bg-blue-600 p-2 rounded-xl shadow-inner mb-1">
          <TrainFront size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight leading-tight">
            Rail Standards <br/>
            <span style={{ color: COLORS.accent }}>Revision</span>
          </h1>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Primary Action */}
      <div className="p-4">
        <button
          onClick={() => window.open('http://networkrailstandards/NewSearch.aspx?q=', '_blank')}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg p-3 text-sm font-semibold transition-colors shadow-sm"
        >
          <FileSearch size={18} style={{ color: COLORS.accent }} />
          Search NR Standards
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <p className="text-[10px] font-bold text-slate-500 px-3 py-2 uppercase tracking-[0.2em]">Methods</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all
            ${activeSection === item.id 
              ? 'bg-blue-600 text-white shadow-lg ring-1 ring-blue-400' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            {item.icon}
            {item.name}
          </button>
        ))}

        <div className="mt-8">
          <p className="text-[10px] font-bold text-slate-500 px-3 py-2 uppercase tracking-[0.2em]">Standards Library</p>
          <div className="space-y-1 mt-1">
            {uploadedStandards.length === 0 ? (
              <p className="text-xs text-slate-500 italic px-3">No standards uploaded yet.</p>
            ) : (
              uploadedStandards.map((std) => (
                <div key={std.id} className="flex items-center justify-between group px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-default">
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen size={14} className="text-blue-400 shrink-0 group-hover:text-blue-300 transition-colors" />
                    <span className="truncate font-medium" title={std.name}>{std.name}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRemoveStandard(std.id); }}
                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Remove standard"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </nav>

      {/* Upload Footer */}
      <div className="p-4 border-t border-slate-700">
        <input 
          type="file" 
          multiple 
          accept=".pdf" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 text-sm font-bold transition-all shadow-md active:scale-95 border-b-4 border-blue-800"
        >
          <Upload size={18} />
          Upload PDFs
        </button>
      </div>
    </aside>
  );
};
