import { type InputHTMLAttributes, forwardRef } from "react";
import { AlertCircle } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, className = "", id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className={`field-group ${error ? "field-has-error" : ""}`}>
        {label && (
          <label htmlFor={inputId} className="field-label">
            {icon && <span className="field-label-icon">{icon}</span>}
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`field-input ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} className="field-error" role="alert">
            <AlertCircle size={13} />
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={`${inputId}-hint`} className="field-hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";