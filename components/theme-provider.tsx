'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const merged = { defaultTheme: 'light', ...props } as ThemeProviderProps;
  return <NextThemesProvider {...merged}>{children}</NextThemesProvider>
}
