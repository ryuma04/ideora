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
    container: "min-h-screen flex items-center justify-center bg-slate-50 px-4",
    wrapper: "w-full max-w-md",
    card: "bg-white rounded-lg shadow p-8",
    heading: "text-2xl font-bold text-slate-900 mb-2",
    subtext: "text-sm text-slate-600 mb-6",
    inputGroup: "space-y-4",
    label: "block text-sm font-medium text-slate-700 mb-1",
    input: "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400",
    button: "w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-colors",
    linkText: "text-center text-sm",
    link: "text-indigo-600 hover:text-indigo-700 font-medium"
};