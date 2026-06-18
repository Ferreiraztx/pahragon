const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

async function enviarConfirmacaoReserva(booking) {
  const { user, court, data, horaInicio, horaFim } = booking

  const dataFormatada = new Date(data).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })
  const horaInicioFormatada = new Date(horaInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const horaFimFormatada = new Date(horaFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 0; }
        .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: #0a0a0a; padding: 32px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
        .header p { color: #00c46a; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin: 6px 0 0; }
        .hero { background: #00c46a; padding: 28px 32px; text-align: center; }
        .hero h2 { color: #000000; font-size: 20px; font-weight: 900; margin: 0; }
        .hero p { color: #000000; opacity: 0.7; font-size: 14px; margin: 6px 0 0; }
        .content { padding: 32px; }
        .greeting { font-size: 16px; color: #333; margin-bottom: 24px; }
        .card { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
        .card-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .card-row:last-child { margin-bottom: 0; }
        .icon { font-size: 20px; width: 36px; height: 36px; background: #00c46a15; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .card-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
        .card-value { font-size: 15px; font-weight: 600; color: #1e293b; }
        .status { display: inline-block; background: #00c46a15; color: #00c46a; border: 1px solid #00c46a30; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; }
        .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
        .footer { background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
        .footer a { color: #00c46a; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎾 PAHRAGON</h1>
          <p>Beach Tennis</p>
        </div>

        <div class="hero">
          <h2>✅ Reserva Confirmada!</h2>
          <p>Seu pagamento foi aprovado com sucesso.</p>
        </div>

        <div class="content">
          <p class="greeting">Olá, <strong>${user.nome}</strong>! Sua quadra está reservada. Veja os detalhes abaixo:</p>

          <div class="card">
            <div class="card-row">
              <div class="icon">🏟️</div>
              <div>
                <div class="card-label">Quadra</div>
                <div class="card-value">${court.nome}</div>
              </div>
            </div>
            <div class="card-row">
              <div class="icon">📅</div>
              <div>
                <div class="card-label">Data</div>
                <div class="card-value">${dataFormatada}</div>
              </div>
            </div>
            <div class="card-row">
              <div class="icon">🕐</div>
              <div>
                <div class="card-label">Horário</div>
                <div class="card-value">${horaInicioFormatada} às ${horaFimFormatada}</div>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <span class="status">✅ Pagamento aprovado</span>
          </div>

          <hr class="divider">

          <p style="color: #64748b; font-size: 14px; text-align: center;">
            📍 R. João Alencar Guimarães, 574 — Sta. Quitéria, Curitiba<br>
            Qualquer dúvida, entre em contato pelo WhatsApp.
          </p>
        </div>

        <div class="footer">
          <p>Pahragon Beach Tennis — Curitiba, PR</p>
          <p><a href="https://instagram.com/pahragon">@pahragon</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: `"Pahragon Beach Tennis" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: '✅ Reserva confirmada — Pahragon Beach Tennis',
    html
  })
}

module.exports = { enviarConfirmacaoReserva }