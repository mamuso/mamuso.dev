'use client'

import { useSyncExternalStore } from 'react'
import { applyTheme, type Theme } from '@/lib/theme'

let listeners: Array<() => void> = []

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((item) => item !== listener)
  }
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function getServerSnapshot(): Theme {
  return 'light'
}

function notifyThemeChange() {
  for (const listener of listeners) {
    listener()
  }
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'
    applyTheme(nextTheme)
    notifyThemeChange()
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="inline-flex size-8 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
    >
      {theme === 'light' ? (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3v2.25M12 18.75V21M4.219 4.219l1.591 1.591M18.19 18.19l1.591 1.591M3 12h2.25M18.75 12H21M4.219 19.781l1.591-1.591M18.19 5.81l1.591-1.591" strokeLinecap="round" />
          <circle cx="12" cy="12" r="4.25" />
        </svg>
      ) : (
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 14.25A8.25 8.25 0 0 1 9.75 3 9.75 9.75 0 0 0 21 14.25Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
