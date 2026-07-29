"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary: "gold-gradient text-white shadow-glow hover:shadow-glow-lg hover:scale-[1.05] active:scale-[0.95] font-cursive font-bold",
  secondary: "bg-white dark:bg-charcoal-800 text-charcoal-800 dark:text-charcoal-200 border border-charcoal-200 dark:border-charcoal-700 hover:border-accent hover:text-accent hover:shadow-soft hover:scale-[1.05] active:scale-[0.95] font-cursive font-bold",
  ghost: "text-charcoal-600 dark:text-charcoal-400 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 hover:text-charcoal-900 dark:hover:text-white hover:scale-[1.05] active:scale-[0.95] font-cursive font-bold",
  outline: "bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-white hover:scale-[1.05] active:scale-[0.95] font-cursive font-bold",
  danger: "bg-red-500 text-white hover:bg-red-600 hover:scale-[1.05] active:scale-[0.95] font-cursive font-bold",
};

const sizes = {
  sm: "px-4 py-2 text-base rounded-lg",
  md: "px-6 py-3 text-base rounded-xl",
  lg: "px-8 py-4 text-lg rounded-xl",
  xl: "px-10 py-5 text-xl rounded-2xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, icon, children, disabled, ...props }, ref) => {
    return (
      <motion.div
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="inline-block"
      >
        <button
          ref={ref}
          className={cn(
            "inline-flex items-center justify-center font-cursive font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
            variants[variant],
            sizes[size],
            className
          )}
          disabled={disabled || loading}
          {...props}
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : icon ? (
            <span className="mr-2">{icon}</span>
          ) : null}
          {children}
        </button>
      </motion.div>
    );
  }
);

Button.displayName = "Button";
export default Button;
