"use client"

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useRouter } from "next/navigation"

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")

  const [status, setStatus] = useState("loading")

  useEffect(() => {
    if (!token) {
      setStatus("waiting")
      return
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verifyEmail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token })
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Verification failed")
        }

        setStatus("success")
      } catch (error) {
        setStatus("error")
      }
    }

    verify()
  }, [token])

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Card */}
        <div className={styles.card}>
          <h2 className={styles.heading}>Verify Your Email</h2>

          {status === "loading" && (
            <p className={styles.loadingText}>Verifying your email...</p>
          )}

          {status === "waiting" && (
            <p className={styles.waitingText}>
              We've sent you a verification email. Please check your inbox and click the link.
            </p>
          )}

          {status === "success" && (
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

          {status === "error" && (
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
  )
}

const styles = {
  container: "min-h-screen flex items-center justify-center bg-slate-50 px-4",
  wrapper: "w-full max-w-md",
  card: "bg-white rounded-lg shadow p-8 text-center",
  heading: "text-2xl font-bold mb-4 text-slate-900",
  loadingText: "text-slate-700",
  waitingText: "text-slate-700",
  successGroup: "space-y-4",
  successText: "text-green-600 font-medium",
  button: "inline-block px-8 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors",
  errorText: "text-red-600"
};
