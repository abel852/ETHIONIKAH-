"use client";

import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-background dark:bg-charcoal-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Something went wrong</h1>
        <p className="text-charcoal-500 dark:text-charcoal-400 mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-colors">
            Try Again
          </button>
          <Link href="/" className="px-6 py-3 bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 rounded-xl font-medium hover:bg-charcoal-200 transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
