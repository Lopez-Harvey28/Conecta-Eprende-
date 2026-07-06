import { type SelectHTMLAttributes, forwardRef } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className={`field-group ${error ? "field-has-error" : ""}`}>
        {label && (
          <label htmlFor={selectId} className="field-label">
            {label}
          </label>
        )}
        <div className="select-wrapper">
          <select
            ref={ref}
            id={selectId}
            className={`field-input field-select ${className}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="select-arrow" size={16} />
        </div>
        {error && (
          <span id={`${selectId}-error`} className="field-error" role="alert">
            <AlertCircle size={13} />
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={`${selectId}-hint`} className="field-hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";