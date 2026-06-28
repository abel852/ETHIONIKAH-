"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zod-resolver";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations";
import { Button, Input } from "@/components/common";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    console.log("Forgot password:", data);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 dark:bg-charcoal-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Image src="/images/logo.png" alt="Ethio Nikah" width={44} height={44} className="rounded-xl border-2 border-accent ring-2 ring-charcoal-900" />
            <span className="font-display font-bold text-xl text-charcoal-900 dark:text-white [-webkit-text-stroke:0.5px_#D4AF37]">
              Ethio <span className="text-accent">Nikah</span>
            </span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Reset Password</h1>
          <p className="text-charcoal-500 dark:text-charcoal-400">Enter your email and we&apos;ll send you a reset link</p>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-8">
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Check Your Email</h2>
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mb-6">
                We&apos;ve sent a password reset link to your email. Please check your inbox and follow the instructions.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">Back to Sign In</Button>
              </Link>
      </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="Enter your registered email"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register("email")}
              />
              <Button type="submit" variant="primary" className="w-full" size="lg" loading={isSubmitting}>
                Send Reset Link
              </Button>
              <div className="text-center">
                <Link href="/login" className="inline-flex items-center gap-1 text-sm text-charcoal-500 dark:text-charcoal-400 hover:text-accent">
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
