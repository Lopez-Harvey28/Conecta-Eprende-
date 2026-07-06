import { type CSSProperties, type ReactNode } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  centered?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function LoadingSpinner({
  size = "md",
  label,
  centered = false,
  className = "",
  style,
}: LoadingSpinnerProps) {
  const sizeMap = { sm: 20, md: 36, lg: 52 };
  const px = sizeMap[size];

  if (centered) {
    return (
      <div className={`spinner-centered ${className}`} style={style}>
        <div className="spinner" style={{ width: px, height: px }} />
        {label && <span className="spinner-label">{label}</span>}
      </div>
    );
  }

  return (
    <div className={`spinner-wrap ${className}`} style={style}>
      <div className="spinner" style={{ width: px, height: px }} />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
}

export function PageLoader({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="page-loader">
      <div className="page-loader-inner">
        <div className="spinner spinner-lg" />
        <span className="spinner-label">{label}</span>
      </div>
    </div>
  );
}

interface SkeletonLoaderProps {
  rows?: number;
  className?: string;
  children?: ReactNode;
}

export function SkeletonLoader({ rows = 4, className = "" }: SkeletonLoaderProps) {
  return (
    <div className={`skeleton-loader ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-item skeleton-rect" />
      ))}
    </div>
  );
}