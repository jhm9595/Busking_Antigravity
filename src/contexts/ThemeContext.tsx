'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = [
    { id: 'default', name: 'Default (Dark)' },
    { id: 'neo-brutalism', name: 'Neo-Brutalism' },
    { id: 'bento-grids', name: 'Bento Grids' },
    { id: 'glassmorphism', name: 'Glassmorphism' },
    { id: 'spatial-ui', name: 'Spatial UI' },
    { id: 'kinetic-typography', name: 'Kinetic Typography' },
    { id: 'new-naturalism', name: 'New Naturalism' },
    { id: 'minimalist-maximalism', name: 'Minimalist Maximalism' },
    { id: 'claymorphism', name: 'Claymorphism' },
] as const;

type ThemeID = typeof THEMES[number]['id'];

interface ThemeContextType {
    theme: ThemeID;
    setTheme: (theme: ThemeID) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'default',
    setTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<ThemeID>('default');

    useEffect(() => {
        const savedTheme = localStorage.getItem('app-theme') as ThemeID;
        if (savedTheme && THEMES.some(t => t.id === savedTheme)) {
            setTheme(savedTheme);
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }, []);

    const handleSetTheme = (newTheme: ThemeID) => {
        setTheme(newTheme);
        localStorage.setItem('app-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
