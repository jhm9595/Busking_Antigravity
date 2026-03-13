"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Palette, Check } from "lucide-react";

const themes = [
  { name: "Neo-Brutalism", value: "neo-brutalism" },
  { name: "Dark Mode", value: "dark" },
  { name: "Warm Sunset", value: "warm-sunset" },
  { name: "Minimal Light", value: "minimal-light" },
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
    const handleOutsideAction = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.theme-dropdown')) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('click', handleOutsideAction);
      document.addEventListener('touchstart', handleOutsideAction);
    }
    return () => {
      document.removeEventListener('click', handleOutsideAction);
      document.removeEventListener('touchstart', handleOutsideAction);
    };
  }, [isOpen]);

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  return (
    <div className="relative theme-dropdown z-50">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-3 md:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-background/90 backdrop-blur-md border border-border shadow-lg hover:bg-accent transition-all active:scale-95 touch-manipulation"
        aria-label="Toggle theme"
        aria-expanded={isOpen}
      >
        <Palette className="w-5 h-5 md:w-4 md:h-4 text-primary" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 md:w-48 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-5 py-3.5 md:px-4 md:py-2.5 text-base md:text-sm transition-colors ${
                  theme === t.value 
                    ? "bg-primary/10 text-primary font-bold" 
                    : "text-foreground hover:bg-accent"
                }`}
              >
                <span>{t.name}</span>
                {theme === t.value && <Check className="w-5 h-5 md:w-4 md:h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
