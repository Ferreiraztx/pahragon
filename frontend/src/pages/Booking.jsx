import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Booking() {
  const [quadras, setQuadras] = useState([])
  const [quadraSelecionada, setQuadraSelecionada] = useState('')
  const [data, setData] = useState('')
  const [horarios, setHorarios] = useState([])
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [mensagem, setMensagem] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/courts').then(res => setQuadras(res.data))
  }, [])

  async function buscarHorarios() {
    if (!quadraSelecionada || !data) return
    const res = await api.get(`/bookings/disponiveis?courtId=${quadraSelecionada}&data=${data}`)
    setHorarios(res.data.disponiveis)
  }

  async function handleAgendar() {
    if (!horarioSelecionado) return
    const [hora] = horarioSelecionado.split(':')
    const horaInicio = `${data}T${horarioSelecionado}:00.000Z`
    const horaFim = `${data}T${String(Number(hora) + 1).padStart(2, '0')}:00:00.000Z`

    try {
      const resBooking = await api.post('/bookings', { courtId: quadraSelecionada, data, horaInicio, horaFim })
      const resPagamento = await api.post('/payments/criar', { bookingId: resBooking.data.id })
      window.location.href = resPagamento.data.sandboxUrl
    } catch {
      setMensagem('❌ Erro ao processar. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-white/50 hover:text-white transition">
          ← Voltar
        </button>
        <div>
          <h1 className="text-white font-black text-xl">Agendar Quadra</h1>
          <p className="text-[#00c46a] text-xs font-semibold tracking-widest uppercase">Pahragon Beach Tennis</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-6">
        {mensagem && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
            {mensagem}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Quadra</label>
          <select
            className="w-full mt-2 bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00c46a] transition"
            value={quadraSelecionada}
            onChange={e => setQuadraSelecionada(e.target.value)}
          >
            <option value="">Selecione uma quadra</option>
            {quadras.map(q => (
              <option key={q.id} value={q.id}>{q.nome} — R$ {q.precoPorHora}/h</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Data</label>
          <input
            className="w-full mt-2 bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00c46a] transition"
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <button
          onClick={buscarHorarios}
          className="w-full bg-[#141414] hover:bg-[#1a1a1a] border border-white/10 hover:border-[#00c46a]/50 text-white font-semibold py-3.5 rounded-xl transition"
        >
          Ver horários disponíveis
        </button>

        {horarios.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Horário</label>
            <div className="flex flex-wrap gap-3 mt-3">
              {horarios.map(h => (
                <button
                  key={h}
                  onClick={() => setHorarioSelecionado(h)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm border transition ${
                    horarioSelecionado === h
                      ? 'bg-[#00c46a] border-[#00c46a] text-black'
                      : 'bg-transparent border-white/10 text-white hover:border-[#00c46a]/50'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {horarioSelecionado && (
          <button
            onClick={handleAgendar}
            className="w-full bg-[#00c46a] hover:bg-[#00a857] text-black font-bold py-4 rounded-xl transition text-lg"
          >
            Confirmar Reserva
          </button>
        )}
      </main>
    </div>
  )
}