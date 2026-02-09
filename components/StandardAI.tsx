
import React, { useState } from 'react';
import { UploadedStandard, AIResponse, Citation } from '../types';
import { askStandardAI } from '../services/geminiService';
import { Send, Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { COLORS } from '../constants';

interface StandardAIProps {
  standards: UploadedStandard[];
  onOpenPDF: (standardName: string, page: number, clause?: string) => void;
}

export const StandardAI: React.FC<StandardAIProps> = ({ standards, onOpenPDF }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || standards.length === 0) return;

    setLoading(true);
    setResponse(null);
    try {
      // Combine all standard text for context
      const fullContext = standards.map(s => `FILENAME: ${s.originalName}\n${s.text}`).join('\n\n');
      const res = await askStandardAI(query, fullContext);
      setResponse(res);
    } catch (error) {
      console.error(error);
      setResponse({ answer: "An error occurred while communicating with the AI. Please ensure your API key is correct and you have uploaded standards.", citations: [] });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!response) return;
    const citationsText = (response.citations || [])
      .map(c => `- ${c.standard} (Clause ${c.clause}, Page ${c.page})`)
      .join('\n');
    const text = `${response.answer}\n\nReferences:\n${citationsText}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold mb-2">RailStandardAI</h2>
        <p className="text-gray-500 mb-6">Ask technical questions based strictly on uploaded Network Rail standards.</p>

        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={standards.length === 0 ? "Upload standards first..." : "How do I calculate ballast depth for Category 1 track?"}
            disabled={standards.length === 0 || loading}
            className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={standards.length === 0 || loading || !query.trim()}
            className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg shadow-lg disabled:opacity-50 disabled:hover:bg-blue-600 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            <span className="font-semibold px-1">Ask AI</span>
          </button>
        </form>
      </div>

      {response && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Expert Response</span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors bg-white px-3 py-1.5 rounded-md border border-gray-200 shadow-sm"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
          
          <div className="p-8">
            <div className="prose prose-blue max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
              {response.answer}
            </div>

            {response.citations && response.citations.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ExternalLink size={16} style={{ color: COLORS.accent }} />
                  Supporting Clauses
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {response.citations.map((citation, i) => (
                    <button
                      key={i}
                      onClick={() => onOpenPDF(citation.standard, citation.page, citation.clause)}
                      className="text-left p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                    >
                      <p className="text-xs font-bold text-blue-800 truncate mb-1">{citation.standard}</p>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 group-hover:text-blue-600 font-medium">
                        <span>Clause {citation.clause}</span>
                        <span>Page {citation.page}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
