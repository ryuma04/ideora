"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();//for routing
    const [email, setemail] = useState("");
    const [username, setusername] = useState("");
    const [password, setpassword] = useState("");
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [error, seterror] = useState<string[]>([]);
    const [loading, setloading] = useState(false);
    const user = { username, email, password };

    //for verification
    useEffect(() => {
        if (email.length > 0 && password.length > 0 && username.length > 0) {
            setButtonDisabled(false);
        }
        else {
            setButtonDisabled(true);
        }
    }, [username, email, password])//will trigger when the input field changes

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

        //prevents any double click 
        if (loading) {
            return;
        }
        setloading(true);//user cannot interact with the inputs once the button is clicked
        try {
            seterror([]);
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(user)
            });
            const data = await response.json();
            if (response.ok) {
                console.log("Signed up successfully")
                router.push("/auth/verifyEmail");//directing the user to verify email page after signup
            }
            else {
                seterror([data.error || "Something went wrong"]);
                return;
            }
        } catch (error) {
            console.log("Error signing up", error);
            seterror(["Something went wrong"]);
        } finally {
            setloading(false);
        }
    }
    return (
        <div className={styles.container}>
            <fieldset disabled={loading} className={styles.fieldset}>
                <div className={styles.wrapper}>
                    {/* Form Card */}
                    <div className={styles.card}>
                        <h2 className={styles.heading}>Create account</h2>

                        <div className={styles.inputGroup}>
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className={styles.label}>Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setemail(e.target.value)}
                                    className={styles.input}
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label htmlFor="username" className={styles.label}>Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setusername(e.target.value)}
                                    className={styles.input}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className={styles.label}>Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setpassword(e.target.value)}
                                    className={styles.input}
                                />
                            </div>

                            {/* Error */}
                            {error.length > 0 && (
                                <div className={styles.errorText}>
                                    <ul className="list-disc list-inside">
                                        {error.map((err, index) => (
                                            <li key={index}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Signup Button */}
                            <button
                                onClick={Signup}
                                disabled={buttonDisabled}
                                className={styles.button}
                            >
                                Sign up
                            </button>

                            {/* Login Link */}
                            <p className={styles.linkText}>
                                Already have an account? <a href="/auth/login" className={styles.link}>Sign in</a>
                            </p>
                        </div>
                    </div>
                </div>
            </fieldset>
        </div>
    );
}

const styles = {
    container: "min-h-screen flex items-center justify-center bg-slate-50 px-4",
    fieldset: "w-full",
    wrapper: "max-w-md w-full mx-auto",
    card: "bg-white rounded-lg shadow p-8",
    heading: "text-2xl font-bold text-slate-900 mb-6",
    inputGroup: "space-y-4",
    label: "block text-sm font-medium text-slate-700 mb-1",
    input: "w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
    errorText: "text-red-600 text-sm",
    button: "w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors",
    linkText: "text-center text-sm text-slate-600",
    link: "text-indigo-600 hover:text-indigo-700 font-medium"
};