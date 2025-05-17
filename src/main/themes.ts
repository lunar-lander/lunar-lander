import { ThemeConfig } from './config/config-manager';

// Default Light Theme
export const lightTheme: ThemeConfig = {
  name: 'Light',
  primary: '#1a73e8',
  secondary: '#4285f4',
  background: '#ffffff',
  text: '#202124',
  sidebar: '#f5f5f5',
  accent: '#fbbc04',
  success: '#34a853',
  error: '#ea4335',
  warning: '#fbbc04',
  info: '#4285f4'
};

// Default Dark Theme
export const darkTheme: ThemeConfig = {
  name: 'Dark',
  primary: '#8ab4f8',
  secondary: '#4285f4',
  background: '#202124',
  text: '#e8eaed',
  sidebar: '#303134',
  accent: '#fbbc04',
  success: '#34a853',
  error: '#ea4335',
  warning: '#fbbc04',
  info: '#8ab4f8'
};

// Cyberpunk Theme
export const cyberpunkTheme: ThemeConfig = {
  name: 'Cyberpunk',
  primary: '#ff2a6d',
  secondary: '#05d9e8',
  background: '#1a1a2e',
  text: '#d1f7ff',
  sidebar: '#0f0f1a',
  accent: '#f7fd04',
  success: '#00ff9f',
  error: '#ff2a6d',
  warning: '#fdca40',
  info: '#05d9e8'
};

// Solarized Light Theme
export const solarizedLightTheme: ThemeConfig = {
  name: 'Solarized Light',
  primary: '#268bd2', // blue
  secondary: '#2aa198', // cyan
  background: '#fdf6e3', // base3
  text: '#657b83', // base00
  sidebar: '#eee8d5', // base2
  accent: '#b58900', // yellow
  success: '#859900', // green
  error: '#dc322f', // red
  warning: '#cb4b16', // orange
  info: '#6c71c4' // violet
};

// Solarized Dark Theme
export const solarizedDarkTheme: ThemeConfig = {
  name: 'Solarized Dark',
  primary: '#268bd2', // blue
  secondary: '#2aa198', // cyan
  background: '#002b36', // base03
  text: '#839496', // base0
  sidebar: '#073642', // base02
  accent: '#b58900', // yellow
  success: '#859900', // green
  error: '#dc322f', // red
  warning: '#cb4b16', // orange
  info: '#6c71c4' // violet
};

// Synthwave / Retrowave Theme
export const synthwaveTheme: ThemeConfig = {
  name: 'Synthwave',
  primary: '#ff1493', // deep pink
  secondary: '#9400d3', // purple
  background: '#241b2f',
  text: '#f8f8ff', // ghostwhite
  sidebar: '#120d1a',
  accent: '#00fffb', // neon cyan
  success: '#00ff00', // neon green
  error: '#ff00ff', // neon magenta
  warning: '#ffff00', // neon yellow
  info: '#00fffb' // neon cyan
};

// Nord Theme
export const nordTheme: ThemeConfig = {
  name: 'Nord',
  primary: '#5e81ac', // Nordic primary blue
  secondary: '#81a1c1', // Nordic secondary blue
  background: '#2e3440', // Nordic polar night
  text: '#eceff4', // Nordic snow storm
  sidebar: '#3b4252', // Nordic darker bg
  accent: '#ebcb8b', // Nordic aurora yellow
  success: '#a3be8c', // Nordic aurora green
  error: '#bf616a', // Nordic aurora red
  warning: '#d08770', // Nordic aurora orange
  info: '#b48ead' // Nordic aurora purple
};

// Material Oceanic Theme
export const materialOceanicTheme: ThemeConfig = {
  name: 'Material Oceanic',
  primary: '#82AAFF', // blue
  secondary: '#89DDFF', // cyan
  background: '#0F111A',
  text: '#EEFFFF',
  sidebar: '#1A1C25', 
  accent: '#F78C6C', // orange
  success: '#C3E88D', // green
  error: '#FF5370', // red
  warning: '#FFCB6B', // yellow
  info: '#C792EA' // purple
};

// Get all predefined themes
export const getAllPredefinedThemes = (): ThemeConfig[] => {
  return [
    lightTheme,
    darkTheme,
    cyberpunkTheme,
    solarizedLightTheme,
    solarizedDarkTheme,
    synthwaveTheme,
    nordTheme,
    materialOceanicTheme
  ];
};