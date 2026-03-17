"use client";
import React from 'react';

//for redirecting to login page
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-tight">Ideora</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">How it Works</a>
            <button
              onClick={() => router.push("/auth/signup")}
              className="px-5 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all"
            >
              New user? Sign Up
            </button>
            <button
              //redirected to login page
              onClick={() => router.push("/auth/login")}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-600/25"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-8">
            <div className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-900 text-xs font-medium rounded-full tracking-wide uppercase animate-fade-in">
              Where Ideas Are Born
            </div>
            <h1 className="text-6xl font-bold leading-tight tracking-tight animate-slide-up">
              Meetings that
              <span className="block text-indigo-600 mt-2">deliver results</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed animate-slide-up max-w-2xl mx-auto" style={{ animationDelay: '0.1s' }}>
              Transform brainstorming sessions into structured action plans. Ideora turns collaborative discussions into documented decisions with automated meeting minutes.
            </p>
            <div className="flex gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <button
                onClick={() => router.push('/meeting/joinMeeting')}
                className="px-8 py-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5"
              >
                Join as Guest
              </button>
            </div>
            <div className="flex items-center justify-center gap-8 pt-4 text-sm text-slate-500 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No account required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Instant setup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Built for clarity and action</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Every feature designed to turn meeting discussions into structured, actionable outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Structured Brainstorming</h3>
              <p className="text-slate-600 leading-relaxed">
                Organize ideas using categorized cards instead of messy whiteboards. Prioritize, tag, and link ideas in real-time.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Automated Minutes</h3>
              <p className="text-slate-600 leading-relaxed">
                Generate comprehensive meeting minutes automatically. Capture decisions, action items, and key discussion points without manual note-taking.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Automation</h3>
              <p className="text-slate-600 leading-relaxed">
                Event-driven AI handles documentation, task extraction, and follow-up preparation within controlled boundaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple workflow, powerful results</h2>
            <p className="text-xl text-slate-600">Four steps to transform your meetings</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto shadow-lg shadow-indigo-600/25">
                1
              </div>
              <h3 className="text-lg font-semibold">Create Meeting</h3>
              <p className="text-slate-600 text-sm">Set up your meeting room and invite participants instantly</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto shadow-lg shadow-indigo-600/25">
                2
              </div>
              <h3 className="text-lg font-semibold">Collaborate</h3>
              <p className="text-slate-600 text-sm">Use structured idea cards to brainstorm and categorize thoughts</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto shadow-lg shadow-indigo-600/25">
                3
              </div>
              <h3 className="text-lg font-semibold">Decide & Assign</h3>
              <p className="text-slate-600 text-sm">Mark decisions and create action items with clear ownership</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto shadow-lg shadow-indigo-600/25">
                4
              </div>
              <h3 className="text-lg font-semibold">Generate Minutes</h3>
              <p className="text-slate-600 text-sm">Automatically produce structured meeting documentation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-lg font-semibold">Ideora</span>
            </div>

            <div className="text-sm text-slate-500 text-center">
              <p>Ideora - Where Ideas Are Born.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}