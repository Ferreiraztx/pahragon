import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Booking from './pages/Booking'
import MinhasReservas from './pages/MinhasReservas'
import Torneios from './pages/Torneios'
import Contato from './pages/Contato'
import PagamentoSucesso from './pages/PagamentoSucesso'
import PagamentoFalha from './pages/PagamentoFalha'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import PagamentoAguardando from './pages/PagamentoAguardando';
import Perfil from './pages/Perfil'
import Estrutura from './pages/Estrutura';
import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'
import ProcessarPagamento from "./pages/ProcessarPagamento";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-[#0a0a0a]" />
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/torneios" element={<Torneios />} />
      <Route path="/estrutura" element={<Estrutura />} />
      <Route path="/contato" element={<Contato />} />
      <Route path="/agendar" element={<PrivateRoute><Booking /></PrivateRoute>} />
      <Route path="/minhas-reservas" element={<PrivateRoute><MinhasReservas /></PrivateRoute>} />
      <Route path="/pagamento/aguardando" element={<PagamentoAguardando />} />
      <Route path="/pagamento/processar" element={<ProcessarPagamento />} />
      <Route path="/pagamento/sucesso" element={<PrivateRoute><PagamentoSucesso /></PrivateRoute>} />
      <Route path="/pagamento/falha" element={<PrivateRoute><PagamentoFalha /></PrivateRoute>} />
      <Route path="/pagamento/pendente" element={<PrivateRoute><PagamentoSucesso /></PrivateRoute>} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  )
}