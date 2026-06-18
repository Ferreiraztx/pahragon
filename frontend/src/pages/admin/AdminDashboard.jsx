import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function AdminDashboard() {
  const [reservas, setReservas] = useState([])
  const [quadras, setQuadras] = useState([])
  const [torneios, setTorneios] = useState([])
  const [caixa, setCaixa] = useState(null)
  const [aba, setAba] = useState('reservas')
  const [novaQuadra, setNovaQuadra] = useState({ nome: '', descricao: '', precoPorHora: '' })
  const [novoTorneio, setNovoTorneio] = useState({ nome: '', descricao: '', data: '', vagas: '', preco: '' })
  const [mensagem, setMensagem] = useState('')
  const navigate = useNavigate()

  const admin = JSON.parse(localStorage.getItem('admin') || '{}')
  const token = localStorage.getItem('adminToken')

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return }
    carregarDados()
  }, [])

  async function carregarDados() {
    const headers = { Authorization: `Bearer ${token}` }
    const [resReservas, resQuadras, resTorneios, resCaixa] = await Promise.all([
      api.get('/bookings/todas', { headers }),
      api.get('/courts'),
      api.get('/tournaments'),
      api.get('/tournaments/caixa', { headers })
    ])
    setReservas(resReservas.data)
    setQuadras(resQuadras.data)
    setTorneios(resTorneios.data)
    setCaixa(resCaixa.data)
  }

  async function criarQuadra(e) {
    e.preventDefault()
    try {
      await api.post('/courts', { ...novaQuadra, precoPorHora: Number(novaQuadra.precoPorHora) }, { headers: { Authorization: `Bearer ${token}` } })
      setMensagem('✅ Quadra criada!')
      setNovaQuadra({ nome: '', descricao: '', precoPorHora: '' })
      carregarDados()
    } catch { setMensagem('❌ Erro ao criar quadra') }
  }

  async function criarTorneio(e) {
    e.preventDefault()
    try {
      await api.post('/tournaments', novoTorneio, { headers: { Authorization: `Bearer ${token}` } })
      setMensagem('✅ Torneio criado!')
      setNovoTorneio({ nome: '', descricao: '', data: '', vagas: '', preco: '' })
      carregarDados()
    } catch { setMensagem('❌ Erro ao criar torneio') }
  }

  async function deletarQuadra(id) {
    if (!confirm('Deletar esta quadra?')) return
    await api.delete(`/courts/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    carregarDados()
  }

  async function deletarTorneio(id) {
    if (!confirm('Deletar este torneio?')) return
    await api.delete(`/tournaments/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    carregarDados()
  }

  const statusStyle = {
    pendente: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    confirmado: 'bg-[#00c46a]/10 text-[#00c46a] border-[#00c46a]/20',
    cancelado: 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  const abas = [
    { id: 'reservas', label: '📋 Reservas', count: reservas.length },
    { id: 'quadras', label: '🏟️ Quadras', count: quadras.length },
    { id: 'torneios', label: '🏆 Torneios', count: torneios.length },
    { id: 'caixa', label: '💰 Fluxo de Caixa', count: null },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00c46a] flex items-center justify-center">
            <span className="text-base">🎾</span>
          </div>
          <div>
            <h1 className="text-white font-black text-lg leading-none">PAHRAGON</h1>
            <p className="text-[#00c46a] text-xs font-semibold tracking-widest uppercase">Painel Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm hidden sm:block">Olá, {admin.nome}</span>
          <button
            onClick={() => { localStorage.removeItem('adminToken'); localStorage.removeItem('admin'); navigate('/admin/login') }}
            className="text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-xl transition"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {mensagem && (
          <div className="mb-6 bg-[#00c46a]/10 border border-[#00c46a]/20 text-[#00c46a] text-sm px-4 py-3 rounded-xl">
            {mensagem}
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-2 flex-wrap mb-8">
          {abas.map(a => (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
                aba === a.id
                  ? 'bg-[#00c46a] border-[#00c46a] text-black'
                  : 'bg-transparent border-white/10 text-white/60 hover:text-white hover:border-white/30'
              }`}
            >
              {a.label} {a.count !== null && <span className="ml-1 opacity-60">({a.count})</span>}
            </button>
          ))}
        </div>

        {/* Reservas */}
        {aba === 'reservas' && (
          <div className="space-y-3">
            <h2 className="text-white font-black text-2xl mb-5">Todas as Reservas</h2>
            {reservas.length === 0 ? <p className="text-white/40">Nenhuma reserva ainda.</p> : reservas.map(r => (
              <div key={r.id} className="bg-[#141414] border border-white/5 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-bold">{r.court.nome}</p>
                    <p className="text-white/50 text-sm mt-1">👤 {r.user.nome} — {r.user.email}</p>
                    <p className="text-white/50 text-sm">📅 {new Date(r.data).toLocaleDateString('pt-BR')} · 🕐 {new Date(r.horaInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}–{new Date(r.horaFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusStyle[r.status]}`}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quadras */}
        {aba === 'quadras' && (
          <div>
            <h2 className="text-white font-black text-2xl mb-5">Quadras</h2>
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-bold mb-4">Nova Quadra</h3>
              <form onSubmit={criarQuadra} className="space-y-3">
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00c46a] transition" placeholder="Nome da quadra" value={novaQuadra.nome} onChange={e => setNovaQuadra({ ...novaQuadra, nome: e.target.value })} required />
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00c46a] transition" placeholder="Descrição" value={novaQuadra.descricao} onChange={e => setNovaQuadra({ ...novaQuadra, descricao: e.target.value })} />
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00c46a] transition" placeholder="Preço por hora" type="number" value={novaQuadra.precoPorHora} onChange={e => setNovaQuadra({ ...novaQuadra, precoPorHora: e.target.value })} required />
                <button className="w-full bg-[#00c46a] hover:bg-[#00a857] text-black font-bold py-3 rounded-xl transition" type="submit">Criar Quadra</button>
              </form>
            </div>
            <div className="space-y-3">
              {quadras.map(q => (
                <div key={q.id} className="bg-[#141414] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{q.nome}</p>
                    <p className="text-white/40 text-sm">{q.descricao} · R$ {q.precoPorHora}/h</p>
                  </div>
                  <button onClick={() => deletarQuadra(q.id)} className="text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-xl text-sm transition">Deletar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Torneios */}
        {aba === 'torneios' && (
          <div>
            <h2 className="text-white font-black text-2xl mb-5">Torneios</h2>
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-bold mb-4">Novo Torneio</h3>
              <form onSubmit={criarTorneio} className="space-y-3">
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00c46a] transition" placeholder="Nome do torneio" value={novoTorneio.nome} onChange={e => setNovoTorneio({ ...novoTorneio, nome: e.target.value })} required />
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00c46a] transition" placeholder="Descrição" value={novoTorneio.descricao} onChange={e => setNovoTorneio({ ...novoTorneio, descricao: e.target.value })} />
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00c46a] transition" type="datetime-local" value={novoTorneio.data} onChange={e => setNovoTorneio({ ...novoTorneio, data: e.target.value })} required />
                <div className="grid grid-cols-2 gap-3">
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00c46a] transition" placeholder="Vagas" type="number" value={novoTorneio.vagas} onChange={e => setNovoTorneio({ ...novoTorneio, vagas: e.target.value })} required />
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00c46a] transition" placeholder="Preço (R$)" type="number" value={novoTorneio.preco} onChange={e => setNovoTorneio({ ...novoTorneio, preco: e.target.value })} required />
                </div>
                <button className="w-full bg-[#00c46a] hover:bg-[#00a857] text-black font-bold py-3 rounded-xl transition" type="submit">Criar Torneio</button>
              </form>
            </div>
            <div className="space-y-3">
              {torneios.map(t => (
                <div key={t.id} className="bg-[#141414] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{t.nome}</p>
                    <p className="text-white/40 text-sm">📅 {new Date(t.data).toLocaleDateString('pt-BR')} · 👥 {t.vagas} vagas · R$ {t.preco}</p>
                  </div>
                  <button onClick={() => deletarTorneio(t.id)} className="text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-xl text-sm transition">Deletar</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fluxo de Caixa */}
        {aba === 'caixa' && caixa && (
          <div>
            <h2 className="text-white font-black text-2xl mb-5">Fluxo de Caixa</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                <p className="text-white/40 text-sm uppercase tracking-wider font-semibold mb-1">Total do mês</p>
                <p className="text-4xl font-black text-[#00c46a]">R$ {caixa.totalMes.toFixed(2)}</p>
              </div>
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                <p className="text-white/40 text-sm uppercase tracking-wider font-semibold mb-1">Total geral</p>
                <p className="text-4xl font-black text-white">R$ {caixa.total.toFixed(2)}</p>
              </div>
            </div>
            <h3 className="text-white font-bold mb-4">Transações aprovadas</h3>
            <div className="space-y-3">
              {caixa.payments.length === 0 ? (
                <p className="text-white/40">Nenhuma transação ainda.</p>
              ) : caixa.payments.map(p => (
                <div key={p.id} className="bg-[#141414] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{p.booking.court.nome}</p>
                    <p className="text-white/40 text-sm">👤 {p.booking.user.nome} · 📅 {new Date(p.booking.data).toLocaleDateString('pt-BR')}</p>
                    <p className="text-white/30 text-xs mt-1">{p.metodo}</p>
                  </div>
                  <p className="text-[#00c46a] font-black text-lg">R$ {p.valor.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}