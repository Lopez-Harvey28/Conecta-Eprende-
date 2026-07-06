import { type TextareaHTMLAttributes, forwardRef } from "react";
import { AlertCircle } from "lucide-react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, hint, error, className = "", id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className={`field-group ${error ? "field-has-error" : ""}`}>
        {label && (
          <label htmlFor={textareaId} className="field-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`field-input field-textarea ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {error && (
          <span id={`${textareaId}-error`} className="field-error" role="alert">
            <AlertCircle size={13} />
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={`${textareaId}-hint`} className="field-hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";