import { create } from "zustand";

export interface ThemeState {
  theme: string;
  setTheme: (data: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: localStorage.getItem("chat-theme") || "dark",
  setTheme: (theme: string) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
    console.log('theme set to ', theme);
  },
}));
