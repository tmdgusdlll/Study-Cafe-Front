import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'sc.theme'
const QUERY = '(prefers-color-scheme: dark)'

// OS 설정을 기본으로 따르고, 토글하면 그 선택을 저장한다
export function useTheme() {
  const [saved, setSaved] = useState(() => localStorage.getItem(KEY) as Theme | null)
  const [system, setSystem] = useState<Theme>(() => (matchMedia(QUERY).matches ? 'dark' : 'light'))

  useEffect(() => {
    const mq = matchMedia(QUERY)
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const theme = saved ?? system

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(KEY, next)
    setSaved(next)
  }

  return { theme, toggle }
}
