import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  // 💡 Removemos o withCredentials global para não quebrar a guia anônima em cross-domain
});

// Adiciona o token automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const ehRotaAdmin = config.url.includes('/admin') || config.url.includes('/manual');

  let token = null;

  if (ehRotaAdmin) {
    token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  } else {
    token = localStorage.getItem('token');
  }

  // 🔥 VALIDAÇÃO ESTRETA: Garante que não estamos enviando lixo por extenso
  if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;