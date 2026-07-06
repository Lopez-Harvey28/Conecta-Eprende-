import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = false,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "button-sm",
    md: "",
    lg: "button-lg",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: "button-primary",
    secondary: "button-secondary",
    danger: "button-danger",
    ghost: "button-ghost",
  };

  const classes = [
    "button",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "full" : "",
    loading ? "button-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={classes}
      aria-busy={loading}
    >
      {loading ? (
        <Loader2 className="button-spinner" size={16} />
      ) : icon ? (
        <span className="button-icon">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}