import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function MinhasReservas() {
  const [reservas, setReservas] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/bookings/minhas').then(res => setReservas(res.data))
  }, [])

  async function cancelar(id) {
    if (!confirm('Deseja cancelar esta reserva?')) return
    await api.patch(`/bookings/${id}/cancelar`)
    setReservas(reservas.map(r => r.id === id ? { ...r, status: 'cancelado' } : r))
  }

  const statusStyle = {
    pendente: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    confirmado: 'bg-[#00c46a]/10 text-[#00c46a] border-[#00c46a]/20',
    cancelado: 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-white/50 hover:text-white transition">
          ← Voltar
        </button>
        <div>
          <h1 className="text-white font-black text-xl">Minhas Reservas</h1>
          <p className="text-[#00c46a] text-xs font-semibold tracking-widest uppercase">Pahragon Beach Tennis</p>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-4">
        {reservas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎾</p>
            <p className="text-white/40">Você ainda não tem reservas.</p>
            <button onClick={() => navigate('/agendar')} className="mt-4 text-[#00c46a] font-semibold hover:underline">
              Agendar agora
            </button>
          </div>
        ) : (
          reservas.map(r => (
            <div key={r.id} className="bg-[#141414] border border-white/5 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white font-bold text-lg">{r.court.nome}</h3>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusStyle[r.status]}`}>
                  {r.status}
                </span>
              </div>
              <div className="space-y-1 text-white/50 text-sm">
                <p>📅 {new Date(r.data).toLocaleDateString('pt-BR')}</p>
                <p>🕐 {new Date(r.horaInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — {new Date(r.horaFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {r.status !== 'cancelado' && (
                <button
                  onClick={() => cancelar(r.id)}
                  className="mt-4 text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-4 py-2 rounded-xl transition"
                >
                  Cancelar reserva
                </button>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  )
}