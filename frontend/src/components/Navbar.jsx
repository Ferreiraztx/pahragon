import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00c46a] flex items-center justify-center">
            <span className="text-base">🎾</span>
          </div>
          <div>
            <h1 className="text-white font-black text-lg tracking-tight leading-none">PAHRAGON</h1>
            <p className="text-[#00c46a] text-xs font-semibold tracking-widest uppercase">Beach Tennis</p>
          </div>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/torneios" className="text-white/60 hover:text-white text-sm font-medium transition">Torneios</Link>
          <Link to="/contato" className="text-white/60 hover:text-white text-sm font-medium transition">Contato</Link>
          {user ? (
            <>
              <Link to="/minhas-reservas" className="text-white/60 hover:text-white text-sm font-medium transition">Minhas Reservas</Link>
              <Link to="/agendar" className="bg-[#00c46a] hover:bg-[#00a857] text-black font-bold text-sm px-5 py-2.5 rounded-xl transition">
                Agendar
              </Link>
              <button onClick={handleLogout} className="text-white/40 hover:text-white text-sm transition">Sair</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white/60 hover:text-white text-sm font-medium transition">Entrar</Link>
              <Link to="/register" className="bg-[#00c46a] hover:bg-[#00a857] text-black font-bold text-sm px-5 py-2.5 rounded-xl transition">
                Criar conta
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-white" onClick={() => setMenu(!menu)}>
          {menu ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menu && (
        <div className="md:hidden bg-[#141414] border-t border-white/5 px-6 py-4 space-y-4">
          <Link to="/torneios" className="block text-white/60 hover:text-white text-sm font-medium transition">Torneios</Link>
          <Link to="/contato" className="block text-white/60 hover:text-white text-sm font-medium transition">Contato</Link>
          {user ? (
            <>
              <Link to="/minhas-reservas" className="block text-white/60 hover:text-white text-sm font-medium transition">Minhas Reservas</Link>
              <Link to="/agendar" className="block bg-[#00c46a] text-black font-bold text-sm px-5 py-2.5 rounded-xl text-center">Agendar</Link>
              <button onClick={handleLogout} className="block text-white/40 text-sm">Sair</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-white/60 hover:text-white text-sm">Entrar</Link>
              <Link to="/register" className="block bg-[#00c46a] text-black font-bold text-sm px-5 py-2.5 rounded-xl text-center">Criar conta</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}