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
  primary: "signup-btn-gold hover:scale-[1.02] active:scale-[0.98]",
  secondary: "signup-btn-outline hover:scale-[1.02] active:scale-[0.98]",
  ghost: "text-[#9CA3AF] hover:text-[#D4AF37] hover:bg-[#232323] hover:scale-[1.02] active:scale-[0.98] font-semibold",
  outline: "signup-btn-outline hover:scale-[1.02] active:scale-[0.98]",
  danger: "bg-red-500 text-white hover:bg-red-600 hover:scale-[1.05] active:scale-[0.95] font-cursive font-bold",
};

const sizes = {
  sm: "px-4 py-2.5 text-sm rounded-xl",
  md: "px-6 py-3.5 text-base rounded-2xl",
  lg: "px-8 py-4 text-base rounded-2xl",
  xl: "px-10 py-5 text-lg rounded-2xl",
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
