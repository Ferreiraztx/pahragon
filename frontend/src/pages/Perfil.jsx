import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar' // 👈 1. Importa a sua Navbar aqui

export default function Perfil() {
  const { user, logout } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-4">
        <p className="text-slate-500 mb-4">Você precisa estar logado para acessar esta página.</p>
        <Link to="/login" className="bg-[#1e2221] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-black transition">
          Fazer Login
        </Link>
      </div>
    )
  }

  return (
    // 👈 2. MUDANÇA AQUI: Adicionado pt-28 para a Navbar fixa não cobrir o conteúdo
    <div className="min-h-screen bg-[#faf9f6] pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <Navbar /> {/* 👈 3. Coloca a Navbar bem aqui */}
      
      <div className="max-w-2xl mx-auto">
        
        {/* Card Principal do Perfil */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Meu Perfil</h1>
            <p className="text-slate-500 text-sm mt-1">Gerencie suas informações de conta.</p>
          </div>

          {/* Dados do Usuário */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Nome Completo</span>
              <div className="w-full mt-1.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-700 font-medium">
                {user.nome || 'Não informado'}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">E-mail</span>
              <div className="w-full mt-1.5 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-700 font-medium">
                {user.email}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-3 sm:justify-between">
            <button
              onClick={logout}
              className="bg-rose-50 border border-rose-100 text-rose-700 font-bold px-5 py-3 rounded-xl hover:bg-rose-100 transition text-sm text-center"
            >
              Sair da Conta
            </button>

            <button
              onClick={() => alert('Funcionalidade de edição em breve!')}
              className="bg-[#1e2221] hover:bg-black text-white font-bold px-6 py-3 rounded-xl transition text-sm text-center"
            >
              Salvar Alterações
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}