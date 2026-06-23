import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 1. O Provedor do Google envolve todo o ecossistema */}
    <GoogleOAuthProvider clientId="51381606864-terprlk1d65qajdnovbr2vlh758vspq2.apps.googleusercontent.com">
      {/* 2. O BrowserRouter garante que os hooks de rotas (useNavigate, Link) funcionem */}
      <BrowserRouter>
        {/* 3. O AuthProvider gerencia o contexto de login do seu sistema */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
)