import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(246,83%,55%)] text-white shadow-lg shadow-indigo-200 hover:translate-y-[-2px] hover:shadow-xl active:translate-y-[0px] active:shadow-md border-b-4 border-indigo-700",
      secondary: "bg-white text-slate-700 shadow-sm border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
      outline: "bg-transparent border-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white",
      ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
      danger: "bg-red-500 text-white shadow-lg shadow-red-200 hover:bg-red-600 border-b-4 border-red-800",
      success: "bg-green-500 text-white shadow-lg shadow-green-200 hover:bg-green-600 border-b-4 border-green-800",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
      xl: "px-10 py-5 text-xl font-bold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "relative inline-flex items-center justify-center rounded-2xl font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:pointer-events-none disabled:saturate-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
