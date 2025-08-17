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
  info: '#4285f4',
  chatBackground: '#fafbfc'
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
  info: '#8ab4f8',
  chatBackground: '#1a1b1f'
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
  info: '#05d9e8',
  chatBackground: '#0f0f1a'
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

// GitHub Light Theme
export const githubLightTheme: ThemeConfig = {
  name: 'GitHub Light',
  primary: '#0969da',
  secondary: '#1f883d',
  background: '#ffffff',
  text: '#1f2328',
  sidebar: '#f6f8fa',
  accent: '#8250df',
  success: '#1f883d',
  error: '#d1242f',
  warning: '#fb8500',
  info: '#0969da',
  chatBackground: '#f6f8fa'
};

// Paper Theme
export const paperTheme: ThemeConfig = {
  name: 'Paper',
  primary: '#5e72e4',
  secondary: '#34bfa3',
  background: '#fefefe',
  text: '#37474f',
  sidebar: '#f7f9fc',
  accent: '#ff6b6b',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
  chatBackground: '#f9fbfe'
};

// Vanilla Cream Theme
export const vanillaCreamTheme: ThemeConfig = {
  name: 'Vanilla Cream',
  primary: '#8b5cf6',
  secondary: '#06b6d4',
  background: '#fefcf3',
  text: '#4a5568',
  sidebar: '#f7f5f0',
  accent: '#f59e0b',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  chatBackground: '#f8f6ed'
};

// Cotton Candy Theme
export const cottonCandyTheme: ThemeConfig = {
  name: 'Cotton Candy',
  primary: '#ec4899',
  secondary: '#8b5cf6',
  background: '#fdf2f8',
  text: '#831843',
  sidebar: '#fce7f3',
  accent: '#06b6d4',
  success: '#059669',
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
  chatBackground: '#fce7f3'
};

// Mint Fresh Theme
export const mintFreshTheme: ThemeConfig = {
  name: 'Mint Fresh',
  primary: '#059669',
  secondary: '#0891b2',
  background: '#f0fdfa',
  text: '#134e4a',
  sidebar: '#ecfdf5',
  accent: '#7c3aed',
  success: '#059669',
  error: '#dc2626',
  warning: '#d97706',
  info: '#0284c7',
  chatBackground: '#ecfdf5'
};

// Warm Sand Theme
export const warmSandTheme: ThemeConfig = {
  name: 'Warm Sand',
  primary: '#c2410c',
  secondary: '#92400e',
  background: '#fffbeb',
  text: '#78350f',
  sidebar: '#fef3c7',
  accent: '#7c2d12',
  success: '#166534',
  error: '#991b1b',
  warning: '#b45309',
  info: '#1e40af',
  chatBackground: '#fef3c7'
};

// Lavender Dream Theme
export const lavenderDreamTheme: ThemeConfig = {
  name: 'Lavender Dream',
  primary: '#8b5cf6',
  secondary: '#a855f7',
  background: '#faf5ff',
  text: '#581c87',
  sidebar: '#f3e8ff',
  accent: '#ec4899',
  success: '#059669',
  error: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
  chatBackground: '#f3e8ff'
};

// Ocean Breeze Theme
export const oceanBreezeTheme: ThemeConfig = {
  name: 'Ocean Breeze',
  primary: '#0284c7',
  secondary: '#06b6d4',
  background: '#f0f9ff',
  text: '#0c4a6e',
  sidebar: '#e0f2fe',
  accent: '#0891b2',
  success: '#059669',
  error: '#dc2626',
  warning: '#d97706',
  info: '#0284c7',
  chatBackground: '#e0f2fe'
};

// Slate Gray Theme (Neutral)
export const slateGrayTheme: ThemeConfig = {
  name: 'Slate Gray',
  primary: '#475569',
  secondary: '#64748b',
  background: '#f8fafc',
  text: '#334155',
  sidebar: '#f1f5f9',
  accent: '#7c3aed',
  success: '#059669',
  error: '#dc2626',
  warning: '#d97706',
  info: '#0284c7',
  chatBackground: '#f6f8fa'
};

// Warm Gray Theme (Neutral)
export const warmGrayTheme: ThemeConfig = {
  name: 'Warm Gray',
  primary: '#78716c',
  secondary: '#a8a29e',
  background: '#fafaf9',
  text: '#44403c',
  sidebar: '#f5f5f4',
  accent: '#f59e0b',
  success: '#059669',
  error: '#dc2626',
  warning: '#d97706',
  info: '#0284c7',
  chatBackground: '#f6f8fa'
};

// Stone Theme (Neutral)
export const stoneTheme: ThemeConfig = {
  name: 'Stone',
  primary: '#57534e',
  secondary: '#78716c',
  background: '#fafaf9',
  text: '#292524',
  sidebar: '#f5f5f4',
  accent: '#ea580c',
  success: '#16a34a',
  error: '#dc2626',
  warning: '#ca8a04',
  info: '#0369a1',
  chatBackground: '#f6f8fa'
};

// Mocha Theme (Neutral)
export const mochaTheme: ThemeConfig = {
  name: 'Mocha',
  primary: '#92400e',
  secondary: '#a16207',
  background: '#fef7ed',
  text: '#451a03',
  sidebar: '#fed7aa',
  accent: '#7c2d12',
  success: '#166534',
  error: '#991b1b',
  warning: '#b45309',
  info: '#1e40af',
  chatBackground: '#f6f8fa'
};

// Gruvbox Light Theme
export const gruvboxLightTheme: ThemeConfig = {
  name: 'Gruvbox Light',
  primary: '#af3a03',
  secondary: '#427b58',
  background: '#fbf1c7',
  text: '#3c3836',
  sidebar: '#f2e5bc',
  accent: '#b57614',
  success: '#79740e',
  error: '#cc241d',
  warning: '#d65d0e',
  info: '#076678',
  chatBackground: '#f2e5bc'
};

// One Light Theme
export const oneLightTheme: ThemeConfig = {
  name: 'One Light',
  primary: '#4078f2',
  secondary: '#0184bc',
  background: '#fafafa',
  text: '#383a42',
  sidebar: '#f0f0f1',
  accent: '#a626a4',
  success: '#50a14f',
  error: '#e45649',
  warning: '#c18401',
  info: '#0184bc',
  chatBackground: '#f0f0f1'
};

// Atom Light Theme
export const atomLightTheme: ThemeConfig = {
  name: 'Atom Light',
  primary: '#4078f2',
  secondary: '#0184bc',
  background: '#ffffff',
  text: '#333333',
  sidebar: '#f6f7f8',
  accent: '#a626a4',
  success: '#50a14f',
  error: '#e45649',
  warning: '#986801',
  info: '#0184bc',
  chatBackground: '#f6f7f8'
};

// Tokyo Night Storm Theme
export const tokyoNightStormTheme: ThemeConfig = {
  name: 'Tokyo Night Storm',
  primary: '#7aa2f7',
  secondary: '#73daca',
  background: '#24283b',
  text: '#c0caf5',
  sidebar: '#1f2335',
  accent: '#bb9af7',
  success: '#9ece6a',
  error: '#f7768e',
  warning: '#e0af68',
  info: '#7dcfff',
  chatBackground: '#1f2335'
};

// Catppuccin Latte Theme
export const catppuccinLatteTheme: ThemeConfig = {
  name: 'Catppuccin Latte',
  primary: '#1e66f5',
  secondary: '#04a5e5',
  background: '#eff1f5',
  text: '#4c4f69',
  sidebar: '#e6e9ef',
  accent: '#8839ef',
  success: '#40a02b',
  error: '#d20f39',
  warning: '#df8e1d',
  info: '#209fb5',
  chatBackground: '#e6e9ef'
};

// Catppuccin Mocha Theme
export const catppuccinMochaTheme: ThemeConfig = {
  name: 'Catppuccin Mocha',
  primary: '#89b4fa',
  secondary: '#74c7ec',
  background: '#1e1e2e',
  text: '#cdd6f4',
  sidebar: '#181825',
  accent: '#cba6f7',
  success: '#a6e3a1',
  error: '#f38ba8',
  warning: '#f9e2af',
  info: '#89dceb',
  chatBackground: '#181825'
};

// Forest Theme
export const forestTheme: ThemeConfig = {
  name: 'Forest',
  primary: '#2d5016',
  secondary: '#3f6b2a',
  background: '#1a2e05',
  text: '#c5d3b5',
  sidebar: '#0f1c02',
  accent: '#8da25a',
  success: '#5c8a3a',
  error: '#d32f2f',
  warning: '#ff9800',
  info: '#5dade2',
  chatBackground: '#0f1c02'
};

// Sunset Theme
export const sunsetTheme: ThemeConfig = {
  name: 'Sunset',
  primary: '#ff6b35',
  secondary: '#f7931e',
  background: '#2c1810',
  text: '#fff3e0',
  sidebar: '#1a0e08',
  accent: '#ff9800',
  success: '#4caf50',
  error: '#e91e63',
  warning: '#ffeb3b',
  info: '#2196f3',
  chatBackground: '#1a0e08'
};

// Dracula Theme
export const draculaTheme: ThemeConfig = {
  name: 'Dracula',
  primary: '#bd93f9',
  secondary: '#8be9fd',
  background: '#282a36',
  text: '#f8f8f2',
  sidebar: '#44475a',
  accent: '#ffb86c',
  success: '#50fa7b',
  error: '#ff5555',
  warning: '#f1fa8c',
  info: '#8be9fd',
  chatBackground: '#44475a'
};

// Monokai Theme
export const monokaiTheme: ThemeConfig = {
  name: 'Monokai',
  primary: '#f92672',
  secondary: '#a6e22e',
  background: '#272822',
  text: '#f8f8f2',
  sidebar: '#3e3d32',
  accent: '#fd971f',
  success: '#a6e22e',
  error: '#f92672',
  warning: '#e6db74',
  info: '#66d9ef',
  chatBackground: '#3e3d32'
};

// High Contrast Light Theme
export const highContrastLightTheme: ThemeConfig = {
  name: 'High Contrast Light',
  primary: '#0000ff',
  secondary: '#008000',
  background: '#ffffff',
  text: '#000000',
  sidebar: '#f0f0f0',
  accent: '#800080',
  success: '#008000',
  error: '#ff0000',
  warning: '#ff8000',
  info: '#0000ff',
  chatBackground: '#f0f0f0'
};

// High Contrast Dark Theme
export const highContrastDarkTheme: ThemeConfig = {
  name: 'High Contrast Dark',
  primary: '#00ffff',
  secondary: '#00ff00',
  background: '#000000',
  text: '#ffffff',
  sidebar: '#1a1a1a',
  accent: '#ffff00',
  success: '#00ff00',
  error: '#ff0000',
  warning: '#ffaa00',
  info: '#00ffff',
  chatBackground: '#1a1a1a'
};

// Sepia Theme
export const sepiaTheme: ThemeConfig = {
  name: 'Sepia',
  primary: '#8b4513',
  secondary: '#a0522d',
  background: '#f4f1e8',
  text: '#5d4e37',
  sidebar: '#ede6d3',
  accent: '#cd853f',
  success: '#6b8e23',
  error: '#b22222',
  warning: '#daa520',
  info: '#4682b4',
  chatBackground: '#ede6d3'
};

// Get all predefined themes
export const getAllPredefinedThemes = (): ThemeConfig[] => {
  return [
    lightTheme,
    darkTheme,
    githubLightTheme,
    paperTheme,
    vanillaCreamTheme,
    cottonCandyTheme,
    mintFreshTheme,
    warmSandTheme,
    lavenderDreamTheme,
    oceanBreezeTheme,
    slateGrayTheme,
    warmGrayTheme,
    stoneTheme,
    mochaTheme,
    gruvboxLightTheme,
    oneLightTheme,
    atomLightTheme,
    solarizedLightTheme,
    solarizedDarkTheme,
    tokyoNightStormTheme,
    catppuccinLatteTheme,
    catppuccinMochaTheme,
    cyberpunkTheme,
    synthwaveTheme,
    forestTheme,
    sunsetTheme,
    draculaTheme,
    monokaiTheme,
    nordTheme,
    materialOceanicTheme,
    highContrastLightTheme,
    highContrastDarkTheme,
    sepiaTheme
  ];
};