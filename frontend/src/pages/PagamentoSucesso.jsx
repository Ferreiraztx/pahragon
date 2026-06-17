import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

export default function PagamentoSucesso() {
  const [searchParams] = useSearchParams()
  const [reserva, setReserva] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const bookingId = searchParams.get('bookingId')
    const status = searchParams.get('status') || 'approved'

    if (bookingId) {
      api.post('/payments/confirmar', { bookingId, status })
        .then(res => setReserva(res.data))
    }
  }, [])

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <span style={styles.icon}>✅</span>
        <h2>Pagamento aprovado!</h2>
        <p>Sua reserva foi confirmada com sucesso.</p>
        {reserva && (
          <div style={styles.info}>
            <p><strong>{reserva.court.nome}</strong></p>
            <p>📅 {new Date(reserva.data).toLocaleDateString('pt-BR')}</p>
          </div>
        )}
        <button style={styles.button} onClick={() => navigate('/minhas-reservas')}>
          Ver minhas reservas
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f4f8' },
  card: { background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' },
  icon: { fontSize: '4rem' },
  info: { background: '#f0f4f8', padding: '1rem', borderRadius: '8px', margin: '1rem 0' },
  button: { width: '100%', padding: '0.75rem', background: '#34a853', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' }
}