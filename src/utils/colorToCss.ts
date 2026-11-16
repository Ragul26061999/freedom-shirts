/**
 * Maps a human-readable color name (as entered by the admin, e.g. "Black",
 * "Navy Blue", "#ff0000") to a CSS color value for rendering swatches.
 * Falls back to a neutral mid-gray when the color cannot be resolved so
 * the UI never breaks on unexpected input.
 */

const NAMED_COLORS: Record<string, string> = {
  black: "#111111",
  white: "#ffffff",
  red: "#ef4444",
  blue: "#3b82f6",
  "navy blue": "#1e3a5f",
  navy: "#1e3a5f",
  green: "#22c55e",
  "dark green": "#166534",
  olive: "#6b7280",
  "army green": "#4d5732",
  yellow: "#facc15",
  gold: "#d4af37",
  orange: "#f97316",
  pink: "#ec4899",
  "light pink": "#f9a8d4",
  hotpink: "#ec4899",
  purple: "#a855f7",
  violet: "#8b5cf6",
  lavender: "#c4b5fd",
  brown: "#92400e",
  tan: "#d2b48c",
  beige: "#e5dcc3",
  cream: "#fdf6e3",
  maroon: "#7f1d1d",
  burgundy: "#6d071a",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  turquoise: "#40e0d0",
  grey: "#9ca3af",
  gray: "#9ca3af",
  "dark grey": "#4b5563",
  "dark gray": "#4b5563",
  "light grey": "#d1d5db",
  "light gray": "#d1d5db",
  silver: "#c0c0c0",
  khaki: "#c3b091",
  rust: "#b7410e",
  coral: "#ff7f50",
  mint: "#98ff98",
  peach: "#fcd5b5",
  multicolor: "linear-gradient(135deg,#ef4444 0 25%,#facc15 25% 50%,#22c55e 50% 75%,#3b82f6 75% 100%)",
  mixed: "linear-gradient(135deg,#ef4444 0 25%,#facc15 25% 50%,#22c55e 50% 75%,#3b82f6 75% 100%)",
};

export function colorToCss(color: string | null | undefined): string {
  if (!color) return NAMED_COLORS.grey;
  const trimmed = color.trim();

  // Already a hex / rgb / hsl value
  if (/^(#|rgb|hsl)/i.test(trimmed)) return trimmed;

  // Named lookup (case-insensitive, collapses extra whitespace)
  const key = trimmed.toLowerCase().replace(/\s+/g, " ");
  if (NAMED_COLORS[key]) return NAMED_COLORS[key];

  // Partial match, e.g. "Navy Blue (striped)" -> try longest key contained in the string
  let best: string | null = null;
  for (const name of Object.keys(NAMED_COLORS)) {
    if (key.includes(name) && (!best || name.length > best.length)) {
      best = name;
    }
  }
  if (best) return NAMED_COLORS[best];

  // Deterministic fallback: hash the name into an HSL hue so identical
  // colors always render the same swatch.
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}
