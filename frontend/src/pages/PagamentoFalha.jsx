import { useNavigate } from 'react-router-dom'

export default function PagamentoFalha() {
  const navigate = useNavigate()

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <span style={styles.icon}>❌</span>
        <h2>Pagamento não aprovado</h2>
        <p>Ocorreu um problema com seu pagamento. Tente novamente.</p>
        <button style={styles.button} onClick={() => navigate('/agendar')}>
          Tentar novamente
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f4f8' },
  card: { background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' },
  icon: { fontSize: '4rem' },
  button: { width: '100%', padding: '0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' }
}