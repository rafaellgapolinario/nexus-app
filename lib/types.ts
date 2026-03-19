export interface UserProfile {
  sub: string
  name: string
  given_name: string
  email: string
  picture: string
}

export interface CalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end:   { dateTime?: string; date?: string }
  location?: string
  description?: string
}

export interface WaUser {
  name:  string
  phone: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type Plan = 'free' | 'pro' | 'business'

export interface AutomationConfig {
  auto_event_whatsapp: boolean
  auto_reminder_1h:    boolean
  auto_reminder_24h:   boolean
  auto_free_slot:      boolean
  auto_overdue_notify: boolean
  auto_daily_summary:  boolean
  auto_weekly_report:  boolean
  auto_ai_suggestions: boolean
  auto_burnout_alert:  boolean
}

export interface RegisteredUser {
  id: number
  name: string
  email: string
  picture: string
  plan: Plan
  joinedAt: string
  lastActive: string
  logins: number
}
