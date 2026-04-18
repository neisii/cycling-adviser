interface RidingBannerProps {
  reason: string;
}

export function RidingBanner({ reason }: RidingBannerProps) {
  return (
    <div
      className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 text-center"
      data-testid="extreme-weather-banner"
    >
      <div className="text-2xl font-bold text-red-700 dark:text-red-400 mb-1">라이딩 금지</div>
      <div className="text-sm text-red-600 dark:text-red-500">{reason}</div>
    </div>
  );
}
