import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Booking from './pages/Booking'
import MinhasReservas from './pages/MinhasReservas'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import PagamentoSucesso from './pages/PagamentoSucesso'
import PagamentoFalha from './pages/PagamentoFalha'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div>Carregando...</div>
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/agendar" element={<PrivateRoute><Booking /></PrivateRoute>} />
      <Route path="/minhas-reservas" element={<PrivateRoute><MinhasReservas /></PrivateRoute>} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/pagamento/sucesso" element={<PrivateRoute><PagamentoSucesso /></PrivateRoute>} />
      <Route path="/pagamento/falha" element={<PrivateRoute><PagamentoFalha /></PrivateRoute>} />
      <Route path="/pagamento/pendente" element={<PrivateRoute><PagamentoSucesso /></PrivateRoute>} />
    </Routes>
  )
}