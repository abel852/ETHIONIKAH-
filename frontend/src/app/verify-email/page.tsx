"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/common";

export default function VerifyEmailPage() {
  const [verified, setVerified] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 dark:bg-charcoal-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Image src="/app.png" alt="Ethio Nikah" width={44} height={44} className="rounded-xl border-2 border-accent ring-2 ring-charcoal-900" />
            <span className="font-display font-bold text-xl text-charcoal-900 dark:text-white [-webkit-text-stroke:0.5px_#D4AF37]">
              Ethio <span className="text-accent">Nikah</span>
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Verify Your Email</h1>
          <p className="text-charcoal-500 dark:text-charcoal-400">Confirm your email address to activate your account</p>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-8 text-center">
          {verified ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Email Verified!</h2>
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mb-6">Your email has been successfully verified.</p>
              <Link href="/matches"><Button variant="primary" className="w-full">Find Matches</Button></Link>
      </motion.div>
          ) : (
            <div className="py-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-lg font-display font-semibold text-charcoal-900 dark:text-white mb-2">Check Your Inbox</h2>
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mb-6">
                We&apos;ve sent a verification link to your email. Click the link to verify your account.
              </p>
              <div className="space-y-3">
                <Button variant="primary" className="w-full" onClick={() => setVerified(true)}>I&apos;ve Verified My Email</Button>
                <Button variant="ghost" className="w-full text-sm text-charcoal-500">Resend Verification Email</Button>
              </div>
              <div className="mt-6">
                <Link href="/login" className="inline-flex items-center gap-1 text-sm text-charcoal-500 dark:text-charcoal-400 hover:text-accent">
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
