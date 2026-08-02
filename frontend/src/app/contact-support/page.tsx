"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, MessageSquare, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/common";
import api from "@/lib/api";

export default function ContactSupportPage() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!email || !email.includes("@")) {
      setSubmitError("Please enter a valid email address");
      return;
    }
    if (!subject || subject.trim().length < 3) {
      setSubmitError("Subject is required (min 3 characters)");
      return;
    }
    if (!message || message.trim().length < 10) {
      setSubmitError("Message is required (min 10 characters)");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/complaints/contact", { email, subject, description: message }, { _noRedirect: true } as any);
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to send message. Please try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Contact Support</h1>
          <p className="text-charcoal-500 dark:text-charcoal-400">Send us a message and we&apos;ll get back to you at your email</p>
        </div>

        <div className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-card border border-charcoal-100/50 dark:border-charcoal-700 p-8">
          {submitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-white mb-2">Message Sent!</h2>
              <p className="text-charcoal-500 dark:text-charcoal-400 text-sm mb-6">
                Your message has been sent to our support team. We will get back to you at <strong>{email}</strong> as soon as possible.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">Back to Sign In</Button>
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  Your Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.replace(/[^a-zA-Z0-9@.]/g, ""))}
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-300 dark:placeholder-charcoal-600 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  Subject
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    disabled={isSubmitting}
                    maxLength={100}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-300 dark:placeholder-charcoal-600 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  disabled={isSubmitting}
                  rows={5}
                  maxLength={1000}
                  className="w-full px-4 py-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-700 border border-charcoal-200 dark:border-charcoal-600 text-charcoal-900 dark:text-white placeholder-charcoal-300 dark:placeholder-charcoal-600 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all resize-none"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full" size="lg" loading={isSubmitting}>
                <Send className="w-4 h-4 mr-1" />
                Send Message
              </Button>

              {submitError && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

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
