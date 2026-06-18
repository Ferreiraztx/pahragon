import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../services/api'

export default function Torneios() {
  const [torneios, setTorneios] = useState([])

  useEffect(() => {
    api.get('/tournaments').then(res => setTorneios(res.data))
  }, [])

  const whatsappUrl = "https://wa.me/5541999999999"

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-10">
          <span className="text-[#00c46a] text-xs font-bold tracking-widest uppercase">Competições</span>
          <h1 className="text-4xl font-black text-white mt-2">Torneios</h1>
          <p className="text-white/40 mt-2">Confira os próximos torneios e inscreva-se.</p>
        </div>

        {torneios.length === 0 ? (
          <div className="text-center py-20 bg-[#141414] rounded-2xl border border-white/5">
            <p className="text-5xl mb-4">🏆</p>
            <p className="text-white/40">Nenhum torneio disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {torneios.map(t => (
              <div key={t.id} className="bg-[#141414] border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-bold text-xl mb-2">{t.nome}</h3>
                {t.descricao && <p className="text-white/40 text-sm mb-4">{t.descricao}</p>}
                <div className="space-y-1 text-sm text-white/50 mb-5">
                  <p>📅 {new Date(t.data).toLocaleDateString('pt-BR')}</p>
                  <p>👥 {t.vagas} vagas</p>
                  <p>💰 R$ {t.preco.toFixed(2)}</p>
                </div>
                {t.status === 'aberto' && (
                  <a href={whatsappUrl} className="block w-full text-center bg-[#00c46a] hover:bg-[#00a857] text-black font-bold py-3 rounded-xl transition text-sm">
                    Inscrever-se via WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}