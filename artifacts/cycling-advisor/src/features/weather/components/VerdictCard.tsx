import { ScoreCircle } from "@/components/ScoreCircle";
import type { VerdictUIModel } from "@/features/weather/mappers/verdictMapper";

interface VerdictCardProps {
  ui: VerdictUIModel;
}

export function VerdictCard({ ui }: VerdictCardProps) {
  return (
    <div
      className={`p-6 rounded-xl border ${ui.colors.border} ${ui.colors.bg}`}
      data-testid="verdict-card"
    >
      <div className="flex items-start gap-6">
        <ScoreCircle score={ui.score} verdict={ui.verdict} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-foreground">
              {Math.round(ui.temp)}°C
            </span>
            <span className="text-sm text-muted-foreground">{ui.cityName}</span>
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            최고 {Math.round(ui.tempMax)}° / 최저 {Math.round(ui.tempMin)}°
          </div>
          <div className="space-y-1" data-testid="reasons-list">
            {ui.reasons.map((reason, i) => (
              <div key={i} className={`text-sm ${ui.colors.text}`}>
                {reason}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
