import { VERDICT_COLORS } from "@/lib/verdictColors";

interface ScoreCircleProps {
  score: number;
  verdict: string;
}

export function ScoreCircle({ score, verdict }: ScoreCircleProps) {
  const colors = VERDICT_COLORS[verdict] ?? VERDICT_COLORS.fair;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center" data-testid="score-circle">
      <div className="relative">
        <svg width="140" height="140" className="-rotate-90">
          <circle
            cx="70" cy="70" r={radius}
            stroke="currentColor" strokeWidth="10" fill="none"
            className="text-muted opacity-30"
          />
          <circle
            cx="70" cy="70" r={radius} strokeWidth="10" fill="none"
            stroke={`hsl(var(--${
              verdict === "excellent" ? "chart-2"
              : verdict === "good"    ? "chart-2"
              : verdict === "fair"    ? "chart-3"
              : verdict === "poor"    ? "chart-4"
              : "chart-5"
            }))`}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground" data-testid="score-value">
            {Math.round(score)}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span
        className={`mt-2 px-4 py-1.5 rounded-full text-sm font-semibold text-white ${colors.badge}`}
        data-testid="verdict-badge"
      >
        {verdict === "excellent" ? "최상"
          : verdict === "good"    ? "좋음"
          : verdict === "fair"    ? "보통"
          : verdict === "poor"    ? "나쁨"
          : "위험"}
      </span>
    </div>
  );
}
