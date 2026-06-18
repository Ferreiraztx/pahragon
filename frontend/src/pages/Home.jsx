import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00c46a]/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-[#00c46a]/10 border border-[#00c46a]/20 text-[#00c46a] text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            🎾 Curitiba — Sta. Quitéria
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tight mb-6">
            Sorriso no rosto,<br />
            <span className="text-[#00c46a]">areia nos pés.</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto mb-10">
            Reserve sua quadra de beach tennis com facilidade e venha jogar no melhor espaço de Curitiba.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/agendar')}
              className="bg-[#00c46a] hover:bg-[#00a857] text-black font-black text-lg px-8 py-4 rounded-2xl transition"
            >
              Agendar agora
            </button>
            <button
              onClick={() => navigate('/torneios')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg px-8 py-4 rounded-2xl transition"
            >
              Ver torneios
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-12 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '4', label: 'Quadras' },
            { num: '3.7k', label: 'Seguidores' },
            { num: '7h–22h', label: 'Seg a Sex' },
            { num: 'Sáb', label: '8h–?' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-4xl font-black text-[#00c46a]">{s.num}</p>
              <p className="text-white/40 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white">Como funciona</h2>
            <p className="text-white/40 mt-2">Reserve em menos de 2 minutos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '👤', step: '01', title: 'Crie sua conta', desc: 'Cadastro rápido e gratuito em segundos.' },
              { icon: '📅', step: '02', title: 'Escolha o horário', desc: 'Veja os horários disponíveis e escolha o melhor para você.' },
              { icon: '✅', step: '03', title: 'Pague e jogue', desc: 'Pagamento seguro via Pix ou cartão. Confirmação na hora.' },
            ].map((item, i) => (
              <div key={i} className="bg-[#141414] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                <span className="absolute top-4 right-5 text-5xl font-black text-white/5">{item.step}</span>
                <div className="w-12 h-12 rounded-xl bg-[#00c46a]/10 flex items-center justify-center mb-4 text-2xl">
                  {item.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/40 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto bg-[#00c46a]/5 border border-[#00c46a]/20 rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-black text-white mb-3">Pronto para jogar?</h2>
          <p className="text-white/40 mb-8">Faça sua reserva agora e garanta seu horário.</p>
          <Link to="/register" className="inline-block bg-[#00c46a] hover:bg-[#00a857] text-black font-black text-lg px-10 py-4 rounded-2xl transition">
            Criar conta grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#00c46a] flex items-center justify-center text-sm">🎾</div>
            <span className="text-white font-black text-sm">PAHRAGON BEACH TENNIS</span>
          </div>
          <p className="text-white/30 text-sm">Rua João Alencar Guimarães, 574 — Sta. Quitéria, Curitiba</p>
          <p className="text-white/30 text-sm">© 2026 Pahragon</p>
        </div>
      </footer>
    </div>
  )
}