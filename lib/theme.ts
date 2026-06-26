export const THEME_STORAGE_KEY = 'theme'

export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.classList.toggle('dark',t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches));}catch(e){}})();`

export type Theme = 'light' | 'dark'

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}
