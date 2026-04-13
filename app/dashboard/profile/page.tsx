"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use state for user data
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/dashboard/profile');
        const resData = await response.json();

        if (!response.ok) {
          throw new Error(resData.error || "Failed to fetch profile");
        }

        const data = resData.data;
        if (data) {
          setUsername(data.username);
          setEmail(data.email);
          setIsVerified(data.isVerified);
          setProfileImage(data.profileImage || "");
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout');
      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Logged out successfully");
        router.push('/auth/login');
      } else {
        // Still redirect to ensure user isn't stuck
        router.push('/auth/login');
      }
    } catch (error: any) {
      console.error("Logout error:", error);
      //logout even after catching the error
      router.push('/auth/login');
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type locally if needed (optional since backend does too)
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    try {
      const response = await fetch('/api/dashboard/profile', {
        method: 'POST',
        body: formData,
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to upload image");
      }

      if (resData.success) {
        setProfileImage(resData.imageUrl);
        toast.success("Profile image updated!");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      <Toaster />

      {/* Mobile Sidebar Overlay */}
      <div 
          onClick={() => setIsSidebarOpen(false)} 
          className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      ></div>
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-[280px] bg-white backdrop-blur-xl border-r border-slate-200/60 p-6 flex flex-col z-50 lg:relative lg:translate-x-0 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Close button for mobile */}
        <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Ideora</span>
        </div>

        <nav className="flex-1 space-y-1">
            <button onClick={() => router.push('/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 font-medium transition-all active:scale-[0.98]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Meetings
            </button>

            <button onClick={() => router.push('/dashboard/documents')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 font-medium transition-all active:scale-[0.98]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Documents
            </button>

            <button onClick={() => router.push('/dashboard/mom')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 font-medium transition-all active:scale-[0.98]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                MOM
            </button>

            <button onClick={() => router.push('/dashboard/meetingHistory')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 rounded-xl hover:bg-slate-100/80 hover:text-slate-900 font-medium transition-all active:scale-[0.98]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Meeting History
            </button>
        </nav>
      </aside>

      {/* Content Display */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 sm:px-8 py-5 flex items-center justify-between sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4">
                {/* Hamburger menu for mobile */}
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">Your Account</h1>
            </div>
            
            <div className="relative group cursor-pointer inline-block" onClick={() => router.push('/dashboard/profile')}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-0 blur transition duration-300"></div>
                <img
                    src={profileImage || "/profile_image.png"}
                    alt="Profile"
                    className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-sm"
                />
            </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-10">
            <div className="max-w-2xl mx-auto w-full animate-[fade-in-up_0.6s_ease-out_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>

              {/* Profile Card */}
              <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 sm:p-12 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <svg className="w-32 h-32 text-indigo-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                </div>

                <div className="relative z-10">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 sm:mb-10">Profile Setup</h2>

                    {/* Profile Image */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start mb-10 sm:mb-12 relative group gap-6">
                        <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                        />
                        <div className="relative cursor-pointer" onClick={handleImageClick}>
                          <img
                              src={profileImage || "/profile_image.png"}
                              alt="Profile"
                              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shadow-sm border border-slate-200 object-cover ${uploading ? 'opacity-50' : 'group-hover:opacity-90 transition-opacity'}`}
                          />
                          {uploading && (
                              <div className="absolute inset-0 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                              </div>
                          )}
                          <div className="absolute -bottom-2 -right-2 bg-indigo-600 rounded-xl p-2 border-[3px] border-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                          </div>
                        </div>
                        <div className="text-center sm:text-left">
                            <p className="font-bold text-slate-900 text-lg">Update Photo</p>
                            <p className="text-sm text-slate-500 font-medium mt-1">Tap the image to upload a new profile picture.</p>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="space-y-6">
                        {/* Username */}
                        <div>
                        <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Username</label>
                        <div className="px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 text-slate-900 min-h-[56px] font-bold text-lg flex items-center">
                            {loading ? <span className="animate-pulse bg-slate-200 h-5 w-32 block rounded"></span> : username}
                        </div>
                        </div>

                        {/* Email */}
                        <div>
                        <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Email Address</label>
                        <div className="px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 text-slate-900 min-h-[56px] font-bold text-lg flex items-center">
                            {loading ? <span className="animate-pulse bg-slate-200 h-5 w-48 block rounded"></span> : email}
                        </div>
                        </div>

                        {/* Verification Status */}
                        <div>
                        <label className="block text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Verification Status</label>
                        <div className="px-5 py-4 border border-slate-100 rounded-2xl bg-slate-50 flex items-center gap-3 min-h-[56px]">
                            {loading ? (
                            <span className="animate-pulse bg-slate-200 h-5 w-28 block rounded"></span>
                            ) : (
                            isVerified ? (
                                <>
                                <div className="p-1 px-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg flex items-center gap-2">
                                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="font-bold text-sm uppercase tracking-wide">Verified Account</span>
                                </div>
                                </>
                            ) : (
                                <>
                                <div className="p-1 px-3 bg-red-50 text-red-700 border border-red-100 rounded-lg flex items-center gap-2">
                                  <svg className="w-4 h-4 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  <span className="font-bold text-sm uppercase tracking-wide">Not Verified</span>
                                </div>
                                </>
                            )
                            )}
                        </div>
                        </div>
                        
                        <div className="pt-8 sm:pt-10 mt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                            {/* Back to Dashboard */}
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex-1 py-4 border-2 border-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98] shadow-sm"
                            >
                                Back to Dashboard
                            </button>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="px-8 py-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-100 transition-all active:scale-[0.98] shadow-sm"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}