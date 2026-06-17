import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    try {
      const res = await api.post('/auth/admin/login', { email, senha })
      localStorage.setItem('adminToken', res.data.token)
      localStorage.setItem('admin', JSON.stringify(res.data.admin))
      navigate('/admin')
    } catch (_err) {
      setErro('E-mail ou senha incorretos')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎾 Pahragon Beach Tennis</h1>
        <h2 style={styles.subtitle}>Painel Admin</h2>
        {erro && <p style={styles.erro}>{erro}</p>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} required />
          <button style={styles.button} type="submit">Entrar</button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#1a1a2e' },
  card: { background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', width: '100%', maxWidth: '400px' },
  title: { textAlign: 'center', color: '#1a73e8', marginBottom: '0.5rem' },
  subtitle: { textAlign: 'center', color: '#333', marginBottom: '1.5rem' },
  input: { width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box' },
  button: { width: '100%', padding: '0.75rem', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' },
  erro: { color: 'red', textAlign: 'center', marginBottom: '1rem' }
}