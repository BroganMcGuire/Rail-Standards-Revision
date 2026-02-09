
import React, { useEffect, useRef, useState } from 'react';
import { SelectedStandardRef } from '../types';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';

declare const pdfjsLib: any;

interface PDFViewerProps {
  refData: SelectedStandardRef;
  onClose: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ refData, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState(refData.page);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [pdf, setPdf] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync current page when refData changes
  useEffect(() => {
    setCurrentPage(refData.page);
  }, [refData.page, refData.standard.id]);

  useEffect(() => {
    let isCancelled = false;
    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      try {
        // CRITICAL: Always slice the data before passing it to PDF.js 
        // to prevent the original buffer from being detached.
        const dataToLoad = refData.standard.data.slice();
        const loadingTask = pdfjsLib.getDocument({ data: dataToLoad });
        const pdfDoc = await loadingTask.promise;
        
        if (!isCancelled) {
          setPdf(pdfDoc);
          setNumPages(pdfDoc.numPages);
          setLoading(false);
          // Clamp initial page to total pages
          if (refData.page > pdfDoc.numPages) {
            setCurrentPage(pdfDoc.numPages);
          }
        }
      } catch (err: any) {
        console.error("Detailed PDF Loading Error:", err);
        if (!isCancelled) {
          setError(err.message || "Failed to load PDF document. Please try again.");
          setLoading(false);
        }
      }
    };

    loadPdf();
    return () => { isCancelled = true; };
  }, [refData.standard.id]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current || loading) return;
      try {
        const pageNumber = Math.min(Math.max(1, currentPage), numPages || 1);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: zoom });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          await page.render(renderContext).promise;
        }
      } catch (err) {
        console.error("Error rendering page:", err);
      }
    };
    renderPage();
  }, [pdf, currentPage, zoom, loading, numPages]);

  const goToPage = (p: number) => {
    if (p >= 1 && p <= numPages) setCurrentPage(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-white/10">
        {/* Toolbar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex flex-col min-w-0 pr-4">
            <h3 className="font-bold text-sm truncate">{refData.standard.name}</h3>
            {refData.clause && <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Clause: {refData.clause}</span>}
          </div>

          <div className="flex items-center gap-4 sm:gap-8 shrink-0">
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button 
                onClick={() => goToPage(currentPage - 1)} 
                disabled={currentPage <= 1 || loading} 
                className="p-1 hover:bg-slate-700 rounded transition-colors disabled:opacity-20"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs font-bold min-w-[80px] text-center">
                {loading ? '...' : `Page ${currentPage} / ${numPages}`}
              </span>
              <button 
                onClick={() => goToPage(currentPage + 1)} 
                disabled={currentPage >= numPages || loading} 
                className="p-1 hover:bg-slate-700 rounded transition-colors disabled:opacity-20"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button 
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-xs font-bold min-w-[45px] text-center">{Math.round(zoom * 100)}%</span>
              <button 
                onClick={() => setZoom(prev => Math.min(4, prev + 0.25))}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <ZoomIn size={18} />
              </button>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-all ml-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-100 flex justify-center items-start p-4 sm:p-12 relative scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-transparent">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 z-10 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-slate-500 font-bold text-sm animate-pulse">Initializing PDF Engine...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-8 text-center gap-4">
              <div className="bg-red-50 p-4 rounded-full text-red-500">
                <AlertTriangle size={48} />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Unable to view standard</h4>
              <p className="text-slate-500 max-w-xs">{error}</p>
              <button 
                onClick={onClose}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Close Viewer
              </button>
            </div>
          )}

          {!error && (
            <div className="relative shadow-2xl border border-gray-200">
              <canvas 
                ref={canvasRef} 
                className={`bg-white transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
