import Link from "next/link";
import { BookOpen, GraduationCap, ChevronRight, Calculator, PenTool } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Welcome <span className="text-blue-600">Rachel!</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Choose your learning path. Get personalized practice, instant feedback, and track your mastery.
          </p>
        </div>

        {/* Course Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* IB Math Card */}
          <Link 
            href="/practice/ib"
            className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-32 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-100 transition-colors"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                <Calculator size={32} strokeWidth={2} />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">IB Math AA SL</h2>
                <p className="text-slate-500 leading-relaxed">
                  Master the core topics of Analysis and Approaches. Calculus, Algebra, Functions, and more.
                </p>
              </div>

              <div className="flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform">
                Start Practicing <ChevronRight className="ml-2" />
              </div>
            </div>
          </Link>

          {/* SAT Prep Card */}
          <Link 
            href="/practice/sat"
            className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-purple-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-32 bg-purple-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-100 transition-colors"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
                <PenTool size={32} strokeWidth={2} />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">SAT Prep</h2>
                <p className="text-slate-500 leading-relaxed">
                  Ace the Digital SAT. Practice Math, Reading & Writing with adaptive questions.
                </p>
              </div>

              <div className="flex items-center text-purple-600 font-bold group-hover:translate-x-2 transition-transform">
                Start Practicing <ChevronRight className="ml-2" />
              </div>
            </div>
          </Link>

        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-400">
          Powered by Gemini 2.0 Flash • Custom built for your success
        </div>
      </div>
    </main>
  );
}
