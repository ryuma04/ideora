'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';

function ResetPasswordForm() {
    const [newpassword, setnewpassword] = useState('');
    const [confirmnewpassword, setconfirmnewpassword] = useState('');
    const [buttondisabled, setbuttondisabled] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const params = useSearchParams();
    const token = params.get('token');

    useEffect(() => {
        if (newpassword.length > 0 && newpassword === confirmnewpassword) {
            setbuttondisabled(false);
        } else if (newpassword.length < 5) {
            setbuttondisabled(true);
        }
    }, [newpassword, confirmnewpassword]);

    const send = async () => {
        try {
            const res = await fetch('/api/auth/resetPassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, password: newpassword })
            });

            const data = await res.json();

            if (res.ok) {
                setMessageType('success');
                setMessage('Password reset successful');
            } else {
                setMessageType('error');
                setMessage(data.error || 'Error in resetting password');
            }
        } catch (error) {
            setMessageType('error');
            setMessage('Error in resetting password');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.card}>
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className={styles.heading}>Reset password</h2>

                    {messageType === 'success' ? (
                        <div className="space-y-4">
                            <p className="text-green-600 text-center font-medium">
                                {message}
                            </p>
                        </div>
                    ) : (
                        <div className={styles.inputGroup}>
                            <div>
                                <label className={styles.label}>New password</label>
                                <input
                                    type="password"
                                    placeholder="Enter new password"
                                    value={newpassword}
                                    onChange={(e) => setnewpassword(e.target.value)}
                                    className={styles.input}
                                />
                            </div>

                            <div>
                                <label className={styles.label}>Confirm password</label>
                                <input
                                    type="password"
                                    placeholder="Re-enter new password"
                                    value={confirmnewpassword}
                                    onChange={(e) => setconfirmnewpassword(e.target.value)}
                                    className={styles.input}
                                />
                            </div>

                            {messageType === 'error' && (
                                <p className="text-red-600 text-sm">{message}</p>
                            )}

                            <button
                                onClick={send}
                                disabled={buttondisabled}
                                className={styles.button}
                            >
                                Reset password
                            </button>
                        </div>
                    )}

                    <p className={styles.linkText + (messageType === 'success' ? ' mt-6' : ' mt-4')}>
                        <a href="/auth/login" className={styles.link}>Back to sign in</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}

const styles = {
    container: 'relative min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8',
    wrapper: 'max-w-[420px] w-full mx-auto z-10',
    card: 'bg-white rounded-2xl shadow-[0_0_50px_-12px_rgba(79,70,229,0.25)] ring-1 ring-indigo-500/20 p-8 sm:p-10 opacity-0 animate-fade-in-up relative',
    heading: 'text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mb-8 text-center',
    inputGroup: 'space-y-5',
    label: 'block text-sm font-medium text-slate-700 mb-1.5',
    input: 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200',
    button: 'w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all duration-200 shadow-sm shadow-indigo-600/20 mt-2',
    linkText: 'text-center text-sm text-slate-500 mt-6',
    link: 'text-indigo-600 hover:text-indigo-700 font-medium transition-colors'
};