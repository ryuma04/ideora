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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Toaster />
      <div className="w-full max-w-lg">

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">Profile</h2>

          {/* Profile Image */}
          <div className="flex justify-center mb-6 relative group">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <div className="relative cursor-pointer" onClick={handleImageClick}>
              <img
                // setting the profile image as the dafault image if the user has not uploaded any image
                src={profileImage || "/profile_image.png"}
                alt="Profile"
                className={`w-24 h-24 rounded-full border-4 border-indigo-100 object-cover ${uploading ? 'opacity-50' : 'group-hover:opacity-90 transition-opacity'}`}
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1 border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 min-h-[42px]">
                {loading ? <span className="animate-pulse bg-slate-200 h-4 w-24 block rounded"></span> : username}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 min-h-[42px]">
                {loading ? <span className="animate-pulse bg-slate-200 h-4 w-32 block rounded"></span> : email}
              </div>
            </div>

            {/* Verification Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Verification Status</label>
              <div className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 flex items-center gap-2 min-h-[42px]">
                {loading ? (
                  <span className="animate-pulse bg-slate-200 h-4 w-20 block rounded"></span>
                ) : (
                  isVerified ? (
                    <>
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-600 font-medium">Verified</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-600 font-medium">Not Verified</span>
                    </>
                  )
                )}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 mt-4 transition-colors"
            >
              Logout
            </button>

            {/* Back to Dashboard */}
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}