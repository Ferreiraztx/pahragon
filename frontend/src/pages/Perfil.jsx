import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

export default function Perfil() {
  const { user, logout } = useAuth()

  const aplicarMascaraCPF = (value) => {
    if (!value) return ''
    return value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').substring(0, 14)
  }

  const aplicarMascaraCEP = (value) => {
    if (!value) return ''
    return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9)
  }

  const aplicarMascaraCelular = (value) => {
    if (!value) return ''
    return value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15)
  }

  const [formData, setFormData] = useState({
    nome: '', cpf: '', dataNascimento: '', celular: '', email: '', 
    cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: ''
  })

  const [carregando, setCarregando] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' })

  useEffect(() => {
    if (!user) return
    const carregarDadosPerfil = async () => {
      try {
        const response = await api.get('/auth/perfil')
        if (response.data) {
          const d = response.data
          setFormData({
            nome: d.nome || '',
            cpf: d.cpf ? aplicarMascaraCPF(d.cpf) : '',
            dataNascimento: d.dataNascimento ? d.dataNascimento.split('T')[0] : '',
            celular: d.telefone ? aplicarMascaraCelular(d.telefone) : '',
            email: d.email || '',
            cep: d.cep ? aplicarMascaraCEP(d.cep) : '',
            rua: d.rua || '',
            numero: d.numero || '',
            complemento: d.complemento || '',
            bairro: d.bairro || '',
            cidade: d.cidade || '',
            estado: d.estado || ''
          })
        }
      } catch (err) { console.error(err) }
    }
    carregarDadosPerfil()
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-4">
        <p className="text-slate-500 mb-4">Você precisa estar logado.</p>
        <Link to="/login" className="bg-[#1e2221] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-black transition">Fazer Login</Link>
      </div>
    )
  }

  const handleChange = async (e) => {
    const { name, value } = e.target
    let v = value
    if (name === 'cpf') v = aplicarMascaraCPF(value)
    if (name === 'cep') v = aplicarMascaraCEP(value)
    if (name === 'celular') v = aplicarMascaraCelular(value)
    setFormData(prev => ({ ...prev, [name]: v }))

    if (name === 'cep' && v.replace(/\D/g, '').length === 8) {
      setBuscandoCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${v.replace(/\D/g, '')}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setFormData(prev => ({ ...prev, rua: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }))
        }
      } finally { setBuscandoCep(false) }
    }
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    setCarregando(true)
    try {
      const response = await api.put('/auth/perfil', formData)
      setMensagem({ tipo: 'sucesso', texto: 'Perfil atualizado!' })
      if (response.data?.user) {
        const a = response.data.user
        setFormData(prev => ({
          ...prev,
          nome: a.nome || prev.nome,
          cpf: a.cpf ? aplicarMascaraCPF(a.cpf) : prev.cpf,
          dataNascimento: a.dataNascimento ? a.dataNascimento.split('T')[0] : prev.dataNascimento,
          celular: a.telefone ? aplicarMascaraCelular(a.telefone) : prev.celular,
          cep: a.cep ? aplicarMascaraCEP(a.cep) : prev.cep,
          rua: a.rua || prev.rua,
          numero: a.numero || prev.numero,
          complemento: a.complemento || prev.complemento,
          bairro: a.bairro || prev.bairro,
          cidade: a.cidade || prev.cidade,
          estado: a.estado || prev.estado
        }))
      }
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao salvar.' })
    } finally { setCarregando(false) }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] pt-28 pb-12 px-4">
      <Navbar />
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSalvar} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-8">
          <div className="border-b border-slate-100 pb-5">
            <h1 className="text-2xl font-black text-slate-900">Meu Perfil</h1>
          </div>
          
          {mensagem.texto && (
            <div className={`p-3 rounded-xl text-center ${mensagem.tipo === 'sucesso' ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'}`}>
              {mensagem.texto}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="w-full bg-slate-50 border p-3 rounded-xl" placeholder="Nome" />
            <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="CPF" className="w-full bg-slate-50 border p-3 rounded-xl" />
          </div>

          <button type="submit" className="bg-[#1e2221] text-white px-6 py-3 rounded-xl w-full">
            {carregando ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}