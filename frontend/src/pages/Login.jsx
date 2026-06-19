/* eslint-disable no-unused-vars */
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
      setErro('E-mail ou senha incorretos.')
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* Identidade Visual Homogênea */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-baseline gap-2 mb-4">
            <span className="font-black text-4xl tracking-tighter text-[#1e2221]">pahragon</span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600">arena</span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Acesse sua conta</h1>
          <p className="text-slate-500 text-sm mt-1">Conecte-se para gerenciar seus horários.</p>
        </div>

        {/* Card de Autenticação */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          
          {/* Mensagem de Erro Semitransparente / Suave */}
          {erro && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm px-4 py-3 rounded-xl mb-6 font-medium text-center">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
              <input
                className="w-full mt-1.5 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
              <input
                className="w-full mt-1.5 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
              />
            </div>

            <button
              className="w-full bg-[#1e2221] hover:bg-black text-white font-bold py-3.5 rounded-xl transition shadow-sm mt-2"
              type="submit"
            >
              Entrar
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Não tem conta?{' '}
            <Link to="/register" className="text-teal-600 font-bold hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}