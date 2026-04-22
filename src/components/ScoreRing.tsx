"use client";
import clsx from "clsx";

function scoreColor(score: number): string {
  if (score >= 85) return "rgb(34 197 94)";
  if (score >= 70) return "rgb(234 179 8)";
  if (score >= 50) return "rgb(249 115 22)";
  return "rgb(244 63 94)";
}

export function ScoreRing({
  value,
  size = 96,
  label,
  sub,
  className,
}: {
  value: number;
  size?: number;
  label?: string;
  sub?: string;
  className?: string;
}) {
  const color = scoreColor(value);
  return (
    <div className={clsx("flex items-center gap-4", className)}>
      <div
        className="rounded-full flex items-center justify-center relative"
        style={
          {
            width: size,
            height: size,
            background: `conic-gradient(${color} ${value}%, rgba(255,255,255,0.08) 0)`,
          } as React.CSSProperties
        }
      >
        <div
          className="rounded-full bg-[rgb(15_15_30)] flex flex-col items-center justify-center"
          style={{ width: size - 16, height: size - 16 }}
        >
          <div className="text-2xl font-semibold" style={{ color }}>
            {value}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/50">
            score
          </div>
        </div>
      </div>
      {(label || sub) && (
        <div>
          {label && <div className="text-sm font-medium">{label}</div>}
          {sub && <div className="text-xs text-white/50">{sub}</div>}
        </div>
      )}
    </div>
  );
}
