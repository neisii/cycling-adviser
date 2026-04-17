// Shared Tailwind colour tokens for each cycling verdict.
// Kept here so ScoreCircle, ForecastDayCard, and the Home page stay in sync.
export const VERDICT_COLORS: Record<
  string,
  { bg: string; text: string; border: string; badge: string }
> = {
  excellent: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-500",
  },
  good: {
    bg: "bg-lime-50 dark:bg-lime-900/20",
    text: "text-lime-700 dark:text-lime-400",
    border: "border-lime-200 dark:border-lime-800",
    badge: "bg-lime-500",
  },
  fair: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-500",
    border: "border-yellow-200 dark:border-yellow-800",
    badge: "bg-yellow-500",
  },
  poor: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    badge: "bg-orange-500",
  },
  dangerous: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-500",
  },
};
