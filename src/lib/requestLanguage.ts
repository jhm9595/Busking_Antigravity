import { cookies } from 'next/headers'
import { en } from '@/locales/en'
import { ko } from '@/locales/ko'
import { zh } from '@/locales/zh'
import { ja } from '@/locales/ja'
import { zhTW } from '@/locales/zh-tw'

export type AppLanguage = 'en' | 'ko' | 'zh' | 'ja' | 'zh-TW'

export function normalizeLanguage(value?: string | null): AppLanguage {
  if (value === 'ko' || value === 'zh' || value === 'ja' || value === 'zh-TW') {
    return value
  }
  return 'en'
}

export async function getRequestLanguage(): Promise<AppLanguage> {
  const cookieStore = await cookies()
  return normalizeLanguage(cookieStore.get('app-language')?.value)
}

export function getLocaleForLanguage(language: AppLanguage) {
  switch (language) {
    case 'ko':
      return ko
    case 'zh':
      return zh
    case 'ja':
      return ja
    case 'zh-TW':
      return zhTW
    default:
      return en
  }
}
