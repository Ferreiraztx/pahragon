import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function AdminDashboard() {
  const [reservas, setReservas] = useState([])
  const [quadras, setQuadras] = useState([])
  const [aba, setAba] = useState('reservas')
  const [novaQuadra, setNovaQuadra] = useState({ nome: '', descricao: '', precoPorHora: '' })
  const [mensagem, setMensagem] = useState('')
  const navigate = useNavigate()

  const admin = JSON.parse(localStorage.getItem('admin') || '{}')
  const token = localStorage.getItem('adminToken')

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return }
    carregarDados()
  }, [])

  async function carregarDados() {
    const [resReservas, resQuadras] = await Promise.all([
      api.get('/bookings/todas', { headers: { Authorization: `Bearer ${token}` } }),
      api.get('/courts')
    ])
    setReservas(resReservas.data)
    setQuadras(resQuadras.data)
  }

  async function criarQuadra(e) {
    e.preventDefault()
    try {
      await api.post('/courts', { ...novaQuadra, precoPorHora: Number(novaQuadra.precoPorHora) }, { headers: { Authorization: `Bearer ${token}` } })
      setMensagem('✅ Quadra criada com sucesso!')
      setNovaQuadra({ nome: '', descricao: '', precoPorHora: '' })
      carregarDados()
    } catch (_err) {
      setMensagem('❌ Erro ao criar quadra')
    }
  }

  async function deletarQuadra(id) {
    if (!confirm('Deseja deletar esta quadra?')) return
    await api.delete(`/courts/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    carregarDados()
  }

  function handleLogout() {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('admin')
    navigate('/admin/login')
  }

  const statusColor = { pendente: '#f59e0b', confirmado: '#34a853', cancelado: '#ef4444' }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎾 Painel Admin</h1>
        <div style={styles.headerRight}>
          <span style={styles.adminNome}>Olá, {admin.nome}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Sair</button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.abas}>
          <button style={{ ...styles.aba, ...(aba === 'reservas' ? styles.abaAtiva : {}) }} onClick={() => setAba('reservas')}>📋 Reservas ({reservas.length})</button>
          <button style={{ ...styles.aba, ...(aba === 'quadras' ? styles.abaAtiva : {}) }} onClick={() => setAba('quadras')}>🏟️ Quadras ({quadras.length})</button>
        </div>

        {aba === 'reservas' && (
          <div>
            <h2>Todas as Reservas</h2>
            {reservas.length === 0 ? <p>Nenhuma reserva ainda.</p> : reservas.map(r => (
              <div key={r.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <strong>{r.court.nome}</strong>
                    <p style={styles.cardInfo}>👤 {r.user.nome} — {r.user.email}</p>
                    <p style={styles.cardInfo}>📅 {new Date(r.data).toLocaleDateString('pt-BR')}</p>
                    <p style={styles.cardInfo}>🕐 {new Date(r.horaInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — {new Date(r.horaFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span style={{ ...styles.badge, background: statusColor[r.status] }}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === 'quadras' && (
          <div>
            <h2>Gerenciar Quadras</h2>
            {mensagem && <p>{mensagem}</p>}
            <form onSubmit={criarQuadra} style={styles.form}>
              <h3>Nova Quadra</h3>
              <input style={styles.input} placeholder="Nome da quadra" value={novaQuadra.nome} onChange={e => setNovaQuadra({ ...novaQuadra, nome: e.target.value })} required />
              <input style={styles.input} placeholder="Descrição" value={novaQuadra.descricao} onChange={e => setNovaQuadra({ ...novaQuadra, descricao: e.target.value })} />
              <input style={styles.input} placeholder="Preço por hora (ex: 80)" type="number" value={novaQuadra.precoPorHora} onChange={e => setNovaQuadra({ ...novaQuadra, precoPorHora: e.target.value })} required />
              <button style={styles.button} type="submit">Criar Quadra</button>
            </form>

            <h3>Quadras cadastradas</h3>
            {quadras.map(q => (
              <div key={q.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <strong>{q.nome}</strong>
                    <p style={styles.cardInfo}>{q.descricao}</p>
                    <p style={styles.cardInfo}>💰 R$ {q.precoPorHora}/hora</p>
                  </div>
                  <button style={styles.deleteBtn} onClick={() => deletarQuadra(q.id)}>Deletar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#27274d' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#1a1a2e', color: '#fff' },
  title: { margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  adminNome: { fontSize: '0.9rem' },
  logoutBtn: { background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' },
  content: { padding: '2rem', maxWidth: '800px', margin: '0 auto' },
  abas: { display: 'flex', gap: '1rem', marginBottom: '2rem' },
  aba: { padding: '0.75rem 1.5rem', borderRadius: '8px', border: '2px solid #1a73e8', background: '#fff', color: '#1a73e8', cursor: 'pointer', fontSize: '1rem' },
  abaAtiva: { background: '#1a73e8', color: '#fff' },
  card: { background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '1rem' },
  cardHeader: { color:'#000000' ,display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' },
  badge: { color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', whiteSpace: 'nowrap' },
  form: { color:'#000000', background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '2rem' },
  input: { color:'#00000', width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' },
  deleteBtn: { padding: '0.5rem 1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }
}