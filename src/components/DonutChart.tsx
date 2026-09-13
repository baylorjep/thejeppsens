"use client";

const PALETTE = ["#111827", "#d97706", "#0ea5e9", "#059669", "#e11d48", "#7c3aed", "#64748b", "#9ca3af"];

type DonutChartProps = {
  items: { label: string; count: number }[];
  size?: number;
  formatCount?: (count: number) => string;
  onSelectLabel?: (label: string) => void;
  selectedLabel?: string | null;
};

export default function DonutChart({
  items,
  size = 160,
  formatCount = (count) => String(count),
  onSelectLabel,
  selectedLabel,
}: DonutChartProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (!total) return null;

  const radius = size / 2;
  const strokeWidth = size * 0.22;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;

  let offset = 0;
  const segments = items.map((item, index) => {
    const fraction = item.count / total;
    const dash = fraction * circumference;
    const segment = {
      ...item,
      color: PALETTE[index % PALETTE.length],
      dashArray: `${dash} ${circumference - dash}`,
      dashOffset: -offset,
    };
    offset += dash;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
        {segments.map((segment) => (
          <circle
            key={segment.label}
            cx={radius}
            cy={radius}
            r={innerRadius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={segment.dashArray}
            strokeDashoffset={segment.dashOffset}
            opacity={selectedLabel && selectedLabel !== segment.label ? 0.35 : 1}
            className={onSelectLabel ? "cursor-pointer transition-opacity" : undefined}
            onClick={onSelectLabel ? () => onSelectLabel(segment.label) : undefined}
          />
        ))}
      </svg>
      <div className="flex flex-1 flex-col gap-1.5">
        {items.map((item, index) => {
          const pct = Math.round((item.count / total) * 100);
          const isSelected = selectedLabel === item.label;
          return (
            <div
              key={item.label}
              role={onSelectLabel ? "button" : undefined}
              tabIndex={onSelectLabel ? 0 : undefined}
              onClick={onSelectLabel ? () => onSelectLabel(item.label) : undefined}
              onKeyDown={
                onSelectLabel
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectLabel(item.label);
                      }
                    }
                  : undefined
              }
              className={`flex items-center gap-2 rounded-md px-1 py-0.5 text-sm ${
                onSelectLabel ? "cursor-pointer transition-colors hover:bg-gray-50" : ""
              } ${isSelected ? "bg-gray-50" : ""}`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
              />
              <span className={`min-w-0 flex-1 truncate ${isSelected ? "font-medium text-gray-950" : "text-gray-700"}`}>
                {item.label}
              </span>
              <span className="shrink-0 tabular-nums text-gray-500">
                {formatCount(item.count)} · {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
