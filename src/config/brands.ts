export type Brand = {
  id: "mewstro" | "purrouette" | "bouldy";
  name: string;
  tagline: string;
  description: string;
  logo: string;
  favicon: string;
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textDim: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  links: {
    appStore: string;
    privacy: string;
    support: string;
  };
};

export const mewstro: Brand = {
  id: "mewstro",
  name: "Mewstro",
  tagline: "Every practice deserves an encore.",
  description:
    "Practice should feel good. Mewstro is built to make it feel that way, whatever instrument you're learning and whatever level you're at. Free to download, with a cat mascot that celebrates every session you log, and the app stays ad-free.",
  logo: "/mewstro/app-icon.png",
  favicon: "/mewstro/app-icon.png",
  colors: {
    primary: "#F4845F",
    primaryForeground: "#FFFFFF",
    secondary: "#F9A826",
    accent: "#7C3AED",
    background: "#FFFBF7",
    surface: "#FFFFFF",
    text: "#1A1A2E",
    textDim: "#6B7280",
  },
  fonts: {
    heading: "var(--font-geist-sans)",
    body: "var(--font-geist-sans)",
  },
  links: {
    appStore: "https://apps.apple.com/app/mewstro/id6761615884",
    privacy: "/mewstro/privacy",
    support: "/mewstro/support",
  },
};

export const purrouette: Brand = {
  id: "purrouette",
  name: "Purrouette",
  tagline: "Every practice deserves a curtain call.",
  description:
    "Dance practice should feel rewarding. Purrouette makes it feel magical. A free dance practice tracker with a cat mascot who celebrates every session — for any style, any level, no ads ever.",
  logo: "/purrouette/app-icon.png",
  favicon: "/purrouette/app-icon.png",
  // Stage Light palette — see Dance/Docs/Brand-Palette.md
  colors: {
    primary: "#E5446D",        // Rose Pointe
    primaryForeground: "#FFFFFF",
    secondary: "#F4C6CF",      // Blush Satin
    accent: "#E4B363",         // Curtain Gold
    background: "#FFF8F4",     // Stage Cream
    surface: "#FFFFFF",        // Spotlight
    text: "#2B1B2E",           // Velvet Ink
    textDim: "#7A5C6E",        // Mauve
  },
  fonts: {
    heading: "var(--font-geist-sans)",
    body: "var(--font-geist-sans)",
  },
  links: {
    appStore: "#",
    privacy: "/purrouette/privacy",
    support: "/purrouette/support",
  },
};

export const bouldy: Brand = {
  id: "bouldy",
  name: "Bouldy",
  tagline: "Your climbing companion.",
  description:
    "The climbing practice tracker built for sends, not spray. Log sessions, watch your grade pyramid fill in, and let Bouldy the mountain goat celebrate every climb — bouldering, sport, trad, top-rope. Free to try, £6.99/mo Premium.",
  logo: "/bouldy/app-icon.png",
  favicon: "/bouldy/app-icon.png",
  // Chalk theme — see Bouldy CLAUDE.md colour tokens
  colors: {
    primary: "#3B826E",         // Forest green
    primaryForeground: "#FFFFFF",
    secondary: "#6BB3D9",       // Sky blue
    accent: "#C4850C",          // Dark chalk gold (WCAG AA)
    background: "#F7F5F2",      // Warm chalk white
    surface: "#FFFFFF",
    text: "#2A2A2E",            // Granite dark
    textDim: "#6E6E73",         // Stone grey
  },
  fonts: {
    heading: "var(--font-geist-sans)",
    body: "var(--font-geist-sans)",
  },
  links: {
    appStore: "#",
    privacy: "/bouldy/privacy",
    support: "/bouldy/support",
  },
};
