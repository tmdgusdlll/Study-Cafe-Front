import { useEffect, useRef, useState } from 'react'
import { read, write } from '../api/mock.ts'

// 카페 앰비언스 (CC0, Freesound Anya_Media #437461) — 전체 on/off + 볼륨 하나
const SRC = '/sounds/cafe-ambience.mp3'
const KEY = 'sc.sound'

type SoundSetting = { on: boolean; volume: number }

export function useAmbientSound() {
  const [setting, setSetting] = useState(() => read<SoundSetting>(KEY, { on: false, volume: 0.5 }))
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const a = new Audio(SRC)
    a.loop = true
    audio.current = a
    return () => {
      a.pause()
      audio.current = null
    }
  }, [])

  useEffect(() => {
    write(KEY, setting)
    const a = audio.current
    if (!a) return
    a.volume = setting.volume
    if (!setting.on) {
      a.pause()
      return
    }
    // 새로고침 직후처럼 사용자 조작 없이 재생하면 브라우저가 막는다 → 꺼짐으로 되돌림
    a.play().catch(() => setSetting((s) => ({ ...s, on: false })))
  }, [setting])

  return {
    on: setting.on,
    volume: setting.volume,
    toggle: () => setSetting((s) => ({ ...s, on: !s.on })),
    setVolume: (volume: number) => setSetting((s) => ({ ...s, volume })),
  }
}
