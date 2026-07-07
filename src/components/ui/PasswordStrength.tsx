import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface Rule {
  key: string;
  label: string;
  test: (p: string) => boolean;
}

const RULES: Rule[] = [
  { key: "minLen",   label: "Mínimo 8 caracteres",      test: (p) => p.length >= 8 },
  { key: "hasUpper", label: "Una mayúscula",             test: (p) => /[A-ZÁÉÍÓÚÑ]/.test(p) },
  { key: "hasNumber",label: "Un número",                test: (p) => /[0-9]/.test(p) },
  { key: "hasSpecial",label: "Un carácter especial (opcional)", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

function getStrengthLevel(met: number): "none" | "weak" | "fair" | "good" | "strong" {
  if (met === 0) return "none";
  if (met === 1) return "weak";
  if (met === 2) return "fair";
  if (met === 3) return "good";
  return "strong";
}

export function PasswordStrength({ password, className = "" }: PasswordStrengthProps) {
  if (!password) return null;

  const results = RULES.map((rule) => ({
    ...rule,
    met: rule.test(password),
  }));

  const metCount = results.filter((r) => r.met).length;
  const level = getStrengthLevel(metCount);

  if (level === "none") return null;

  return (
    <div className={`password-strength ${className}`}>
      <div className="password-strength-bar-track">
        <div className={`password-strength-bar-fill password-strength-${level}`} />
      </div>
      <div className="password-strength-rules">
        {results.map((rule) => (
          <div
            key={rule.key}
            className={`password-strength-rule ${rule.met ? "met" : ""}`}
          >
            {rule.met ? <Check size={14} /> : <X size={14} />}
            {rule.label}
          </div>
        ))}
      </div>
    </div>
  );
}