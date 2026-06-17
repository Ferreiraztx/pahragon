import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00c46a] flex items-center justify-center">
            <span className="text-base">🎾</span>
          </div>
          <div>
            <h1 className="text-white font-black text-lg tracking-tight leading-none">PAHRAGON</h1>
            <p className="text-[#00c46a] text-xs font-semibold tracking-widest uppercase">Beach Tennis</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm hidden sm:block">{user?.nome}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-xl transition"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h2 className="text-4xl font-black text-white">Olá, {user?.nome?.split(' ')[0]}! 👋</h2>
          <p className="text-white/40 mt-2">O que você quer fazer hoje?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/agendar')}
            className="bg-[#141414] hover:bg-[#1a1a1a] border border-white/5 hover:border-[#00c46a]/30 rounded-2xl p-6 text-left transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#00c46a]/10 flex items-center justify-center mb-4 group-hover:bg-[#00c46a]/20 transition">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-white font-bold text-lg">Agendar Quadra</h3>
            <p className="text-white/40 text-sm mt-1">Reserve um horário para jogar</p>
          </button>

          <button
            onClick={() => navigate('/minhas-reservas')}
            className="bg-[#141414] hover:bg-[#1a1a1a] border border-white/5 hover:border-[#00c46a]/30 rounded-2xl p-6 text-left transition group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#00c46a]/10 flex items-center justify-center mb-4 group-hover:bg-[#00c46a]/20 transition">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-white font-bold text-lg">Minhas Reservas</h3>
            <p className="text-white/40 text-sm mt-1">Veja seus agendamentos</p>
          </button>
        </div>
      </main>
    </div>
  )
}