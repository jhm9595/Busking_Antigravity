"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Palette, Check } from "lucide-react";
import styles from "./ThemeSwitcher.module.css";

const themes = [
  { name: "Neo-Brutalism", value: "neo-brutalism" },
  { name: "Dark Mode", value: "dark" },
  { name: "Warm Sunset", value: "warm-sunset" },
  { name: "Minimal Light", value: "minimal-light" },
  { name: "Glassmorphism", value: "glassmorphism" },
  { name: "New Naturalism", value: "new-naturalism" },
  { name: "Claymorphism", value: "claymorphism" },
  { name: "Midnight Busking", value: "midnight-busking" },
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
    return <div className={styles.trigger} style={{ width: '2.75rem', height: '2.75rem' }} />;
  }

  return (
    <div className={`${styles.container} theme-dropdown`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={styles.trigger}
        aria-label="Toggle theme"
        aria-expanded={isOpen}
      >
        <Palette className={styles.icon} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.list}>
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setIsOpen(false);
                }}
                className={`${styles.item} ${theme === t.value ? styles.active : ''}`}
              >
                <span>{t.name}</span>
                {theme === t.value && <Check className={styles.checkmark} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
