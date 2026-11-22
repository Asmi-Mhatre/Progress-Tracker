import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: {
    bg: "rgb(var(--bg) / <alpha-value>)", panel: "rgb(var(--panel) / <alpha-value>)",
    ink: "rgb(var(--ink) / <alpha-value>)", mute: "rgb(var(--mute) / <alpha-value>)",
    line: "rgb(var(--line) / <alpha-value>)", accent: "rgb(var(--accent) / <alpha-value>)",
    warn: "rgb(var(--warn) / <alpha-value>)" } } },
  plugins: [],
};
export default config;
