"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IB_SL_AA_SYLLABUS } from "@/data/syllabus";
import { IB_FORMULAS } from "@/data/formulas";
import { Send, RefreshCw, CheckCircle, XCircle, BookOpen, Loader2, Sparkles, Trophy, Book, History, ChevronRight, Calculator, TrendingUp } from "lucide-react";
import MathRenderer from "@/components/MathRenderer";

// Initial state
const INITIAL_QUESTION = {
  id: "",
  topic: "",
  text: "",
  answer: "",
  explanation: "",
};

type MasteryData = { [topicId: string]: { correct: number; total: number } };
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

export default function MathWorkspace() {
  const [selectedTopic, setSelectedTopic] = useState("");
  const [question, setQuestion] = useState(INITIAL_QUESTION);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | "partial" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [userId, setUserId] = useState("");
  
  const [mastery, setMastery] = useState<MasteryData>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // User ID Init
    let uid = localStorage.getItem("ib-math-user-id");
    if (!uid) {
      uid = crypto.randomUUID();
      localStorage.setItem("ib-math-user-id", uid);
    }
    setUserId(uid);

    const savedMastery = localStorage.getItem("ib-math-mastery");
    if (savedMastery) setMastery(JSON.parse(savedMastery));
    const savedHistory = localStorage.getItem("ib-math-history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    if (Object.keys(mastery).length > 0) localStorage.setItem("ib-math-mastery", JSON.stringify(mastery));
  }, [mastery]);

  useEffect(() => {
    if (history.length > 0) localStorage.setItem("ib-math-history", JSON.stringify(history));
  }, [history]);

  const getMasteryLevel = (topicTitle: string) => {
    const stats = mastery[topicTitle];
    if (!stats || stats.total === 0) return "⚪";
    const rate = (stats.correct / stats.total) * 100;
    if (rate >= 70) return "🟢";
    if (rate >= 40) return "🟡";
    return "🔴";
  };

  const generateQuestion = async (topicOverride?: string) => {
    const topicToUse = topicOverride || selectedTopic;
    if (!topicToUse) {
      alert("Please select a topic first!");
      return;
    }
    if (topicOverride) setSelectedTopic(topicOverride);

    setLoading(true);
    setFeedback(null);
    setFeedbackText("");
    setUserAnswer("");
    setShowSolution(false);
    
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicToUse }),
      });
      const data = await res.json();
      if (res.ok) {
        setQuestion({
          id: data.id || Date.now().toString(),
          topic: topicToUse,
          text: data.question_text,
          answer: data.correct_answer,
          explanation: data.explanation || "",
        });
      } else {
        alert("Failed to generate question.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = async () => {
    if (!userAnswer) return;
    setChecking(true);
    
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.text,
          correctAnswer: question.answer,
          topic: question.topic,
          userAnswer: userAnswer,
          questionId: question.id,
          userId: userId,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setFeedback(data.status);
        setFeedbackText(data.feedback);
        const isCorrect = data.status === "correct";
        
        setMastery(prev => {
          const currentStats = prev[question.topic] || { correct: 0, total: 0 };
          return {
            ...prev,
            [question.topic]: {
              total: currentStats.total + 1,
              correct: currentStats.correct + (isCorrect ? 1 : 0)
            }
          };
        });

        const newHistoryItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          topic: question.topic,
          questionText: question.text,
          userAnswer: userAnswer,
          correctAnswer: question.answer,
          explanation: question.explanation,
          isCorrect: isCorrect,
        };
        setHistory(prev => [newHistoryItem, ...prev]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const recommendTopic = () => {
    let worstTopic = "";
    let minScore = 101;
    const allSubtopics = IB_SL_AA_SYLLABUS.flatMap(t => t.subtopics);
    for (const sub of allSubtopics) {
      const stats = mastery[sub.title];
      if (stats && stats.total > 0) {
        const score = (stats.correct / stats.total) * 100;
        if (score < minScore) {
          minScore = score;
          worstTopic = sub.title;
        }
      }
    }
    if (!worstTopic) worstTopic = allSubtopics[0].title;
    generateQuestion(worstTopic);
  };

  const getParentTopic = (subTitle: string) => {
    for (const topic of IB_SL_AA_SYLLABUS) {
      if (topic.subtopics.some(s => s.title === subTitle)) return topic.title;
    }
    return null;
  };

  const currentParentTopic = getParentTopic(selectedTopic || question.topic);
  const relevantFormulas = currentParentTopic ? IB_FORMULAS[currentParentTopic] : [];

  // Stats
  const stats = history.reduce((acc, item) => {
    const isThisWeek = new Date(item.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (isThisWeek) acc.weekCount++;
    if (item.isCorrect) acc.totalCorrect++;
    return acc;
  }, { weekCount: 0, totalCorrect: 0 });

  const accuracy = history.length > 0 ? Math.round((stats.totalCorrect / history.length) * 100) : 0;
  const mathScore = 1000 + (stats.totalCorrect * 50) + (history.length * 10);

  return (
    <div className="flex min-h-screen w-full bg-slate-50 justify-center font-sans">
      
      {/* Formula Slide-over */}
      {showFormulas && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <Book className="text-blue-600" /> Formulas
              </h2>
              <button onClick={() => setShowFormulas(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">✕</button>
            </div>
            {relevantFormulas && relevantFormulas.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">{currentParentTopic}</h3>
                {relevantFormulas.map((f, i) => (
                  <div key={i} className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                    <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">{f.title}</p>
                    <div className="text-lg text-slate-800 overflow-x-auto"><MathRenderer text={`$${f.latex}$`} /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Calculator size={48} className="mb-4 opacity-20" />
                <p>Select a topic to see formulas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main App Container */}
      <div className="w-full max-w-4xl flex flex-col min-h-screen sm:min-h-0 sm:h-[92vh] sm:my-6 sm:rounded-3xl sm:border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
        
        {/* Modern Header */}
        <header className="px-8 py-6 border-b border-slate-100 bg-white z-20 sticky top-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
              <BookOpen size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">IB Math AA SL</h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFormulas(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-all border border-slate-200"
            >
              <Book size={16} /> Formulas
            </button>
            <button 
              onClick={recommendTopic}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-full transition-all border border-amber-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
              Smart Pick
            </button>
            <Link
              href="/history"
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
              title="History"
            >
              <History size={22} />
            </Link>
          </div>
        </header>

        {/* Stats Dashboard */}
        <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">This Week</p>
            <div className="flex items-center gap-2 text-indigo-600">
              <TrendingUp size={20} />
              <span className="text-2xl font-bold">{stats.weekCount}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Questions Solved</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Accuracy</p>
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle size={20} />
              <span className="text-2xl font-bold">{accuracy}%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Global Rate</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Math Score</p>
            <div className="flex items-center gap-2 text-amber-500">
              <Trophy size={20} />
              <span className="text-2xl font-bold">{mathScore}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Level {Math.floor(mathScore / 500)}</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full sm:w-auto min-w-[300px] p-2.5 pl-4 pr-10 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow shadow-sm cursor-pointer hover:border-blue-300"
          >
            <option value="">Select a Topic to Practice...</option>
            {IB_SL_AA_SYLLABUS.map((topic) => (
              <optgroup key={topic.id} label={topic.title}>
                {topic.subtopics.map((sub) => (
                  <option key={sub.id} value={sub.title}>
                    {getMasteryLevel(sub.title)} {sub.id} {sub.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 scroll-smooth">
          
          {question.text ? (
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Question Card */}
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/40 relative group hover:border-blue-100 transition-colors">
                <div className="absolute -top-3 left-8 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-md shadow-blue-200">
                  Challenge
                </div>
                <div className="text-slate-800 font-serif text-xl leading-relaxed pt-2">
                  <MathRenderer text={question.text} />
                </div>
              </div>

              {/* Interaction Area */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Answer</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Enter value..."
                    className="flex-1 p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-mono text-lg transition-all"
                    onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
                  />
                  <button
                    onClick={checkAnswer}
                    disabled={checking || !userAnswer}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                  >
                    {checking ? <Loader2 size={20} className="animate-spin" /> : "Check Answer"}
                  </button>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1"
                  >
                    {showSolution ? "Hide Solution" : "Stuck? Show Solution"} <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Feedback & Solution */}
              {(showSolution || feedback) && (
                <div className={`rounded-2xl overflow-hidden border animate-in fade-in slide-in-from-top-4 duration-300 ${
                  feedback === "correct" ? "bg-green-50/50 border-green-100" : "bg-slate-50 border-slate-200"
                }`}>
                  {/* Status Banner */}
                  {feedback && (
                    <div className={`p-4 flex items-center gap-3 ${
                      feedback === "correct" ? "bg-green-100/50 text-green-800" : "bg-red-100/50 text-red-800"
                    }`}>
                      {feedback === "correct" ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-600" />}
                      <span className="font-bold text-lg">{feedback === "correct" ? "Correct!" : "Keep Trying"}</span>
                    </div>
                  )}

                  {/* Feedback Text */}
                  {feedback && <div className="p-6 pt-2 text-slate-700 leading-relaxed">{feedbackText}</div>}

                  {/* Full Solution */}
                  {(showSolution || (feedback && feedback !== "correct")) && (
                    <div className="p-6 border-t border-slate-200/60 bg-white/50">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BookOpen size={14} /> Step-by-Step Solution
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                        <p className="text-xs text-slate-400 uppercase mb-1">Answer</p>
                        <p className="text-xl font-bold font-mono text-slate-800"><MathRenderer text={question.answer} /></p>
                      </div>
                      <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                        <MathRenderer text={question.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <div className="bg-blue-50 p-6 rounded-full mb-6">
                <Trophy className="text-blue-600" size={48} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to Practice?</h2>
              <p className="text-slate-500 max-w-md mb-8">Select a topic from the dropdown or use Smart Pick to target your weak spots.</p>
              <button
                onClick={recommendTopic}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200/50 transition-all font-bold flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {loading ? "Generating..." : "Start Smart Session"}
              </button>
            </div>
          )}
        </div>

        {/* Sticky Footer (Only if question active) */}
        {question.text && (
          <div className="p-4 border-t border-slate-100 bg-white z-10 flex justify-center">
            <button
              onClick={() => generateQuestion()}
              className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 hover:shadow-lg transition-all font-bold flex items-center justify-center gap-2"
            >
              Next Question <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
