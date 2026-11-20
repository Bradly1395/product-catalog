interface ProductPlaceholderProps {
  title: string;
  category: string;
  variant?: "card" | "detail" | "thumbnail";
  className?: string;
}

interface PaletteConfig {
  bg: string;
  accent: string;
  stroke: string;
  subtle: string;
  motif: "lighting" | "furniture" | "acoustics" | "hardware" | "geometric";
}

const CATEGORY_PALETTES: Record<string, PaletteConfig> = {
  lighting: {
    bg: "#EAE3D5",
    accent: "#B84A27",
    stroke: "#26231F",
    subtle: "#D5CBB7",
    motif: "lighting",
  },
  furniture: {
    bg: "#E6E4DC",
    accent: "#8A5E3B",
    stroke: "#23221F",
    subtle: "#CFCBC0",
    motif: "furniture",
  },
  acoustics: {
    bg: "#DFE5E0",
    accent: "#2A6B4F",
    stroke: "#1E2622",
    subtle: "#C6D1C9",
    motif: "acoustics",
  },
  hardware: {
    bg: "#E0E4E7",
    accent: "#465B6B",
    stroke: "#1E2328",
    subtle: "#C8CFD5",
    motif: "hardware",
  },
};

const FALLBACK_PALETTES: PaletteConfig[] = [
  {
    bg: "#E9E3D8",
    accent: "#B84A27",
    stroke: "#24211E",
    subtle: "#D3C9B8",
    motif: "geometric",
  },
  {
    bg: "#E2E6E2",
    accent: "#2A6B4F",
    stroke: "#1E2521",
    subtle: "#C9D1C9",
    motif: "geometric",
  },
  {
    bg: "#E3E5E9",
    accent: "#47596B",
    stroke: "#1E2329",
    subtle: "#CAD0D8",
    motif: "geometric",
  },
  {
    bg: "#EAE1DB",
    accent: "#9C4E35",
    stroke: "#28211E",
    subtle: "#D6C6BC",
    motif: "geometric",
  },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getPalette(category: string, title: string): PaletteConfig {
  const key = category.trim().toLowerCase();
  if (CATEGORY_PALETTES[key]) {
    return CATEGORY_PALETTES[key];
  }

  if (key.includes("light") || key.includes("lamp")) {
    return CATEGORY_PALETTES.lighting;
  }
  if (key.includes("furn") || key.includes("desk") || key.includes("chair") || key.includes("table")) {
    return CATEGORY_PALETTES.furniture;
  }
  if (key.includes("acoust") || key.includes("sound") || key.includes("audio")) {
    return CATEGORY_PALETTES.acoustics;
  }
  if (key.includes("hard") || key.includes("tool") || key.includes("rail") || key.includes("storage")) {
    return CATEGORY_PALETTES.hardware;
  }

  const idx = hashString(`${category}:${title}`) % FALLBACK_PALETTES.length;
  return FALLBACK_PALETTES[idx];
}

function getMonogram(title: string): string {
  const words = title
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "PR";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function CategoryMotifSvg({ palette }: { palette: PaletteConfig }) {
  switch (palette.motif) {
    case "lighting":
      return (
        <svg
          viewBox="0 0 240 160"
          className="w-full h-full"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="120" cy="72" r="56" stroke={palette.subtle} strokeWidth="1" />
          <circle cx="120" cy="72" r="38" stroke={palette.stroke} strokeWidth="1.25" strokeDasharray="3 4" />
          <circle cx="120" cy="72" r="18" fill={palette.accent} fillOpacity="0.16" stroke={palette.accent} strokeWidth="1.5" />
          <circle cx="120" cy="72" r="4.5" fill={palette.accent} />
          <line x1="56" y1="72" x2="184" y2="72" stroke={palette.stroke} strokeWidth="1" strokeOpacity="0.35" />
          <line x1="120" y1="16" x2="120" y2="128" stroke={palette.stroke} strokeWidth="1" strokeOpacity="0.35" />
          <path d="M90 124 L150 124" stroke={palette.stroke} strokeWidth="2" />
          <path d="M120 90 L120 124" stroke={palette.stroke} strokeWidth="1.5" />
        </svg>
      );

    case "furniture":
      return (
        <svg
          viewBox="0 0 240 160"
          className="w-full h-full"
          fill="none"
          aria-hidden="true"
        >
          <polygon
            points="54,60 120,32 186,60 120,88"
            fill={palette.accent}
            fillOpacity="0.14"
            stroke={palette.stroke}
            strokeWidth="1.4"
          />
          <polyline
            points="54,60 54,70 120,98 186,70 186,60"
            stroke={palette.stroke}
            strokeWidth="1.25"
          />
          <line x1="70" y1="77" x2="70" y2="126" stroke={palette.stroke} strokeWidth="1.6" />
          <line x1="170" y1="77" x2="170" y2="126" stroke={palette.stroke} strokeWidth="1.6" />
          <line x1="120" y1="98" x2="120" y2="132" stroke={palette.accent} strokeWidth="1.4" strokeDasharray="3 3" />
          <line x1="48" y1="126" x2="192" y2="126" stroke={palette.subtle} strokeWidth="1" />
        </svg>
      );

    case "acoustics":
      return (
        <svg
          viewBox="0 0 240 160"
          className="w-full h-full"
          fill="none"
          aria-hidden="true"
        >
          {[68, 84, 100, 116, 132, 148, 164].map((x, idx) => (
            <rect
              key={x}
              x={x}
              y={32 + (idx % 2 === 0 ? 0 : 8)}
              width="7"
              height={idx % 2 === 0 ? 86 : 70}
              rx="1.5"
              fill={idx === 3 ? palette.accent : palette.stroke}
              fillOpacity={idx === 3 ? 0.78 : 0.18}
              stroke={idx === 3 ? palette.accent : palette.stroke}
              strokeWidth="1"
            />
          ))}
          <path
            d="M42 75 Q 72 45, 102 75 T 162 75 T 198 75"
            stroke={palette.accent}
            strokeWidth="1.4"
            strokeDasharray="4 3"
          />
        </svg>
      );

    case "hardware":
      return (
        <svg
          viewBox="0 0 240 160"
          className="w-full h-full"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="48"
            y="58"
            width="144"
            height="14"
            rx="2"
            fill={palette.stroke}
            fillOpacity="0.12"
            stroke={palette.stroke}
            strokeWidth="1.4"
          />
          <rect
            x="66"
            y="72"
            width="44"
            height="34"
            rx="1.5"
            fill={palette.accent}
            fillOpacity="0.18"
            stroke={palette.accent}
            strokeWidth="1.4"
          />
          <circle cx="136" cy="92" r="10" stroke={palette.stroke} strokeWidth="1.4" />
          <circle cx="136" cy="92" r="3" fill={palette.accent} />
          <circle cx="168" cy="92" r="10" stroke={palette.stroke} strokeWidth="1.4" />
          <circle cx="168" cy="92" r="3" fill={palette.stroke} />
          <line x1="48" y1="42" x2="192" y2="42" stroke={palette.subtle} strokeWidth="1" />
          <line x1="48" y1="38" x2="48" y2="46" stroke={palette.stroke} strokeWidth="1" />
          <line x1="192" y1="38" x2="192" y2="46" stroke={palette.stroke} strokeWidth="1" />
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 240 160"
          className="w-full h-full"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="64"
            y="34"
            width="76"
            height="76"
            stroke={palette.stroke}
            strokeWidth="1.3"
          />
          <circle
            cx="144"
            cy="86"
            r="38"
            fill={palette.accent}
            fillOpacity="0.15"
            stroke={palette.accent}
            strokeWidth="1.5"
          />
          <line x1="44" y1="110" x2="196" y2="110" stroke={palette.subtle} strokeWidth="1" />
          <circle cx="102" cy="72" r="4" fill={palette.stroke} />
        </svg>
      );
  }
}

export function ProductPlaceholder({
  title,
  category,
  variant = "card",
  className = "",
}: ProductPlaceholderProps) {
  const palette = getPalette(category, title);
  const monogram = getMonogram(title);

  if (variant === "thumbnail") {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden select-none ${className}`}
        style={{ backgroundColor: palette.bg, color: palette.stroke }}
        aria-label={`${title} geometric placeholder`}
      >
        <div className="w-full h-full p-1.5 opacity-90">
          <CategoryMotifSvg palette={palette} />
        </div>
        <span
          className="absolute bottom-1 right-1.5 font-mono text-[9px] font-medium tracking-wider opacity-70"
          style={{ color: palette.stroke }}
        >
          {monogram}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden select-none ${className}`}
      style={{ backgroundColor: palette.bg, color: palette.stroke }}
      role="img"
      aria-label={`${title} — ${category} geometric placeholder`}
    >
      {/* Subtle architectural corner registration marks */}
      <span
        className="pointer-events-none absolute top-3 left-3 h-2.5 w-2.5 border-t border-l opacity-35"
        style={{ borderColor: palette.stroke }}
      />
      <span
        className="pointer-events-none absolute top-3 right-3 h-2.5 w-2.5 border-t border-r opacity-35"
        style={{ borderColor: palette.stroke }}
      />
      <span
        className="pointer-events-none absolute bottom-3 left-3 h-2.5 w-2.5 border-b border-l opacity-35"
        style={{ borderColor: palette.stroke }}
      />
      <span
        className="pointer-events-none absolute bottom-3 right-3 h-2.5 w-2.5 border-b border-r opacity-35"
        style={{ borderColor: palette.stroke }}
      />

      {/* Top metadata bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-75"
          style={{ color: palette.stroke }}
        >
          {category}
        </span>
        <span
          className="font-mono text-[10px] tracking-[0.12em] px-1.5 py-0.5 border"
          style={{
            borderColor: palette.subtle,
            color: palette.stroke,
            backgroundColor: "rgba(253, 252, 249, 0.45)",
          }}
        >
          {monogram}
        </span>
      </div>

      {/* Central geometric schematic illustration */}
      <div
        className={`relative z-10 flex items-center justify-center ${
          variant === "detail" ? "px-10 py-4 flex-1" : "px-8 py-1 flex-1"
        }`}
      >
        <div
          className={`w-full ${
            variant === "detail" ? "max-w-[290px]" : "max-w-[215px]"
          } aspect-[3/2]`}
        >
          <CategoryMotifSvg palette={palette} />
        </div>
      </div>

      {/* Bottom framed title strip */}
      <div
        className="relative z-10 px-5 pb-4 pt-2 flex items-end justify-between gap-3 border-t"
        style={{ borderColor: `${palette.subtle}99` }}
      >
        <p
          className={`font-medium leading-snug tracking-tight truncate ${
            variant === "detail" ? "text-sm" : "text-xs"
          }`}
          style={{ color: palette.stroke }}
        >
          {title}
        </p>
        <span
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] opacity-60"
          style={{ color: palette.stroke }}
        >
          Spec Sheet
        </span>
      </div>
    </div>
  );
}
