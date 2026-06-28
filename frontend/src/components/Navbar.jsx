import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const {user} = useAuth()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#faf9f6]/80 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Identidade Visual Idêntica ao Cabeçalho do Admin */}
        <Link to="/" className="flex items-baseline gap-2" onClick={() => setMenu(false)}>
          <span className="font-black text-2xl tracking-tighter text-[#1e2221]">Pahragon</span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">Beach Tennis</span>
        </Link>

        {/* Desktop Menu (Estilo Admin Minimalista) */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link to="/torneios" className="text-slate-500 hover:text-slate-900 font-semibold transition">
            Torneios
          </Link>
          <Link to="/contato" className="text-slate-500 hover:text-slate-900 font-semibold transition">
            Contato
          </Link>
          <Link to="/estrutura" className="text-slate-500 hover:text-slate-900 font-semibold transition">
            Estrutura
          </Link>
          
          {user ? (
            <>
              <Link to="/minhas-reservas" className="text-slate-500 hover:text-slate-900 font-semibold transition">
                Minhas Reservas
              </Link>

              <Link 
                to="/agendar" 
                className="bg-[#1e2221] hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
              >
                Agendar
              </Link>

                            {/* Link para o Perfil adicionado de forma elegante */}
              <Link 
                to="/perfil" 
                className="text-slate-600 hover:text-teal-600 font-bold transition flex items-center gap-1.5"
              >
                <span>👤</span>
                <span>{user.nome ? user.nome.split(' ')[0] : 'Perfil'}</span>
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="bg-[#1e2221] hover:bg-black text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
              >
                Criar conta / Entrar
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-[#1e2221] font-bold text-lg" onClick={() => setMenu(!menu)}>
          {menu ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menu && (
        <div className="md:hidden bg-[#faf9f6] border-t border-slate-200/80 px-6 py-4 space-y-4 shadow-inner">
          <Link to="/torneios" onClick={() => setMenu(false)} className="block text-slate-600 hover:text-slate-900 font-semibold text-sm transition">Torneios</Link>
          <Link to="/contato" onClick={() => setMenu(false)} className="block text-slate-600 hover:text-slate-900 font-semibold text-sm transition">Contato</Link>
          {user ? (
            <>
              <Link to="/minhas-reservas" onClick={() => setMenu(false)} className="block text-slate-600 hover:text-slate-900 font-semibold text-sm transition">Minhas Reservas</Link>
              
              {/* Perfil no Mobile */}
              <Link to="/perfil" onClick={() => setMenu(false)} className="block text-slate-600 hover:text-teal-600 font-bold text-sm transition">Meu Perfil 👤</Link>
              
              <Link to="/agendar" onClick={() => setMenu(false)} className="block bg-[#1e2221] text-white font-bold text-sm px-5 py-2.5 rounded-xl text-center shadow-sm">Agendar</Link>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenu(false)} className="block bg-[#1e2221] text-white font-bold text-sm px-5 py-2.5 rounded-xl text-center shadow-sm">Criar conta / Entrar</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}