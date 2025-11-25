
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';

export type ThemeMode = 'dark' | 'light';
export type ColorScheme = 'blue' | 'grayscale';

interface ThemeSwitcherProps {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  color: ColorScheme;
  setColor: (color: ColorScheme) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ mode, setMode, color, setColor }) => {
  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Appearance</label>
        <div className="flex gap-1 bg-[var(--element-bg)] p-1 rounded-lg border border-[var(--border)]">
          <button
            onClick={() => setMode('light')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'light' 
                ? 'bg-[var(--panel-bg)] text-[var(--text-primary)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sun size={14} /> Light
          </button>
          <button
            onClick={() => setMode('dark')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'dark' 
                ? 'bg-[var(--panel-bg)] text-[var(--text-primary)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Moon size={14} /> Dark
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Accent Color</label>
        <div className="flex gap-2">
          <button
            onClick={() => setColor('blue')}
            className={`flex-1 flex items-center gap-2 p-1.5 rounded-md border transition-all text-xs font-medium ${
              color === 'blue'
                ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent-text)]'
                : 'bg-[var(--element-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--element-hover)]'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            Blue
          </button>
          <button
            onClick={() => setColor('grayscale')}
            className={`flex-1 flex items-center gap-2 p-1.5 rounded-md border transition-all text-xs font-medium ${
              color === 'grayscale'
                ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent-text)]'
                : 'bg-[var(--element-bg)] border-transparent text-[var(--text-secondary)] hover:bg-[var(--element-hover)]'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-zinc-500"></div>
            Mono
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
