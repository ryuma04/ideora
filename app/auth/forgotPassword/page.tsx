"use client"

import React from "react"
import { useState, useEffect } from "react"

export default function ForgotPaswordPage() {
    const [email, setemail] = useState("");
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    useEffect(() => {
        if (email.length > 0) {
            setButtonDisabled(false);
        }
        else if (email.length === 0 || !email.includes("@") || !email.includes(".")) {
            setButtonDisabled(true);
        }
    }, [email]);

    const submit = async () => {
        try {
            const response = await fetch("/api/auth/forgotPassword", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })//since email is a single value thus curly braces is used
            });
            const data = await response.json();

            if (response.ok) {
                setEmailSent(true);
            }
            else {
                console.log("Error from forgot password", data);
            }
        } catch (error) {
            console.log("Error", error)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                {/* Form */}
                <div className={styles.card}>
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className={styles.heading}>Forgot password</h2>

                    {/* here, based on the emailSent state, the message will be displayed */}
                    {!emailSent ? (
                        // true state
                        // here div will wrap all the html elements in the current js code block
                        <div>
                            <p className={styles.subtext}>Enter your registered email and we'll send you a reset link</p>
                            <div className={styles.inputGroup}>
                                <div>
                                    <label className={styles.label}>Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setemail(e.target.value)}
                                        className={styles.input}
                                    />
                                </div>

                                <button
                                    onClick={submit}
                                    disabled={buttonDisabled}
                                    className={styles.button}
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    ) : (
                        // false state
                        <div className="space-y-4">
                            <p className="text-green-600 text-center font-medium">
                                If an account exists for this email, you will receive a reset link.
                            </p>
                        </div>
                    )}

                    <p className={styles.linkText + (emailSent ? " mt-6" : " mt-4")}>
                        <a href="/auth/login" className={styles.link}>Back to sign in</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: "relative min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8",
    wrapper: "max-w-[420px] w-full mx-auto z-10",
    card: "bg-white rounded-2xl shadow-[0_0_50px_-12px_rgba(79,70,229,0.25)] ring-1 ring-indigo-500/20 p-8 sm:p-10 opacity-0 animate-fade-in-up relative",
    heading: "text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mb-2 text-center",
    subtext: "text-sm text-slate-500 mb-6 text-center",
    inputGroup: "space-y-5",
    label: "block text-sm font-medium text-slate-700 mb-1.5",
    input: "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200",
    button: "w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all duration-200 shadow-sm shadow-indigo-600/20 mt-2",
    linkText: "text-center text-sm text-slate-500 mt-6",
    link: "text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
};