import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

export default function Perfil() {
  const { user, logout } = useAuth()

  // Funções Auxiliares de Máscaras (Formatação)
  const aplicarMascaraCPF = (value) => {
    if (!value) return ''
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14)
  }

  const aplicarMascaraCEP = (value) => {
    if (!value) return ''
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9)
  }

  const aplicarMascaraCelular = (value) => {
    if (!value) return ''
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15)
  }

  // Estado inicial limpo
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    celular: '',
    email: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  })

  const [carregando, setCarregando] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' })
  const [celularVerificado, setCellularVerificado] = useState(false)

  // 🔄 BUSCA OS DADOS ATUALIZADOS DO BANCO ASSIM QUE ENTRA NA TELA
  useEffect(() => {
    if (!user) return

    const carregarDadosPerfil = async () => {
      try {
        const response = await api.get('/auth/perfil')
        if (response.data) {
          const dadosDoBanco = response.data
          setFormData({
            nome: dadosDoBanco.nome || '',
            cpf: dadosDoBanco.cpf ? aplicarMascaraCPF(dadosDoBanco.cpf) : '',
            dataNascimento: dadosDoBanco.dataNascimento ? dadosDoBanco.dataNascimento.split('T')[0] : '',
            celular: dadosDoBanco.telefone ? aplicarMascaraCelular(dadosDoBanco.telefone) : '', // mapeado de 'telefone'
            email: dadosDoBanco.email || '',
            cep: dadosDoBanco.cep ? aplicarMascaraCEP(dadosDoBanco.cep) : '',
            rua: dadosDoBanco.rua || '',
            numero: dadosDoBanco.numero || '',
            complemento: dadosDoBanco.complemento || '',
            bairro: dadosDoBanco.bairro || '',
            cidade: dadosDoBanco.cidade || '',
            estado: dadosDoBanco.estado || '',
          })
          if (dadosDoBanco.celularVerificado) {
            setCellularVerificado(dadosDoBanco.celularVerificado)
          }
        }
      } catch (err) {
        console.error("Erro ao buscar dados do perfil:", err)
      }
    }

    carregarDadosPerfil()
  }, [user])

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

  const handleChange = async (e) => {
    const { name, value } = e.target
    let valorFormatado = value

    if (name === 'cpf') valorFormatado = aplicarMascaraCPF(value)
    if (name === 'cep') valorFormatado = aplicarMascaraCEP(value)
    if (name === 'celular') valorFormatado = aplicarMascaraCelular(value)

    setFormData(prev => ({ ...prev, [name]: valorFormatado }))

    if (name === 'cep' && valorFormatado.replace(/\D/g, '').length === 8) {
      const cepApenasNumeros = valorFormatado.replace(/\D/g, '')
      setBuscandoCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepApenasNumeros}/json/`)
        const data = await response.json()
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          }))
        } else {
          setMensagem({ tipo: 'erro', texto: 'CEP não encontrado. Digite o endereço manualmente.' })
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err)
      } finally {
        setBuscandoCep(false)
      }
    }
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setMensagem({ tipo: '', texto: '' })

    try {
      // Faz o PUT enviando os dados do formulário
      const response = await api.put('/auth/perfil', formData)
      
      setMensagem({ tipo: 'sucesso', texto: 'Perfil atualizado com sucesso!' })

      // Atualiza o estado local com o retorno do backend para garantir consistência visual
      if (response.data?.user) {
        const atualizado = response.data.user
        setFormData(prev => ({
          ...prev,
          nome: atualizado.nome || prev.nome,
          cpf: atualizado.cpf ? aplicarMascaraCPF(atualizado.cpf) : prev.cpf,
          dataNascimento: atualizado.dataNascimento ? atualizado.dataNascimento.split('T')[0] : prev.dataNascimento,
          celular: updated.telefone ? aplicarMascaraCelular(atualizado.telefone) : prev.celular,
          cep: atualizado.cep ? aplicarMascaraCEP(atualizado.cep) : prev.cep,
          rua: atualizado.rua || prev.rua,
          numero: atualizado.numero || prev.numero,
          complemento: atualizado.complemento || prev.complemento,
          bairro: atualizado.bairro || prev.bairro,
          cidade: updated.cidade || prev.cidade,
          estado: atualizado.estado || prev.estado
        }))
      }
    } catch (err) {
      console.error(err)
      setMensagem({ 
        tipo: 'erro', 
        texto: err.response?.data?.error || 'Erro ao salvar as alterações. Tente novamente.' 
      })
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] pt-28 pb-12 px-4 sm:px-6 lg:px-8">
      <Navbar />
      
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSalvar} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-8">
          
          <div className="border-b border-slate-100 pb-5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Meu Perfil</h1>
            <p className="text-slate-500 text-sm mt-1">Gerencie suas informações pessoais e dados de endereço.</p>
          </div>

          {mensagem.texto && (
            <div className={`text-sm px-4 py-3 rounded-xl font-medium text-center transition ${
              mensagem.tipo === 'sucesso' 
                ? 'bg-teal-50 border border-teal-100 text-teal-700' 
                : 'bg-rose-50 border border-rose-100 text-rose-700'
            }`}>
              {mensagem.texto}
            </div>
          )}

          {/* SEÇÃO 1: MEUS DADOS */}
          <div className="space-y-5">
            <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-2">
              Meus Dados
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Nome Completo</label>
                <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-teal-500 transition" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">CPF</label>
                <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-teal-500 transition" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Data de Nascimento</label>
                <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-teal-500 transition" />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Celular</label>
                  {celularVerificado ? (
                    <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-bold">Verificado</span>
                  ) : (
                    <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold cursor-pointer hover:bg-amber-100 transition" onClick={() => alert('Disparar código de verificação!')}>Não Verificado</span>
                  )}
                </div>
                <input type="tel" name="celular" value={formData.celular} onChange={handleChange} placeholder="(41) 99999-9999" className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-teal-500 transition" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">E-mail</label>
                <input type="email" name="email" value={formData.email} disabled className="w-full mt-1.5 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-400 font-medium cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: DADOS DE ENDEREÇO */}
          <div className="space-y-5 pt-2">
            <h2 className="text-xs font-bold text-teal-600 uppercase tracking-widest border-b border-slate-100 pb-2">
              Dados de Endereço {buscandoCep && <span className="text-[11px] text-slate-400 normal-case font-normal ml-2">(Buscando CEP...)</span>}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">CEP</label>
                <input type="text" name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000" className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-teal-500 transition" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Nome da Rua / Av</label>
                <input type="text" name="rua" value={formData.rua} onChange={handleChange} className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-teal-500 transition" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Número</label>
                <input type="text" name="numero" value={formData.numero} onChange={handleChange} className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-teal-500 transition" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Complemento</label>
                <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} placeholder="Apto, Bloco, etc. (Opcional)" className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-teal-500 transition" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Bairro</label>
                <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-teal-500 transition" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Cidade</label>
                <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-teal-500 transition" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Estado (UF)</label>
                <input type="text" name="estado" value={formData.estado} onChange={handleChange} placeholder="PR" maxLength="2" className="w-full mt-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:border-teal-500 transition uppercase" />
              </div>
            </div>
          </div>

          {/* RODAPÉ DE AÇÕES */}
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-3 sm:justify-between">
            <button type="button" onClick={logout} className="bg-rose-50 border border-rose-100 text-rose-700 font-bold px-5 py-3 rounded-xl hover:bg-rose-100 transition text-sm text-center">
              Sair da Conta
            </button>

            <button 
              type="submit" 
              disabled={carregando}
              className="bg-[#1e2221] hover:bg-black text-white font-bold px-6 py-3 rounded-xl transition text-sm text-center shadow-sm disabled:opacity-50 min-w-[140px]"
            >
              {carregando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}