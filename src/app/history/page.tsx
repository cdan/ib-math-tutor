"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import MathRenderer from "@/components/MathRenderer";

type HistoryItem = {
  id: string;
  timestamp: number;
  topic: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ib-math-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      localStorage.removeItem("ib-math-history");
      setHistory([]);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <header className="p-6 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Review History</h1>
          </div>
          {history.length > 0 && (
            <button 
              onClick={clearHistory}
              className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition-colors"
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
        </header>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
          {history.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p>No history yet.</p>
              <Link href="/" className="text-indigo-600 font-medium hover:underline mt-2 inline-block">
                Go practice some math!
              </Link>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-indigo-200">
                
                {/* Summary Row */}
                <div 
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 cursor-pointer flex items-center gap-4 hover:bg-gray-50/50"
                >
                  <div className="shrink-0">
                    {item.isCorrect ? (
                      <CheckCircle className="text-green-500" size={24} />
                    ) : (
                      <XCircle className="text-red-500" size={24} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-sm font-bold text-indigo-700 truncate">{item.topic}</h3>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 ml-2">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate font-serif">{item.questionText.substring(0, 80)}...</p>
                  </div>

                  <div className="text-gray-400">
                    {expandedId === item.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === item.id && (
                  <div className="p-6 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top-2">
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Question</p>
                      <div className="text-gray-800 font-serif text-sm leading-relaxed">
                        <MathRenderer text={item.questionText} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className={`p-3 rounded-lg border ${item.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">Your Answer</p>
                        <p className="font-mono text-sm font-bold">{item.userAnswer}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70 text-blue-800">Correct Answer</p>
                        <p className="font-mono text-sm font-bold text-blue-700">
                          <MathRenderer text={item.correctAnswer} />
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Explanation</p>
                      <div className="text-sm text-gray-600 italic leading-relaxed bg-white p-3 rounded-lg border border-gray-200">
                        <MathRenderer text={item.explanation} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
