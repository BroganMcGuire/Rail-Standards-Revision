
import React, { useState } from 'react';
import { UploadedStandard, QuizQuestion } from '../types';
import { generateQuiz } from '../services/geminiService';
import { Loader2, CheckCircle, XCircle, RotateCcw, AlertCircle, BookOpen, ExternalLink, RefreshCw, LayoutGrid } from 'lucide-react';

interface QuizProps {
  standards: UploadedStandard[];
  onOpenPDF: (standardName: string, page: number, clause?: string) => void;
}

export const Quiz: React.FC<QuizProps> = ({ standards, onOpenPDF }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleStart = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    setCompletedCount(0);
    try {
      // Parallelize generation for all selected standards with progress tracking
      const generationPromises = selectedIds.map(async (id) => {
        const std = standards.find(s => s.id === id);
        if (std) {
          const res = await generateQuiz(std.text, std.originalName);
          setCompletedCount(prev => prev + 1);
          return res;
        }
        setCompletedCount(prev => prev + 1);
        return [];
      });

      const results = await Promise.all(generationPromises);
      const allQ = results.flat().sort(() => Math.random() - 0.5);
      
      setQuestions(allQ);
      setCurrentIndex(0);
      setAnswers({});
      setShowResults(false);
    } catch (error) {
      console.error("Quiz Start Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleNewQuiz = () => {
    setQuestions([]);
    setAnswers({});
    setShowResults(false);
    // Keep selectedIds so they can easily start another
  };

  const handleSelectAnswer = (ans: string) => {
    if (showResults) return;
    const qId = questions[currentIndex]?.id;
    if (!qId) return;
    setAnswers(prev => ({ ...prev, [qId]: ans }));
  };

  const calculateScore = () => {
    if (!questions.length) return 0;
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return Math.round((correct / questions.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="relative">
          <Loader2 size={64} className="animate-spin text-blue-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">{Math.round((completedCount / selectedIds.length) * 100)}%</span>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold">Generating Your Quiz</h3>
          <p className="text-gray-500 max-w-sm">
            Please wait while we extract high-quality engineering questions from {selectedIds.length} standards...
          </p>
          <div className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold inline-block">
            Processed {completedCount} of {selectedIds.length} standards
          </div>
        </div>
      </div>
    );
  }

  if (questions.length > 0 && !showResults) {
    const q = questions[currentIndex];
    const distractors = Array.isArray(q.distractors) ? q.distractors : [];
    const allOptions = [q.correctAnswer, ...distractors].sort();
    const isAnswered = !!answers[q.id];

    return (
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
            <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 leading-tight mb-8">{q.question}</h3>

          <div className="space-y-3">
            {allOptions.map((opt, i) => {
              const selected = answers[q.id] === opt;
              return (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => handleSelectAnswer(opt)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selected ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {selected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className="text-sm font-medium">{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between">
          <button 
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(v => v - 1)}
            className="px-6 py-2 font-bold text-gray-500 hover:text-gray-900 disabled:opacity-30"
          >
            Previous
          </button>
          {currentIndex === questions.length - 1 ? (
            <button 
              onClick={() => setShowResults(true)}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
            >
              Finish Quiz
            </button>
          ) : (
            <button 
              onClick={() => setCurrentIndex(v => v + 1)}
              className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all"
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden p-12">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="inline-block p-4 rounded-full bg-blue-50 text-blue-600 mb-6">
              <CheckCircle size={64} />
            </div>
            <h2 className="text-4xl font-black mb-2">Quiz Complete!</h2>
            <p className="text-gray-500 text-lg mb-8">Great job on finishing your revision session.</p>
            <div className="text-6xl font-black text-blue-600 mb-8">{score}%</div>
            
            <div className="flex flex-wrap gap-4 w-full">
              <button 
                onClick={handleRetake}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex-1 min-w-[160px]"
              >
                <RotateCcw size={20} />
                Retake Current
              </button>
              <button 
                onClick={handleStart}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex-1 min-w-[160px]"
              >
                <RefreshCw size={20} />
                Regenerate New
              </button>
              <button 
                onClick={handleNewQuiz}
                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all flex-1 min-w-[160px]"
              >
                <LayoutGrid size={20} />
                Change Standards
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold px-4">Review Answers</h3>
          {questions.map((q, i) => {
            const isCorrect = answers[q.id] === q.correctAnswer;
            const citations = Array.isArray(q.citations) ? q.citations : [];
            return (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="flex items-start gap-4">
                  {isCorrect ? <CheckCircle className="text-green-500 shrink-0 mt-1" /> : <XCircle className="text-red-500 shrink-0 mt-1" />}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-2">{q.question}</p>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-gray-400 font-medium">Your answer: </span>
                        <span className={isCorrect ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>{answers[q.id] || 'Not answered'}</span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm">
                          <span className="text-gray-400 font-medium">Correct answer: </span>
                          <span className="text-green-700 font-bold">{q.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {citations.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 flex flex-wrap gap-2">
                    <BookOpen size={14} className="text-gray-400" />
                    {citations.map((c, j) => (
                      <button 
                        key={j} 
                        onClick={() => onOpenPDF(c.standard, c.page, c.clause)}
                        className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {c.standard} Cl {c.clause} <ExternalLink size={10} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold mb-2">Quiz</h2>
      <p className="text-gray-500 mb-8">Select standards for a generated quiz (10 questions per standard).</p>

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
                    {selectedIds.includes(std.id) && <CheckCircle size={14} className="text-white" />}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            disabled={selectedIds.length === 0 || loading}
            onClick={handleStart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 flex flex-col items-center justify-center gap-2 transition-all"
          >
            <div className="flex items-center gap-3">
              <BookOpen />
              <span>Start Revision Quiz</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
