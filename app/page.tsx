"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">

      {/* Full Width Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Ideora</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How it Works</a>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/auth/login")}
              className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/auth/signup")}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 lg:pt-48 pb-20 px-6 sm:px-12 flex flex-col items-center overflow-hidden">
        {/* Abstract Background Top */}
        <div className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none -z-10"></div>

        <div className="max-w-4xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 shadow-sm rounded-full mb-8 cursor-pointer hover:border-indigo-200 transition-colors">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ideora the future of AI Meetings</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.1] tracking-tight mb-6">
            Meetings that
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 mt-2">deliver results.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10 font-medium">
            Transform brainstorming sessions into structured action plans. Ideora turns collaborative discussions into documented decisions with automated minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => router.push('/meeting/joinMeeting')}
              className="px-8 py-4 w-full sm:w-auto bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              Join as Guest
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
            <button
              onClick={() => router.push('/auth/signup')}
              className="px-8 py-4 w-full sm:w-auto bg-white text-indigo-600 border border-indigo-100 font-bold rounded-xl hover:bg-indigo-50/50 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
            >
              Create Workspace
            </button>
          </div>

          <div className="hero-trust-badges mt-14 flex items-center justify-center gap-8 text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              <span>Instant setup</span>
            </div>
          </div>
        </div>


      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Built for clarity and action.</h2>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto">
              Every feature is meticulously designed to turn chaotic discussions into structured, actionable outcomes without forcing you to change how you talk.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-[2rem] bg-slate-50 border border-slate-200/60 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-indigo-100 transition-all duration-300 relative overflow-hidden">
              <div className="w-14 h-14 bg-white border border-slate-200/80 shadow-sm text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 tracking-tight text-slate-900">Structured Boards</h3>
              <p className="text-slate-500 leading-relaxed">
                Organize ideas using categorized cards instead of messy whiteboards. Prioritize, tag, and link ideas in real-time gracefully.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-[2rem] bg-slate-50 border border-slate-200/60 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-indigo-100 transition-all duration-300 relative overflow-hidden">
              <div className="w-14 h-14 bg-white border border-slate-200/80 shadow-sm text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 tracking-tight text-slate-900">Automated Minutes</h3>
              <p className="text-slate-500 leading-relaxed">
                Generate comprehensive meeting minutes out of thin air. Capture decisions, action items, and key discussion points instantly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-[2rem] bg-slate-50 border border-slate-200/60 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-indigo-100 transition-all duration-300 relative overflow-hidden">
              <div className="w-14 h-14 bg-white border border-slate-200/80 shadow-sm text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 tracking-tight text-slate-900">Smart Automation</h3>
              <p className="text-slate-500 leading-relaxed">
                Event-driven AI handles documentation, task extraction, and follow-up preparation within strict, controlled boundaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-[#FAFAFA] border-t border-slate-200/50">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 md:mb-24 flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-center">Four steps to absolute clarity.</h2>
            <p className="text-lg md:text-xl text-slate-500 text-center">A refined workflow that respects your time.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col border-l-2 border-indigo-100 pl-6 relative">
              <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white"></div>
              <span className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wider">Step 1</span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Initialize</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Set up your collaborative meeting room and invite participants instantly.</p>
            </div>

            <div className="flex flex-col border-l-2 border-slate-200 pl-6 relative">
              <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-slate-300 ring-4 ring-[#FAFAFA]"></div>
              <span className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Step 2</span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Collaborate</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Use structured idea cards to brainstorm and intuitively categorize thoughts.</p>
            </div>

            <div className="flex flex-col border-l-2 border-slate-200 pl-6 relative">
              <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-slate-300 ring-4 ring-[#FAFAFA]"></div>
              <span className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Step 3</span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Decide</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Mark decisions properly and create action items with extremely clear ownership.</p>
            </div>

            <div className="flex flex-col border-l-2 border-slate-200 pl-6 relative">
              <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-slate-300 ring-4 ring-[#FAFAFA]"></div>
              <span className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Step 4</span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Dispatch</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Automatically produce structured meeting documentation directly to your inbox.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">Ideora</span>
            </div>

            <div className="text-sm text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} Ideora. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}