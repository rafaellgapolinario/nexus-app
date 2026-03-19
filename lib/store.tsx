'use client'
import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, type ReactNode
} from 'react'
import type { UserProfile, CalendarEvent, WaUser, ChatMessage, Plan, AutomationConfig } from './types'

// ── Constants ──────────────────────────────────────────────────
export const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'gardaszconsultoria@gmail.com'

export const isOwner = (email?: string) => email === OWNER_EMAIL

export const getPlanAccess = (feature: string, plan: Plan, email?: string): boolean => {
  if (isOwner(email)) return true
  const map: Record<string, Record<Plan, boolean>> = {
    whatsapp:     { free: false, pro: true,  business: true },
    ai_unlimited: { free: false, pro: true,  business: true },
    automations:  { free: false, pro: true,  business: true },
    multi_user:   { free: false, pro: false, business: true },
    api_access:   { free: false, pro: false, business: true },
  }
  return map[feature]?.[plan] ?? true
}

const DEFAULT_AUTOMATIONS: AutomationConfig = {
  auto_event_whatsapp: true, auto_reminder_1h: true, auto_reminder_24h: true,
  auto_free_slot: false,     auto_overdue_notify: true, auto_daily_summary: true,
  auto_weekly_report: false, auto_ai_suggestions: true, auto_burnout_alert: true,
}

// ── localStorage helpers ────────────────────────────────────────
function ls<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try { const v = localStorage.getItem(key); return v !== null ? (JSON.parse(v) as T) : fallback }
  catch { return fallback }
}
function lsSet(key: string, val: unknown) {
  if (typeof window !== 'undefined') try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ── Types ───────────────────────────────────────────────────────
interface State {
  accessToken:     string
  userProfile:     UserProfile | null
  calendarEvents:  CalendarEvent[]
  chatHistory:     ChatMessage[]
  waUsers:         WaUser[]
  geminiKey:       string
  zapiInstance:    string
  zapiToken:       string
  zapiClientToken: string
  mpPublicKey:     string
  currentPlan:     Plan
  automations:     AutomationConfig
  lang:            'pt' | 'en' | 'es'
  toast:           string
}
interface Actions {
  setAuth:           (token: string, profile: UserProfile) => void
  logout:            () => void
  setCalendarEvents: (e: CalendarEvent[]) => void
  addMessage:        (m: ChatMessage) => void
  clearChat:         () => void
  addWaUser:         (u: WaUser) => void
  removeWaUser:      (i: number) => void
  setSettings:       (s: Partial<Pick<State, 'geminiKey'|'zapiInstance'|'zapiToken'|'zapiClientToken'|'mpPublicKey'>>) => void
  setPlan:           (p: Plan) => void
  toggleAutomation:  (k: keyof AutomationConfig) => void
  setLang:           (l: 'pt'|'en'|'es') => void
  showToast:         (msg: string) => void
}

// ── Context ─────────────────────────────────────────────────────
const Ctx = createContext<State & Actions>(null as unknown as State & Actions)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [accessToken,     setAccessToken]  = useState('')
  const [userProfile,     setUserProfile]  = useState<UserProfile | null>(null)
  const [calendarEvents,  setCal]          = useState<CalendarEvent[]>([])
  const [chatHistory,     setChatHistory]  = useState<ChatMessage[]>([])
  const [waUsers,         setWaUsers]      = useState<WaUser[]>([])
  const [geminiKey,       setGK]           = useState('')
  const [zapiInstance,    setZI]           = useState('')
  const [zapiToken,       setZT]           = useState('')
  const [zapiClientToken, setZC]           = useState('')
  const [mpPublicKey,     setMP]           = useState('')
  const [currentPlan,     setPlanS]        = useState<Plan>('free')
  const [automations,     setAutos]        = useState<AutomationConfig>(DEFAULT_AUTOMATIONS)
  const [lang,            setLangS]        = useState<'pt'|'en'|'es'>('pt')
  const [toast,           setToast]        = useState('')
  const toastRef = useRef<ReturnType<typeof setTimeout>>()

  // Hydrate on mount
  useEffect(() => {
    setAccessToken(ls('nx_token', ''))
    setUserProfile(ls('nx_profile', null))
    setWaUsers(ls('nx_wa', []))
    setGK(ls('nx_gemini', ''))
    setZI(ls('nx_zi', ''))
    setZT(ls('nx_zt', ''))
    setZC(ls('nx_zc', ''))
    setMP(ls('nx_mp', ''))
    setPlanS(ls('nx_plan', 'free'))
    setAutos(ls('nx_autos', DEFAULT_AUTOMATIONS))
    setLangS(ls('nx_lang', 'pt'))
  }, [])

  const setAuth = useCallback((token: string, profile: UserProfile) => {
    setAccessToken(token); lsSet('nx_token', token)
    setUserProfile(profile); lsSet('nx_profile', profile)
  }, [])

  const logout = useCallback(() => {
    setAccessToken(''); lsSet('nx_token', '')
    setUserProfile(null); lsSet('nx_profile', null)
    setChatHistory([])
  }, [])

  const setCalendarEvents = useCallback((e: CalendarEvent[]) => setCal(e), [])
  const addMessage  = useCallback((m: ChatMessage) => setChatHistory(h => [...h, m]), [])
  const clearChat   = useCallback(() => setChatHistory([]), [])

  const addWaUser = useCallback((u: WaUser) => {
    setWaUsers(w => { const n = [...w, u]; lsSet('nx_wa', n); return n })
  }, [])
  const removeWaUser = useCallback((i: number) => {
    setWaUsers(w => { const n = w.filter((_, idx) => idx !== i); lsSet('nx_wa', n); return n })
  }, [])

  const setSettings = useCallback((s: Partial<Pick<State,'geminiKey'|'zapiInstance'|'zapiToken'|'zapiClientToken'|'mpPublicKey'>>) => {
    if (s.geminiKey       !== undefined) { setGK(s.geminiKey);       lsSet('nx_gemini', s.geminiKey) }
    if (s.zapiInstance    !== undefined) { setZI(s.zapiInstance);    lsSet('nx_zi', s.zapiInstance) }
    if (s.zapiToken       !== undefined) { setZT(s.zapiToken);       lsSet('nx_zt', s.zapiToken) }
    if (s.zapiClientToken !== undefined) { setZC(s.zapiClientToken); lsSet('nx_zc', s.zapiClientToken) }
    if (s.mpPublicKey     !== undefined) { setMP(s.mpPublicKey);     lsSet('nx_mp', s.mpPublicKey) }
  }, [])

  const setPlan = useCallback((p: Plan) => { setPlanS(p); lsSet('nx_plan', p) }, [])

  const toggleAutomation = useCallback((k: keyof AutomationConfig) => {
    setAutos(a => { const n = { ...a, [k]: !a[k] }; lsSet('nx_autos', n); return n })
  }, [])

  const setLang = useCallback((l: 'pt'|'en'|'es') => { setLangS(l); lsSet('nx_lang', l) }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(''), 2800)
  }, [])

  return (
    <Ctx.Provider value={{
      accessToken, userProfile, calendarEvents, chatHistory, waUsers,
      geminiKey, zapiInstance, zapiToken, zapiClientToken, mpPublicKey,
      currentPlan, automations, lang, toast,
      setAuth, logout, setCalendarEvents, addMessage, clearChat,
      addWaUser, removeWaUser, setSettings, setPlan, toggleAutomation,
      setLang, showToast,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useStore<T>(selector: (s: State & Actions) => T): T {
  return selector(useContext(Ctx))
}
