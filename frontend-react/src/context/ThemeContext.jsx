import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext();
const KEY = 'invisia_theme';

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbString({ r, g, b }) {
  return `${r} ${g} ${b}`;
}

function alpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function isLight(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

function buildSemantic(base, primary, options = {}) {
  const light = isLight(base);
  const text = light ? '#111827' : '#f9fafb';
  const textBody = light ? '#374151' : '#d1d5db';
  const textMuted = light ? '#6b7280' : '#9ca3af';
  const textSubtle = light ? '#9ca3af' : '#6b7280';
  const textPlaceholder = light ? '#9ca3af' : '#4b5563';
  const surface = light ? options.surfaceLight || '#f1f5f9' : options.surfaceDark || base;
  const elevated = light ? options.elevatedLight || '#f8fafc' : options.elevatedDark || '#141419';
  const panel = options.panel || (light ? '#ffffff' : '#0f0f14');
  const panelHover = options.panelHover || (light ? '#f8fafc' : '#141419');
  const border = options.border || (light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)');
  const borderSubtle = options.borderSubtle || (light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)');
  const inputBg = options.inputBg || (light ? '#f8fafc' : '#0b0b0f');
  const overlay = options.overlay || (light ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.65)');
  const shadow = options.shadow || (light ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.35)');
  const primaryRgb = rgbString(hexToRgb(primary));

  return {
    '--bg-base': base,
    '--bg-surface': surface,
    '--bg-elevated': elevated,
    '--bg-panel': panel,
    '--bg-panel-hover': panelHover,
    '--bg-input': inputBg,
    '--bg-overlay': overlay,
    '--border-color': border,
    '--border-subtle': borderSubtle,
    '--text-heading': text,
    '--text-body': textBody,
    '--text-muted': textMuted,
    '--text-subtle': textSubtle,
    '--text-placeholder': textPlaceholder,
    '--accent': primary,
    '--accent-rgb': primaryRgb,
    '--accent-subtle': alpha(primary, 0.12),
    '--accent-border': alpha(primary, 0.25),
    '--accent-hover': options.accentHover || primary,
    '--success': options.success || (light ? '#16a34a' : '#22c55e'),
    '--warning': options.warning || (light ? '#d97706' : '#f59e0b'),
    '--danger': options.danger || (light ? '#dc2626' : '#ef4444'),
    '--info': options.info || primary,
    '--shadow-color': shadow,
  };
}

const PRESETS = [
  {
    name: 'invisia-dark',
    label: 'Invisia Dark',
    colors: {
      '--surface-950': '#0b0b0f',
      '--surface-900': '#0f0f14',
      '--surface-800': '#141419',
      '--surface-700': '#1a1a1f',
      '--surface-650': '#252530',
      '--primary-500': '#3b82f6',
      '--primary-600': '#2563eb',
      '--primary-700': '#1e40af',
      '--primary-800': '#1e3a8a',
      '--primary-400': '#60a5fa',
      ...buildSemantic('#0b0b0f', '#3b82f6'),
    },
  },
  {
    name: 'pure-black',
    label: 'Negro Puro',
    colors: {
      '--surface-950': '#000000',
      '--surface-900': '#050505',
      '--surface-800': '#0a0a0a',
      '--surface-700': '#111111',
      '--surface-650': '#1a1a1a',
      '--primary-500': '#3b82f6',
      '--primary-600': '#2563eb',
      '--primary-700': '#1e40af',
      '--primary-800': '#1e3a8a',
      '--primary-400': '#60a5fa',
      ...buildSemantic('#000000', '#3b82f6'),
    },
  },
  {
    name: 'midnight-blue',
    label: 'Azul Medianoche',
    colors: {
      '--surface-950': '#070b15',
      '--surface-900': '#0a1020',
      '--surface-800': '#0f1729',
      '--surface-700': '#1a2438',
      '--surface-650': '#253349',
      '--primary-500': '#3b82f6',
      '--primary-600': '#2563eb',
      '--primary-700': '#1e40af',
      '--primary-800': '#1e3a8a',
      '--primary-400': '#60a5fa',
      ...buildSemantic('#070b15', '#3b82f6', { surfaceDark: '#0a1020', elevatedDark: '#0f1729', panel: '#0a1020' }),
    },
  },
  {
    name: 'royal-purple',
    label: 'Púrpura Real',
    colors: {
      '--surface-950': '#0b0715',
      '--surface-900': '#100a1f',
      '--surface-800': '#1a102e',
      '--surface-700': '#251a3d',
      '--surface-650': '#332852',
      '--primary-500': '#a855f7',
      '--primary-600': '#9333ea',
      '--primary-700': '#7e22ce',
      '--primary-800': '#6b21a8',
      '--primary-400': '#c084fc',
      ...buildSemantic('#0b0715', '#a855f7', { surfaceDark: '#100a1f', elevatedDark: '#1a102e', panel: '#100a1f' }),
    },
  },
  {
    name: 'matrix-green',
    label: 'Matrix Verde',
    colors: {
      '--surface-950': '#0a0f0a',
      '--surface-900': '#0d140d',
      '--surface-800': '#121d12',
      '--surface-700': '#1a2a1a',
      '--surface-650': '#253a25',
      '--primary-500': '#22c55e',
      '--primary-600': '#16a34a',
      '--primary-700': '#15803d',
      '--primary-800': '#166534',
      '--primary-400': '#4ade80',
      ...buildSemantic('#0a0f0a', '#22c55e', { surfaceDark: '#0d140d', elevatedDark: '#121d12', panel: '#0d140d' }),
    },
  },
  {
    name: 'sunset-orange',
    label: 'Atardecer Naranja',
    colors: {
      '--surface-950': '#0f0b07',
      '--surface-900': '#1a100a',
      '--surface-800': '#261810',
      '--surface-700': '#332218',
      '--surface-650': '#402d22',
      '--primary-500': '#f97316',
      '--primary-600': '#ea580c',
      '--primary-700': '#c2410c',
      '--primary-800': '#9a3412',
      '--primary-400': '#fb923c',
      ...buildSemantic('#0f0b07', '#f97316', { surfaceDark: '#1a100a', elevatedDark: '#261810', panel: '#1a100a' }),
    },
  },
  {
    name: 'crimson-red',
    label: 'Carmesí',
    colors: {
      '--surface-950': '#0f0707',
      '--surface-900': '#1a0a0a',
      '--surface-800': '#261010',
      '--surface-700': '#331818',
      '--surface-650': '#402222',
      '--primary-500': '#ef4444',
      '--primary-600': '#dc2626',
      '--primary-700': '#b91c1c',
      '--primary-800': '#991b1b',
      '--primary-400': '#f87171',
      ...buildSemantic('#0f0707', '#ef4444', { surfaceDark: '#1a0a0a', elevatedDark: '#261010', panel: '#1a0a0a' }),
    },
  },
  {
    name: 'cyberpunk',
    label: 'Cyberpunk',
    colors: {
      '--surface-950': '#0a0a12',
      '--surface-900': '#0e0e1f',
      '--surface-800': '#161630',
      '--surface-700': '#1f1f40',
      '--surface-650': '#2a2a52',
      '--primary-500': '#22d3ee',
      '--primary-600': '#06b6d4',
      '--primary-700': '#0891b2',
      '--primary-800': '#0e7490',
      '--primary-400': '#67e8f9',
      ...buildSemantic('#0a0a12', '#22d3ee', { surfaceDark: '#0e0e1f', elevatedDark: '#161630', panel: '#0e0e1f' }),
    },
  },
  {
    name: 'deep-forest',
    label: 'Bosque Profundo',
    colors: {
      '--surface-950': '#080c08',
      '--surface-900': '#0c140c',
      '--surface-800': '#121e12',
      '--surface-700': '#1a2a1a',
      '--surface-650': '#253a25',
      '--primary-500': '#84cc16',
      '--primary-600': '#65a30d',
      '--primary-700': '#4d7c0f',
      '--primary-800': '#3f6212',
      '--primary-400': '#a3e635',
      ...buildSemantic('#080c08', '#84cc16', { surfaceDark: '#0c140c', elevatedDark: '#121e12', panel: '#0c140c' }),
    },
  },
  {
    name: 'ocean-teal',
    label: 'Océano Teal',
    colors: {
      '--surface-950': '#070c0f',
      '--surface-900': '#0a141a',
      '--surface-800': '#0f1f26',
      '--surface-700': '#1a2e36',
      '--surface-650': '#253d47',
      '--primary-500': '#14b8a6',
      '--primary-600': '#0d9488',
      '--primary-700': '#0f766e',
      '--primary-800': '#115e59',
      '--primary-400': '#2dd4bf',
      ...buildSemantic('#070c0f', '#14b8a6', { surfaceDark: '#0a141a', elevatedDark: '#0f1f26', panel: '#0a141a' }),
    },
  },
  {
    name: 'light',
    label: 'Claro',
    colors: {
      '--surface-950': '#f8fafc',
      '--surface-900': '#f1f5f9',
      '--surface-800': '#e2e8f0',
      '--surface-700': '#cbd5e1',
      '--surface-650': '#94a3b8',
      '--primary-500': '#3b82f6',
      '--primary-600': '#2563eb',
      '--primary-700': '#1e40af',
      '--primary-800': '#1e3a8a',
      '--primary-400': '#60a5fa',
      ...buildSemantic('#f8fafc', '#3b82f6', {
        surfaceLight: '#f1f5f9',
        elevatedLight: '#ffffff',
        panel: '#ffffff',
        panelHover: '#f8fafc',
        border: 'rgba(0,0,0,0.08)',
        borderSubtle: 'rgba(0,0,0,0.05)',
        inputBg: '#ffffff',
        overlay: 'rgba(0,0,0,0.25)',
        shadow: 'rgba(0,0,0,0.08)',
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
      }),
    },
  },
  {
    name: 'light-amber',
    label: 'Ámbar Claro',
    colors: {
      '--surface-950': '#fffbeb',
      '--surface-900': '#fef3c7',
      '--surface-800': '#fde68a',
      '--surface-700': '#fcd34d',
      '--surface-650': '#fbbf24',
      '--primary-500': '#f59e0b',
      '--primary-600': '#d97706',
      '--primary-700': '#b45309',
      '--primary-800': '#92400e',
      '--primary-400': '#fbbf24',
      ...buildSemantic('#fffbeb', '#f59e0b', {
        surfaceLight: '#fef3c7',
        elevatedLight: '#ffffff',
        panel: '#ffffff',
        panelHover: '#fffbeb',
        border: 'rgba(0,0,0,0.08)',
        borderSubtle: 'rgba(0,0,0,0.05)',
        inputBg: '#ffffff',
        overlay: 'rgba(0,0,0,0.25)',
        shadow: 'rgba(0,0,0,0.08)',
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
      }),
    },
  },
];

function loadTheme() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { preset: 'invisia-dark', custom: {} };
}

function saveTheme(t) {
  try { localStorage.setItem(KEY, JSON.stringify(t)); } catch {}
}


function setRgbVars(root, colors) {
  for (const [v, c] of Object.entries(colors)) {
    if (typeof c !== 'string' || !c.startsWith('#')) continue;
    const { r, g, b } = hexToRgb(c);
    root.style.setProperty(v + '-rgb', r + ' ' + g + ' ' + b);
  }
}

function applyTheme(t) {
  const preset = PRESETS.find(p => p.name === t.preset);
  if (!preset) return;
  const root = document.documentElement;
  const allVars = { ...preset.colors, ...t.custom };
  for (const [v, c] of Object.entries(allVars)) {
    root.style.setProperty(v, c);
  }
  setRgbVars(root, allVars);
  root.setAttribute('data-theme', t.preset);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => loadTheme());

  useEffect(() => {
    saveTheme(theme);
    applyTheme(theme);
  }, [theme]);

  const setPreset = useCallback((name) => {
    setThemeState(prev => ({ ...prev, preset: name }));
  }, []);

  const setCustom = useCallback((varName, color) => {
    setThemeState(prev => ({
      ...prev,
      custom: { ...prev.custom, [varName]: color },
    }));
  }, []);

  const resetCustom = useCallback(() => {
    setThemeState(prev => ({ ...prev, custom: {} }));
  }, []);

  const currentPreset = PRESETS.find(p => p.name === theme.preset) || PRESETS[0];
  const resolvedColors = { ...currentPreset.colors, ...theme.custom };

  const value = useMemo(() => ({
    theme,
    presets: PRESETS,
    currentPreset,
    resolvedColors,
    setPreset,
    setCustom,
    resetCustom,
    isLight: () => isLight(resolvedColors['--bg-base']),
  }), [theme, currentPreset, resolvedColors, setPreset, setCustom, resetCustom]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
