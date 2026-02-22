export function ClimateWidget() {
  // Simulated — will be replaced with real sensor/weather data in Phase 6
  return (
    <div className="bg-white rounded-[32px] shadow-[0px_4px_24px_rgba(0,0,0,0.06)] p-4 flex items-center gap-4">
      <div className="p-3 bg-brand-card rounded-[12px]">
        <span className="text-2xl select-none">🌡️</span>
      </div>
      <div>
        <p className="text-xs font-semibold text-brand-carbon/50 uppercase tracking-wide">
          Indoor Climate
        </p>
        <p className="text-lg font-bold text-brand-carbon">72°F · 55% RH</p>
        <p className="text-xs text-brand-green font-semibold">
          Good for most tropicals
        </p>
      </div>
    </div>
  );
}
