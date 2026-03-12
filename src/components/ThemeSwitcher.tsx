"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Palette, Check } from "lucide-react";

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
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.theme-dropdown')) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  return (
    <div className="relative theme-dropdown z-50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-accent transition-colors"
        aria-label="Toggle theme"
        aria-expanded={isOpen}
      >
        <Palette className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="py-1 max-h-[60vh] overflow-y-auto">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  theme === t.value 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-foreground hover:bg-accent"
                }`}
              >
                <span>{t.name}</span>
                {theme === t.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
