"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Palette } from "lucide-react";

const themes = [
  { name: "System", value: "system" },
  { name: "Light", value: "light" },
  { name: "Dark", value: "dark" },
  { name: "Neo-Brutalism", value: "neo-brutalism" },
  { name: "Bento Grids", value: "bento-grids" },
  { name: "Glassmorphism", value: "glassmorphism" },
  { name: "Spatial UI", value: "spatial-ui" },
  { name: "Kinetic Typography", value: "kinetic-typography" },
  { name: "New Naturalism", value: "new-naturalism" },
  { name: "Minimalist Maximalism", value: "minimalist-maximalism" },
  { name: "Claymorphism", value: "claymorphism" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />; // Placeholder to avoid layout shift
  }

  return (
    <div className="relative inline-block text-left group z-50">
      <button
        type="button"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        id="theme-menu-button"
        aria-expanded="true"
        aria-haspopup="true"
      >
        <Palette className="w-5 h-5" />
      </button>

      <div
        className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-background border border-border shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="theme-menu-button"
        tabIndex={-1}
      >
        <div className="py-1" role="none">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`${
                theme === t.value ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-foreground/5"
              } block w-full text-left px-4 py-2 text-sm transition-colors`}
              role="menuitem"
              tabIndex={-1}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
