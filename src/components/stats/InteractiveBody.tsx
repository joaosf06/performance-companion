import { useState } from "react";

export interface BodyStat {
  zone: string;
  label: string;
  value: number;
}

interface InteractiveBodyProps {
  stats: BodyStat[];
  onZoneClick?: (zone: string) => void;
}

const BODY_ZONES: Record<string, { cx: number; cy: number; labelX: number; labelY: number; side: "left" | "right" }> = {
  head:       { cx: 150, cy: 45,  labelX: 260, labelY: 45,  side: "right" },
  chest:      { cx: 150, cy: 120, labelX: 40,  labelY: 120, side: "left" },
  left_arm:   { cx: 108, cy: 155, labelX: 15,  labelY: 170, side: "left" },
  right_arm:  { cx: 192, cy: 155, labelX: 260, labelY: 170, side: "right" },
  torso:      { cx: 150, cy: 185, labelX: 40,  labelY: 195, side: "left" },
  left_leg:   { cx: 132, cy: 290, labelX: 15,  labelY: 290, side: "left" },
  right_leg:  { cx: 168, cy: 290, labelX: 260, labelY: 290, side: "right" },
  left_foot:  { cx: 128, cy: 370, labelX: 15,  labelY: 370, side: "left" },
  right_foot: { cx: 172, cy: 370, labelX: 260, labelY: 370, side: "right" },
};

const ZONE_LABELS: Record<string, string> = {
  head: "Cabeça",
  chest: "Peito",
  left_arm: "Braço Esq.",
  right_arm: "Braço Dir.",
  torso: "Tronco",
  left_leg: "Perna Esq.",
  right_leg: "Perna Dir.",
  left_foot: "Pé Esq.",
  right_foot: "Pé Dir.",
};

const InteractiveBody = ({ stats, onZoneClick }: InteractiveBodyProps) => {
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const statsByZone = new Map<string, BodyStat[]>();
  stats.forEach((s) => {
    const arr = statsByZone.get(s.zone) || [];
    arr.push(s);
    statsByZone.set(s.zone, arr);
  });

  const handleZoneClick = (zone: string) => {
    setActiveZone(activeZone === zone ? null : zone);
    onZoneClick?.(zone);
  };

  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <svg viewBox="0 0 300 420" className="w-full h-auto">
        {/* Human body silhouette */}
        <g fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" opacity="0.6">
          {/* Head */}
          <ellipse cx="150" cy="40" rx="22" ry="28" />
          {/* Neck */}
          <line x1="150" y1="68" x2="150" y2="80" />
          {/* Shoulders */}
          <line x1="110" y1="90" x2="190" y2="90" />
          {/* Torso */}
          <path d="M110,90 L110,200 Q110,210 120,215 L180,215 Q190,210 190,200 L190,90" />
          {/* Left arm */}
          <path d="M110,90 Q95,130 100,170 Q102,185 95,200" />
          {/* Right arm */}
          <path d="M190,90 Q205,130 200,170 Q198,185 205,200" />
          {/* Left leg */}
          <path d="M120,215 Q118,280 125,340 Q126,360 120,380" />
          {/* Right leg */}
          <path d="M180,215 Q182,280 175,340 Q174,360 180,380" />
          {/* Feet */}
          <path d="M120,380 Q115,390 110,390" />
          <path d="M180,380 Q185,390 190,390" />
        </g>

        {/* Clickable zone hotspots */}
        {Object.entries(BODY_ZONES).map(([zone, pos]) => {
          const zoneStats = statsByZone.get(zone);
          const hasStats = zoneStats && zoneStats.length > 0;
          const isActive = activeZone === zone;

          return (
            <g key={zone}>
              {/* Hotspot circle */}
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r={isActive ? 14 : 10}
                className={`cursor-pointer transition-all duration-200 ${
                  hasStats
                    ? isActive
                      ? "fill-primary/40 stroke-primary"
                      : "fill-primary/20 stroke-primary/60"
                    : "fill-muted/30 stroke-muted-foreground/30"
                }`}
                strokeWidth={isActive ? 2 : 1}
                onClick={() => handleZoneClick(zone)}
              />
              {hasStats && (
                <circle cx={pos.cx} cy={pos.cy} r="3" className="fill-primary pointer-events-none" />
              )}

              {/* Arrow + label (always visible if has stats, detailed if active) */}
              {hasStats && (
                <g className="animate-fade-in">
                  {/* Arrow line */}
                  <line
                    x1={pos.cx}
                    y1={pos.cy}
                    x2={pos.labelX + (pos.side === "left" ? 40 : -40)}
                    y2={pos.labelY}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    strokeDasharray={isActive ? "0" : "3,3"}
                    opacity={isActive ? 1 : 0.5}
                  />
                  {/* Arrow tip */}
                  <circle
                    cx={pos.labelX + (pos.side === "left" ? 40 : -40)}
                    cy={pos.labelY}
                    r="2"
                    className="fill-primary"
                  />

                  {/* Label background */}
                  <rect
                    x={pos.side === "left" ? pos.labelX - 5 : pos.labelX - 5}
                    y={pos.labelY - 12}
                    width={isActive ? 90 : 70}
                    height={isActive ? 14 + zoneStats.length * 14 : 22}
                    rx="4"
                    className={isActive ? "fill-card stroke-border" : "fill-card/80 stroke-border/50"}
                    strokeWidth="0.5"
                  />

                  {/* Zone name */}
                  <text
                    x={pos.side === "left" ? pos.labelX : pos.labelX}
                    y={pos.labelY}
                    className="fill-foreground text-[9px] font-medium"
                  >
                    {ZONE_LABELS[zone] || zone}
                  </text>

                  {/* Stat values (detailed when active) */}
                  {isActive
                    ? zoneStats.map((s, i) => (
                        <text
                          key={i}
                          x={pos.side === "left" ? pos.labelX : pos.labelX}
                          y={pos.labelY + 14 + i * 14}
                          className="fill-primary text-[8px] font-bold"
                        >
                          {s.label}: {s.value}
                        </text>
                      ))
                    : (
                        <text
                          x={pos.side === "left" ? pos.labelX + 50 : pos.labelX + 50}
                          y={pos.labelY}
                          className="fill-primary text-[9px] font-bold"
                          textAnchor="end"
                        >
                          {zoneStats.reduce((sum, s) => sum + s.value, 0)}
                        </text>
                      )}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export { BODY_ZONES, ZONE_LABELS };
export default InteractiveBody;
