"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp, Calendar, ChevronLeft, ChevronRight, BookOpen, Book } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0); // 0 = current view, 1 = previous
  const [course, setCourse] = useState("IB"); // "IB" or "SAT"
  const userId = "student"; 

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/user-progress?userId=${userId}&course=${course}`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
          // Default to today if not set, or keep existing
          if (!selectedDate) {
            const today = new Date().toISOString().split("T")[0];
            setSelectedDate(today);
          }
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [course, userId]); // Re-fetch when course changes

  // Process data for heatmap
  const getDailyCounts = () => {
    const counts: Record<string, number> = {};
    history.forEach(item => {
      const date = new Date(item.timestamp).toISOString().split("T")[0];
      counts[date] = (counts[date] || 0) + 1;
    });
    return counts;
  };

  const dailyCounts = getDailyCounts();

  // Generate calendar days (Last 35 days based on page)
  const getCalendarDays = () => {
    const days = [];
    // Start from today, go back based on page
    const endDate = new Date();
    // Reset time to avoid timezone issues affecting date calc
    endDate.setHours(12, 0, 0, 0); 
    
    // Shift by page * 35 days
    endDate.setDate(endDate.getDate() - (page * 35));

    // Generate 35 days (5 weeks)
    for (let i = 34; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  };

  const calendarDays = getCalendarDays();

  const getDateRangeLabel = () => {
    if (calendarDays.length === 0) return "";
    const start = new Date(calendarDays[0]);
    const end = new Date(calendarDays[calendarDays.length - 1]);
    return `${start.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - ${end.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`;
  };


  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-50 border-gray-100 text-gray-300";
    if (count < 2) return course === "IB" ? "bg-blue-100 border-blue-200 text-blue-600" : "bg-purple-100 border-purple-200 text-purple-600";
    if (count <= 5) return course === "IB" ? "bg-blue-300 border-blue-400 text-blue-800" : "bg-purple-300 border-purple-400 text-purple-800";
    return course === "IB" ? "bg-blue-500 border-blue-600 text-white" : "bg-purple-500 border-purple-600 text-white";
  };

  const filteredHistory = selectedDate 
    ? history.filter(h => new Date(h.timestamp).toISOString().split("T")[0] === selectedDate)
    : [];

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center font-sans">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-3 hover:bg-white rounded-full text-slate-500 shadow-sm border border-transparent hover:border-slate-200 transition-all">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Calendar className={course === "IB" ? "text-blue-600" : "text-purple-600"} /> 
              Activity Log
            </h1>
          </div>

          {/* Course Toggle */}
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setCourse("IB")}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                course === "IB" 
                  ? "bg-blue-50 text-blue-600 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <BookOpen size={16} /> IB Math
            </button>
            <button
              onClick={() => setCourse("SAT")}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                course === "SAT" 
                  ? "bg-purple-50 text-purple-600 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Book size={16} /> SAT Prep
            </button>
          </div>
        </div>

        {/* Heatmap Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{getDateRangeLabel()}</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                title="Previous days"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Recent days"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-300 uppercase">{d}</div>
            ))}
            {calendarDays.map((dateStr) => {
              const count = dailyCounts[dateStr] || 0;
              const dateObj = new Date(dateStr);
              // Simple check if date is valid (some edge cases in date math might produce weird dates if not careful, but ISO string usually ok)
              const isToday = dateStr === new Date().toISOString().split("T")[0];
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all relative group
                    ${getColor(count)}
                    ${isSelected 
                      ? (course === "IB" ? "ring-2 ring-blue-500 ring-offset-2 z-10 scale-105" : "ring-2 ring-purple-500 ring-offset-2 z-10 scale-105") 
                      : "hover:scale-105 hover:border-slate-300"}
                  `}
                >
                  <span className={`text-xs font-bold ${count === 0 ? "text-slate-300" : ""}`}>{dateObj.getDate()}</span>
                  {/* {count > 0 && <span className="text-[10px] font-medium opacity-80">{count}</span>} */}
                  {isToday && <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white ${course === "IB" ? "bg-blue-500" : "bg-purple-500"}`} />}
                  
                  {/* Tooltip */}
                  {count > 0 && (
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 shadow-lg pointer-events-none">
                      {dateObj.toLocaleDateString()}: {count} Qs
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="flex justify-end items-center gap-4 mt-4 text-[10px] text-slate-400 font-medium">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-50 border border-gray-100 rounded"></div> 0</div>
            <div className="flex items-center gap-1"><div className={`w-3 h-3 rounded border ${course === "IB" ? "bg-blue-100 border-blue-200" : "bg-purple-100 border-purple-200"}`}></div> 1</div>
            <div className="flex items-center gap-1"><div className={`w-3 h-3 rounded border ${course === "IB" ? "bg-blue-300 border-blue-400" : "bg-purple-300 border-purple-400"}`}></div> 2-5</div>
            <div className="flex items-center gap-1"><div className={`w-3 h-3 rounded border ${course === "IB" ? "bg-blue-500 border-blue-600" : "bg-purple-500 border-purple-600"}`}></div> &gt;5</div>
          </div>
        </div>

        {/* Selected Day List */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Select a date"}
              </h3>
              <p className="text-sm text-slate-500">{filteredHistory.length} questions practiced</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
            {loading ? (
               <div className="text-center py-20 text-slate-400 animate-pulse flex flex-col items-center gap-3">
                 <Loader2 className="animate-spin" />
                 Loading history...
               </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <p>No activity recorded for this day.</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-indigo-200 group">
                  
                  {/* Summary Row */}
                  <div 
                    onClick={() => toggleExpand(item.id)}
                    className="p-4 cursor-pointer flex items-center gap-4 hover:bg-slate-50/50"
                  >
                    <div className="shrink-0">
                      {item.isCorrect ? (
                        <CheckCircle className="text-emerald-500" size={22} />
                      ) : (
                        <XCircle className="text-rose-500" size={22} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`text-sm font-bold truncate ${course === "IB" ? "text-blue-700" : "text-purple-700"}`}>{item.topic}</h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 ml-2">
                          {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate font-serif opacity-80 group-hover:opacity-100 transition-opacity">
                        {item.questionText.substring(0, 80)}...
                      </p>
                    </div>

                    <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                      {expandedId === item.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === item.id && (
                    <div className="p-6 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-2">
                      <div className="mb-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Question</p>
                        <div className="text-slate-800 font-serif text-sm leading-relaxed p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <MathRenderer text={item.questionText} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className={`p-4 rounded-xl border ${item.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">Your Answer</p>
                          <p className="font-mono text-sm font-bold">{item.userAnswer}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60 text-blue-800">Correct Answer</p>
                          <p className="font-mono text-sm font-bold text-blue-700">
                            <MathRenderer text={item.correctAnswer} />
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Explanation</p>
                        <div className="text-sm text-slate-600 leading-relaxed bg-white p-5 rounded-xl border border-slate-200">
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
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
