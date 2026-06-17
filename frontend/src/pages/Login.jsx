import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    try {
      const res = await api.post('/auth/login', { email, senha })
      login(res.data.user, res.data.token)
      navigate('/')
    } catch (_err) {
      setErro('E-mail ou senha incorretos')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00c46a] mb-4">
            <span className="text-2xl">🎾</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">PAHRAGON</h1>
          <p className="text-[#00c46a] font-semibold text-sm tracking-widest uppercase mt-1">Beach Tennis</p>
        </div>

        <div className="bg-[#141414] rounded-2xl p-8 border border-white/5">
          <h2 className="text-xl font-bold text-white mb-6">Entrar na conta</h2>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">E-mail</label>
              <input
                className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00c46a] transition"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Senha</label>
              <input
                className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00c46a] transition"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
              />
            </div>
            <button
              className="w-full bg-[#00c46a] hover:bg-[#00a857] text-black font-bold py-3.5 rounded-xl transition mt-2"
              type="submit"
            >
              Entrar
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Não tem conta?{' '}
            <Link to="/register" className="text-[#00c46a] font-semibold hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}