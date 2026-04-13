'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading');

    useEffect(() => {
        if (!token) {
            setStatus('waiting');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch('/api/auth/verifyEmail', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Verification failed');
                }

                setStatus('success');
            } catch (error) {
                setStatus('error');
            }
        };

        verify();
    }, [token]);

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.card}>
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className={styles.heading}>Verify Your Email</h2>

                    {status === 'loading' && (
                        <p className={styles.loadingText}>Verifying your email...</p>
                    )}

                    {status === 'waiting' && (
                        <p className={styles.waitingText}>
                            We've sent you a verification email. Please check your inbox and click the link.
                        </p>
                    )}

                    {status === 'success' && (
                        <div className={styles.successGroup}>
                            <p className={styles.successText}>Email verified successfully!</p>
                            <Link
                                href="/auth/login"
                                className={styles.button}
                            >
                                Go to Login
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <p className={styles.errorText}>Email verification failed. Please try again.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}

const styles = {
    container: 'relative min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 sm:px-6 lg:px-8',
    wrapper: 'max-w-[420px] w-full mx-auto z-10',
    card: 'bg-white rounded-2xl shadow-[0_0_50px_-12px_rgba(79,70,229,0.25)] ring-1 ring-indigo-500/20 p-8 sm:p-10 text-center opacity-0 animate-fade-in-up relative',
    heading: 'text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 mb-6',
    loadingText: 'text-slate-600',
    waitingText: 'text-slate-600 leading-relaxed',
    successGroup: 'space-y-6 mt-4',
    successText: 'text-green-600 font-medium bg-green-50 py-3 px-4 rounded-xl border border-green-100',
    button: 'inline-block w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200 shadow-sm shadow-indigo-600/20',
    errorText: 'text-red-600 bg-red-50 py-3 px-4 rounded-xl border border-red-100 mt-4'
};