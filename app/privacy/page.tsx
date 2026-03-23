export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 32px', fontFamily: 'DM Sans, sans-serif', color: '#f0f0f8', background: '#0a0a0f', minHeight: '100vh', lineHeight: 1.7 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Política de Privacidade</h1>
      <p style={{ color: '#8b8ba0', marginBottom: 40 }}>Nexus App · Última atualização: março de 2026</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>1. Dados coletados</h2>
      <p>O Nexus coleta apenas os dados necessários para o funcionamento do serviço: nome, e-mail e foto de perfil via Google OAuth. Também armazenamos eventos do Google Calendar que você autorizar, anotações criadas por você e histórico de conversas com a IA.</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>2. Uso dos dados</h2>
      <p>Seus dados são utilizados exclusivamente para fornecer as funcionalidades do Nexus: assistente de voz com IA, gerenciamento de agenda e anotações pessoais. Não vendemos, compartilhamos ou utilizamos seus dados para publicidade.</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>3. Google Calendar</h2>
      <p>O acesso ao Google Calendar é utilizado somente para leitura e criação de eventos mediante sua solicitação explícita. O token de acesso é armazenado apenas na sessão do navegador e nunca em nossos servidores.</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>4. Armazenamento</h2>
      <p>Os dados são armazenados de forma segura no Supabase (PostgreSQL). Você pode solicitar a exclusão de todos os seus dados a qualquer momento pelo e-mail de contato abaixo.</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>5. Cookies</h2>
      <p>Utilizamos apenas cookies essenciais para manter sua sessão ativa. Não utilizamos cookies de rastreamento ou publicidade.</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>6. Seus direitos</h2>
      <p>Você tem direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento. Para exercer esses direitos, entre em contato conosco.</p>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>7. Contato</h2>
      <p>Para dúvidas sobre esta política: <a href="mailto:gardaszconsultoria@gmail.com" style={{ color: '#a78bfa' }}>gardaszconsultoria@gmail.com</a></p>

      <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid #1c1c28', color: '#55556a', fontSize: 13 }}>
        <a href="/" style={{ color: '#7c6dfa', textDecoration: 'none' }}>← Voltar para o Nexus</a>
      </div>
    </div>
  )
}
