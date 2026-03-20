-- ============================================================
-- NEXUS — Schema completo para Supabase (PostgreSQL)
-- Cole no Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id   TEXT UNIQUE NOT NULL,
  nome        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  avatar      TEXT,
  plano       TEXT NOT NULL DEFAULT 'free' CHECK (plano IN ('free', 'pro', 'business')),
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_login TIMESTAMPTZ,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_email     ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_plano     ON public.users(plano);

-- ============================================================
-- TABELA: settings (1 por usuário)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gemini_api_key       TEXT,
  openrouter_api_key   TEXT,
  zapi_instance        TEXT,
  zapi_token           TEXT,
  zapi_client_token    TEXT,
  mp_public_key        TEXT,
  idioma               TEXT NOT NULL DEFAULT 'pt' CHECK (idioma IN ('pt', 'en', 'es')),
  configuracoes_json   JSONB DEFAULT '{}'::jsonb,
  atualizado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT settings_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);

-- ============================================================
-- TABELA: conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL DEFAULT 'Nova conversa',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id    ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_criado_em  ON public.conversations(criado_em DESC);

-- ============================================================
-- TABELA: messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  conteudo          TEXT NOT NULL,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id         ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_criado_em       ON public.messages(criado_em DESC);

-- ============================================================
-- TABELA: automations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.automations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nome           TEXT NOT NULL,
  tipo           TEXT NOT NULL,
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  configuracao   JSONB DEFAULT '{}'::jsonb,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automations_user_id ON public.automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_ativo   ON public.automations(ativo);

-- ============================================================
-- TABELA: wa_users (usuários WhatsApp por conta)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wa_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  telefone    TEXT NOT NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_users_user_id ON public.wa_users(user_id);

-- ============================================================
-- TABELA: activity_logs (log de ações admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  acao        TEXT NOT NULL,
  detalhes    JSONB DEFAULT '{}'::jsonb,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id   ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_criado_em ON public.activity_logs(criado_em DESC);

-- ============================================================
-- FUNÇÃO: atualizar timestamp automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de auto-update
CREATE TRIGGER trg_settings_atualizado_em
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_automations_atualizado_em
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE TRIGGER trg_conversations_atualizado_em
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- ============================================================
-- RLS — Row Level Security (descomente para ativar)
-- Garante que cada usuário só vê seus próprios dados
-- ============================================================

/*
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs  ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário só acessa seus próprios dados
CREATE POLICY "users: own data"         ON public.users         FOR ALL USING (id = auth.uid());
CREATE POLICY "settings: own data"      ON public.settings      FOR ALL USING (user_id = auth.uid());
CREATE POLICY "conversations: own data" ON public.conversations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "messages: own data"      ON public.messages      FOR ALL USING (user_id = auth.uid());
CREATE POLICY "automations: own data"   ON public.automations   FOR ALL USING (user_id = auth.uid());
CREATE POLICY "wa_users: own data"      ON public.wa_users      FOR ALL USING (user_id = auth.uid());
*/

-- ============================================================
-- DADOS INICIAIS: automações padrão (inserir após criar usuário)
-- ============================================================
/*
INSERT INTO public.automations (user_id, nome, tipo, ativo, configuracao) VALUES
  (:user_id, 'Avisar no WhatsApp ao criar evento', 'auto_event_whatsapp', true,  '{}'),
  (:user_id, 'Lembrete 1h antes do evento',        'auto_reminder_1h',    true,  '{}'),
  (:user_id, 'Aviso preparatório dia anterior',     'auto_reminder_24h',   true,  '{}'),
  (:user_id, 'Bloquear horário de foco',            'auto_free_slot',      false, '{}'),
  (:user_id, 'Notificação tarefa atrasada',         'auto_overdue_notify', true,  '{}'),
  (:user_id, 'Resumo diário às 08h',               'auto_daily_summary',  true,  '{}'),
  (:user_id, 'Relatório semanal sexta',             'auto_weekly_report',  false, '{}'),
  (:user_id, 'Sugestões automáticas da IA',         'auto_ai_suggestions', true,  '{}'),
  (:user_id, 'Alerta de sobrecarga (burnout)',      'auto_burnout_alert',  true,  '{}');
*/
