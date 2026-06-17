import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function Register() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefone: '' })
  const [erro, setErro] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.user, res.data.token)
      navigate('/')
    } catch (_err) {
      setErro('Erro ao cadastrar. Tente outro e-mail.')
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
          <h2 className="text-xl font-bold text-white mb-6">Criar conta</h2>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'nome', label: 'Nome completo', type: 'text', placeholder: 'Seu nome' },
              { name: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com' },
              { name: 'senha', label: 'Senha', type: 'password', placeholder: '••••••••' },
              { name: 'telefone', label: 'Telefone', type: 'text', placeholder: '(00) 00000-0000' },
            ].map(field => (
              <div key={field.name}>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{field.label}</label>
                <input
                  className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#00c46a] transition"
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  onChange={handleChange}
                  required={field.name !== 'telefone'}
                />
              </div>
            ))}
            <button
              className="w-full bg-[#00c46a] hover:bg-[#00a857] text-black font-bold py-3.5 rounded-xl transition mt-2"
              type="submit"
            >
              Criar conta
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-[#00c46a] font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}