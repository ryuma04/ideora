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
    container: 'min-h-screen flex items-center justify-center bg-slate-50 px-4',
    wrapper: 'w-full max-w-md',
    card: 'bg-white rounded-lg shadow p-8',
    heading: 'text-2xl font-bold mb-6 text-slate-900',
    inputGroup: 'space-y-4',
    label: 'block text-sm font-medium mb-1 text-slate-700',
    input: 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400',
    button: 'w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-colors',
    linkText: 'text-center text-sm',
    link: 'text-indigo-600 hover:text-indigo-700 font-medium'
};