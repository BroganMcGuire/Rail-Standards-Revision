
import React, { useState, useMemo } from 'react';
import { UploadedStandard, Flashcard, Citation } from '../types';
import { generateFlashcards } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import { 
  RotateCw, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Printer,
  CreditCard as CardIcon
} from 'lucide-react';
import { COLORS } from '../constants';

interface FlashcardsProps {
  standards: UploadedStandard[];
  onOpenPDF: (standardName: string, page: number, clause?: string) => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ standards, onOpenPDF }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleGenerate = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setCompletedCount(0);
    try {
      // Parallelize generation for all selected standards
      const generationPromises = selectedIds.map(async (id) => {
        const std = standards.find(s => s.id === id);
        if (std) {
          const res = await generateFlashcards(std.text, std.originalName);
          setCompletedCount(prev => prev + 1);
          return res;
        }
        setCompletedCount(prev => prev + 1);
        return [];
      });

      const results = await Promise.all(generationPromises);
      const allNewCards = results.flat().sort(() => Math.random() - 0.5);

      setCards(allNewCards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (error) {
      console.error("Flashcard Generation Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const cardWidth = 85;
    const cardHeight = 85;
    const marginX = (210 - (cardWidth * 2)) / 3;
    const marginY = (297 - (cardHeight * 3)) / 4;

    const cardsPerPage = 6;
    const numPages = Math.ceil(cards.length / cardsPerPage);

    for (let p = 0; p < numPages; p++) {
      const pageCards = cards.slice(p * cardsPerPage, (p + 1) * cardsPerPage);
      
      // Questions Page
      doc.setFontSize(10);
      pageCards.forEach((card, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = marginX + col * (cardWidth + marginX);
        const y = marginY + row * (cardHeight + marginY);
        doc.rect(x, y, cardWidth, cardHeight);
        doc.text(doc.splitTextToSize(`Q: ${card.question}`, cardWidth - 10), x + 5, y + 15);
      });

      // Answers Page (Mirrored horizontally for duplex)
      doc.addPage();
      pageCards.forEach((card, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        // Swap col: 0 becomes 1, 1 becomes 0
        const mirroredCol = col === 0 ? 1 : 0;
        const x = marginX + mirroredCol * (cardWidth + marginX);
        const y = marginY + row * (cardHeight + marginY);
        doc.rect(x, y, cardWidth, cardHeight);
        doc.text(doc.splitTextToSize(`A: ${card.answer}`, cardWidth - 10), x + 5, y + 15);
        doc.setFontSize(7);
        const citation = card.citations[0];
        if (citation) {
           doc.text(`${citation.standard} - Cl ${citation.clause} (Pg ${citation.page})`, x + 5, y + cardHeight - 5);
        }
        doc.setFontSize(10);
      });

      if (p < numPages - 1) doc.addPage();
    }

    doc.save('RailStandard_Flashcards.pdf');
    setShowExportModal(true);
  };

  if (cards.length > 0) {
    const currentCard = cards[currentIndex];
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setCards([])}
            className="text-sm font-semibold text-gray-500 hover:text-gray-900"
          >
            ← Back to selection
          </button>
          <div className="flex gap-2">
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-700 transition-all"
            >
              <Download size={16} />
              Export PDF
            </button>
            <button 
              onClick={handleGenerate}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-all"
            >
              <RotateCw size={16} />
              Regenerate
            </button>
          </div>
        </div>

        <div className="relative h-[400px] w-full [perspective:1000px]">
          <div 
            className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
          >
            {/* Front */}
            <div className="absolute inset-0 bg-white rounded-3xl shadow-xl border-2 border-gray-100 flex flex-col p-12 [backface-visibility:hidden]">
              <div className="mb-4">
                 <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Question</span>
              </div>
              <div className="flex-1 flex items-center justify-center text-center">
                <p className="text-2xl font-bold leading-snug">{currentCard.question}</p>
              </div>
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => setIsFlipped(true)}
                  className="bg-blue-50 text-blue-700 font-bold px-8 py-3 rounded-full hover:bg-blue-100 transition-colors"
                >
                  Reveal Answer
                </button>
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 bg-white rounded-3xl shadow-xl border-2 border-gray-100 flex flex-col p-12 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="mb-4">
                 <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Answer</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <p className="text-xl leading-relaxed text-gray-800">{currentCard.answer}</p>
              </div>
              
              {currentCard.citations.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {currentCard.citations.map((c, i) => (
                      <button 
                        key={i} 
                        onClick={(e) => { e.stopPropagation(); onOpenPDF(c.standard, c.page, c.clause); }}
                        className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                      >
                        {c.standard} Cl {c.clause}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button 
                  onClick={() => setIsFlipped(false)}
                  className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Flip Back
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4">
          <button 
            disabled={currentIndex === 0}
            onClick={() => { setCurrentIndex(v => v - 1); setIsFlipped(false); }}
            className="p-3 rounded-full bg-white shadow-md border border-gray-100 hover:bg-gray-50 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <span className="font-bold text-gray-500">
            {currentIndex + 1} of {cards.length}
          </span>
          <button 
            disabled={currentIndex === cards.length - 1}
            onClick={() => { setCurrentIndex(v => v + 1); setIsFlipped(false); }}
            className="p-3 rounded-full bg-white shadow-md border border-gray-100 hover:bg-gray-50 disabled:opacity-30 transition-all"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {showExportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 size={32} />
                <h3 className="text-xl font-bold">PDF Generated Successfully</h3>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <Printer className="text-blue-500 shrink-0 mt-1" size={20} />
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-blue-900">Printing Instructions:</p>
                    <ul className="text-xs text-blue-800 space-y-1 list-disc ml-4">
                      <li>Print to <strong>A4 paper</strong>.</li>
                      <li>Print on <strong>both sides</strong> of the paper.</li>
                      <li>Select <strong>"Flip along the long edge"</strong> setting.</li>
                      <li>Ensure scale is set to 100% or "Actual Size".</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold mb-2">Flash Cards</h2>
      <p className="text-gray-500 mb-8">Select standards to generate revision cards (10 per standard).</p>

      {standards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-4">
          <AlertCircle size={48} />
          <p>Please upload standards in the sidebar first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {standards.map((std) => (
              <button
                key={std.id}
                onClick={() => toggleSelect(std.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedIds.includes(std.id) 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-gray-900 truncate pr-4">{std.name}</p>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedIds.includes(std.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {selectedIds.includes(std.id) && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            disabled={selectedIds.length === 0 || loading}
            onClick={handleGenerate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 flex flex-col items-center justify-center gap-2 transition-all"
          >
            <div className="flex items-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <CardIcon size={20} />}
              <span>{loading ? 'Generating Flash Cards...' : 'Generate Flash Cards'}</span>
            </div>
            {loading && (
              <div className="text-xs font-medium text-blue-200">
                Generated {completedCount * 10} of {selectedIds.length * 10} cards ({selectedIds.length - completedCount} standards remaining)
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
