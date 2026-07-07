import { type ReactNode } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "./Button";

interface ErrorBannerProps {
  title?: string;
  message?: string;
  children?: ReactNode;
  variant?: "inline" | "banner" | "card";
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
}

export function ErrorBanner({
  title,
  message,
  children,
  variant = "banner",
  onRetry,
  onBack,
  className = "",
}: ErrorBannerProps) {
  const icon = <AlertCircle size={18} />;

  if (variant === "inline") {
    return (
      <div className={`error-inline ${className}`} role="alert">
        {icon}
        <div>
          {title && <strong>{title}</strong>}
          {message && <span>{message}</span>}
          {children}
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`error-card ${className}`} role="alert">
        <div className="error-card-icon">
          <AlertCircle size={28} />
        </div>
        <div className="error-card-body">
          {title && <h3>{title}</h3>}
          {message && <p>{message}</p>}
          {children}
        </div>
        <div className="error-card-actions">
          {onBack && (
            <Button variant="secondary" size="sm" onClick={onBack} icon={<ArrowLeft size={15} />}>
              Volver
            </Button>
          )}
          {onRetry && (
            <Button size="sm" onClick={onRetry} icon={<RefreshCw size={15} />}>
              Reintentar
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`error-banner ${className}`} role="alert">
      <span className="error-banner-icon">{icon}</span>
      <div className="error-banner-body">
        {title && <strong>{title}</strong>}
        {message && <span>{message}</span>}
        {children}
      </div>
      <div className="error-banner-actions">
        {onRetry && (
          <button className="error-retry-btn" onClick={onRetry} type="button">
            <RefreshCw size={14} /> Reintentar
          </button>
        )}
        {onBack && (
          <button className="error-back-btn" onClick={onBack} type="button">
            <ArrowLeft size={14} /> Volver
          </button>
        )}
      </div>
    </div>
  );
}