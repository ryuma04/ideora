"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";

export default function SignupPage() {
    const router = useRouter();
    const [email, setemail] = useState("");
    const [username, setusername] = useState("");
    const [password, setpassword] = useState("");
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [error, seterror] = useState<string[]>([]);
    const [loading, setloading] = useState(false);

    useEffect(() => {
        if (email.length > 0 && password.length > 0 && username.length > 0) {
            setButtonDisabled(false);
        }
        else {
            setButtonDisabled(true);
        }
    }, [username, email, password]);

    const Signup = async () => {
        const tempErrors = [];
        if (!email.includes("@") || !email.includes(".")) {
            tempErrors.push("Email must contain '@' and '.'");
        }
        if (password.length <= 5) {
            tempErrors.push("Password must be greater than 5 characters");
        }

        if (tempErrors.length > 0) {
            seterror(tempErrors);
            return;
        }

        setloading(true);
        try {
            seterror([]);
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success("Welcome aboard!");
                router.push("/auth/verifyEmail");
            }
            else {
                seterror([data.error || "Failed to create account"]);
            }
        } catch (error) {
            console.error("Signup error:", error);
            seterror(["Something went wrong. Please try again."]);
        } finally {
            setloading(false);
        }
    }

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
            <Toaster />

            {/* Background Decorative Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[55%] h-[55%] bg-indigo-100/40 blur-[130px] rounded-full animate-pulse"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[55%] h-[55%] bg-blue-100/30 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <fieldset disabled={loading} className="w-full z-10 max-w-[420px] mx-auto">
                <div className="bg-white rounded-3xl shadow-[0_0_80px_-20px_rgba(79,70,229,0.4)] ring-1 ring-indigo-500/20 p-8 sm:p-10 opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards] relative group">
                    <div className="relative z-10">
                        <div className="flex justify-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 text-center mb-10">Join Ideora</h2>

                        <div className="space-y-6">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest text-[10px]">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setemail(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600/50 transition-all text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal"
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest text-[10px]">Display Name</label>
                                <input
                                    type="text"
                                    placeholder="Choose how you appear"
                                    value={username}
                                    onChange={(e) => setusername(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600/50 transition-all text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest text-[10px]">Secure Key</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setpassword(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600/50 transition-all text-slate-900 font-semibold"
                                />
                            </div>

                            {/* Error */}
                            {error.length > 0 && (
                                <div className="text-red-600 text-[13px] bg-red-50/50 px-4 py-3 rounded-2xl border border-red-100 flex items-start gap-3 animate-shake">
                                    <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <ul className="list-none space-y-1">
                                        {error.map((err, index) => (
                                            <li key={index} className="font-medium animate-in fade-in slide-in-from-left-2 duration-300">{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Signup Button */}
                            <button
                                onClick={Signup}
                                disabled={buttonDisabled}
                                className="w-full py-4.5 px-6 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/20 mt-4"
                            >
                                {loading ? (
                                    <svg className="animate-spin h-6 w-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                {loading ? 'Joining...' : 'Get Instant Access'}
                            </button>

                            {/* Login Link */}
                            <p className="text-center text-sm text-slate-400 font-medium pt-8">
                                Already in our network? <button onClick={() => router.push('/auth/login')} className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors ml-1 underline decoration-2 underline-offset-4">Jump back in</button>
                            </p>
                        </div>
                    </div>
                </div>
            </fieldset>
        </div>
    );
}