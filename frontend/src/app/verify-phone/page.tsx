"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Phone, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/common";

export default function VerifyPhonePage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verified, setVerified] = useState(false);
  const [sent, setSent] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    console.log("OTP:", otp.join(""));
    setVerified(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 dark:bg-charcoal-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Image src="/images/logo.svg" alt="Ethio Nikah" width={44} height={44} className="rounded-xl border-2 border-accent ring-2 ring-charcoal-900" />
            <span className="font-display font-bold text-xl text-charcoal-900 dark:text-white [-webkit-text-stroke:0.5px_#D4AF37]">
              Ethio <span className="text-accent">Nikah</span>
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Verify Your Phone</h1>
          <p className="text-charcoal-500 dark:text-charcoal-400">Enter the 6-digit code sent to your phone</p>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-8 text-center">
          {verified ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Phone Verified!</h2>
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mb-6">Your phone number has been successfully verified.</p>
              <Link href="/matches"><Button variant="primary" className="w-full">Find Matches</Button></Link>
      </motion.div>
          ) : (
            <div className="py-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-accent" />
              </div>

              <div className="flex items-center justify-center gap-2 mb-6">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-bold border border-charcoal-200 dark:border-charcoal-600 rounded-xl bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-6">
                {sent ? "Code sent! Check your phone." : "Click below to receive a verification code via SMS."}
              </p>

              <div className="space-y-3">
                {!sent ? (
                  <Button variant="primary" className="w-full" onClick={() => setSent(true)}>Send Verification Code</Button>
                ) : (
                  <Button variant="primary" className="w-full" onClick={handleVerify} disabled={otp.some((d) => !d)}>Verify Phone</Button>
                )}
                {sent && <Button variant="ghost" className="w-full text-sm">Resend Code (30s)</Button>}
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
