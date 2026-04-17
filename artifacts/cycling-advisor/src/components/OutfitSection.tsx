import type { CyclingResult } from "@/features/weather/types";

const INSULATION_KO: Record<string, string> = {
  none: "없음", light: "가벼운", medium: "중간", heavy: "두꺼운",
};

const WATERPROOF_KO: Record<string, string> = {
  none: "없음", water_resistant: "방수처리", waterproof: "완전방수",
};

const CATEGORY_KO: Record<string, string> = {
  head: "머리", torso: "상의", legs: "하의", feet: "발", extras: "악세서리",
};

interface OutfitSectionProps {
  result: CyclingResult;
}

export function OutfitSection({ result }: OutfitSectionProps) {
  if (!result.outfit) {
    return (
      <div
        className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-semibold text-center"
        data-testid="no-outfit-message"
      >
        라이딩 금지 — 극단적 기상 조건으로 복장 추천을 제공할 수 없습니다.
      </div>
    );
  }

  const categories = [
    { key: "head" as const, items: result.outfit.head },
    { key: "torso" as const, items: result.outfit.torso },
    { key: "legs" as const, items: result.outfit.legs },
    { key: "feet" as const, items: result.outfit.feet },
    { key: "extras" as const, items: result.outfit.extras },
  ].filter((c) => c.items.length > 0);

  return (
    <div className="space-y-4" data-testid="outfit-section">
      {categories.map(({ key, items }) => (
        <div key={key}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {CATEGORY_KO[key]}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-card border border-card-border hover:shadow-sm transition-shadow"
                data-testid={`outfit-item-${item.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{item.name_ko}</span>
                      {item.required && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          필수
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.name_en}</div>
                    <div className="text-xs text-muted-foreground mt-1">{item.description_ko}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    보온: {INSULATION_KO[item.insulation_level]}
                  </span>
                  {item.waterproof !== "none" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      {WATERPROOF_KO[item.waterproof]}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {item.material}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
