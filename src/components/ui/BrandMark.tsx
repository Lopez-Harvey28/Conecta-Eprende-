interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 44, className = "" }: BrandMarkProps) {
  return (
    <div
      className={`auth-brand-mark ${className}`}
      style={{ width: size, height: size }}
      aria-label="Conecta Emprende"
    >
      CE
    </div>
  );
}