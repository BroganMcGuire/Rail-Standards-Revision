
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { StandardAI } from './components/StandardAI';
import { Flashcards } from './components/Flashcards';
import { Quiz } from './components/Quiz';
import { StandardsPage } from './components/StandardsPage';
import { PDFViewer } from './components/PDFViewer';
import { Section, UploadedStandard, SelectedStandardRef } from './types';
import { Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>(Section.RailStandardAI);
  const [uploadedStandards, setUploadedStandards] = useState<UploadedStandard[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedPDFRef, setSelectedPDFRef] = useState<SelectedStandardRef | null>(null);

  const handleUpload = (newStandards: UploadedStandard[]) => {
    setUploadedStandards(prev => [...prev, ...newStandards]);
  };

  const handleRemoveStandard = (id: string) => {
    setUploadedStandards(prev => prev.filter(std => std.id !== id));
  };

  const handleOpenPDF = useCallback((standardName: string, page: number, clause?: string) => {
    // Robust search: try exact match, then case-insensitive, then without .pdf extension
    const clean = (s: string) => s.toLowerCase().replace(/\.pdf$/i, '').trim();
    const searchTarget = clean(standardName);
    
    const standard = uploadedStandards.find(s => 
      clean(s.originalName) === searchTarget || 
      clean(s.name) === searchTarget
    );

    if (standard) {
      setSelectedPDFRef({ standard, page: Number(page) || 1, clause });
    } else {
      console.warn(`Could not find standard: ${standardName}`);
    }
  }, [uploadedStandards]);

  const renderSection = () => {
    switch (activeSection) {
      case Section.RailStandardAI:
        return <StandardAI standards={uploadedStandards} onOpenPDF={handleOpenPDF} />;
      case Section.FlashCards:
        return <Flashcards standards={uploadedStandards} onOpenPDF={handleOpenPDF} />;
      case Section.Quiz:
        return <Quiz standards={uploadedStandards} onOpenPDF={handleOpenPDF} />;
      case Section.Standards:
        return <StandardsPage standards={uploadedStandards} onOpenPDF={handleOpenPDF} />;
      default:
        return <StandardAI standards={uploadedStandards} onOpenPDF={handleOpenPDF} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Toggle */}
      <button 
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md lg:hidden"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        uploadedStandards={uploadedStandards}
        onUpload={handleUpload}
        onRemoveStandard={handleRemoveStandard}
      />

      {/* Main Content */}
      <main className={`flex-1 overflow-auto transition-all duration-300 ${isSidebarOpen ? 'lg:ml-0' : ''}`}>
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {renderSection()}
        </div>
      </main>

      {/* PDF Popup Viewer */}
      {selectedPDFRef && (
        <PDFViewer 
          refData={selectedPDFRef}
          onClose={() => setSelectedPDFRef(null)}
        />
      )}
    </div>
  );
};

export default App;
