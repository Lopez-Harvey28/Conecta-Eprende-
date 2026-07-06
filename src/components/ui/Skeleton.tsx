interface SkeletonProps {
  count?: number;
  height?: string | number;
  variant?: "text" | "rect" | "circle";
  className?: string;
}

export function Skeleton({
  count = 3,
  height,
  variant = "rect",
  className = "",
}: SkeletonProps) {
  const variantClass = variant === "circle" ? "skeleton-circle" : variant === "text" ? "skeleton-text" : "skeleton-rect";

  return (
    <div className="skeleton-list" role="status" aria-label="Cargando...">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`skeleton-item ${variantClass} ${className}`}
          style={height ? { height } : undefined}
        />
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`skeleton-text-group ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="skeleton-item skeleton-text"
          style={{ width: i === lines - 1 ? "65%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-card ${className}`}>
      <div className="skeleton-item skeleton-rect" style={{ height: 180 }} />
      <div className="skeleton-card-body">
        <div className="skeleton-item skeleton-text" style={{ width: "40%" }} />
        <div className="skeleton-item skeleton-text" style={{ width: "75%" }} />
        <div className="skeleton-item skeleton-text" style={{ width: "55%" }} />
      </div>
    </div>
  );
}