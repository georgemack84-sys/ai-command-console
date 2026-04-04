import * as React from "react";
import { cn } from "@/src/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-white text-slate-950 shadow-[0_16px_40px_rgba(255,255,255,0.14)] hover:bg-slate-100",
  secondary:
    "bg-sky-400/15 text-sky-50 ring-1 ring-inset ring-sky-300/20 hover:bg-sky-400/20",
  outline:
    "border border-white/12 bg-white/5 text-slate-100 hover:bg-white/8 hover:text-white",
  ghost: "text-slate-300 hover:bg-white/6 hover:text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-11 px-5 py-2.5",
  sm: "h-9 rounded-full px-3.5 text-xs",
  lg: "h-12 px-6 text-sm",
  icon: "h-11 w-11",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const buttonVariants = ({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={buttonVariants({ variant, size, className })} {...props} />
  ),
);

Button.displayName = "Button";
