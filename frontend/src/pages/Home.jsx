import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d3130] antialiased tracking-tight font-sans text-base pt-20">
      <Navbar />

      {/* HERO SECTION — GRID ASSETRICO (UPGRADE VISUAL) */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 border-b border-slate-200/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Lado Esquerdo: Mensagem Forte e Editorial */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200/60 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-teal-700">Grade de hoje aberta</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-light text-slate-900 tracking-tighter leading-[0.95]">
              Sorriso no rosto,<br />
              <span className="font-black text-[#1e2221]">areia nos pés.</span>
            </h1>
            
            <p className="text-slate-500 text-base sm:text-lg max-w-xl leading-relaxed font-normal">
              A pahragon arena combina o minimalismo de um espaço planejado com a energia do beach tennis. Agende sua quadra em segundos e viva essa experiência no Santa Quitéria.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => navigate('/agendar')}
                className="bg-[#1e2221] hover:bg-black text-white text-sm font-bold px-7 py-4 rounded-xl transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Agendar Horário
              </button>
              <button
                onClick={() => navigate('/torneios')}
                className="text-sm font-bold text-slate-600 px-6 py-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm"
              >
                Inscrições em Torneios
              </button>
            </div>
          </div>

          {/* Lado Direito: Card Mockup de Agendamento (Simulando o Admin) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Quadra Central</h3>
                <p className="text-xs text-slate-400 font-medium">Disponibilidade para Hoje</p>
              </div>
              <span className="text-xs font-mono font-bold bg-teal-100/80 text-teal-900 px-2.5 py-1 rounded-lg uppercase">
                R$ 90/h
              </span>
            </div>

            {/* Simulação de Mini Linha do Tempo / Horários */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
                <span className="text-xs font-mono font-bold text-slate-400">18:00h - 19:00h</span>
                <span className="text-xs font-bold text-slate-400">Reservado</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-teal-200 shadow-sm">
                <span className="text-xs font-mono font-bold text-teal-700">19:00h - 20:00h</span>
                <span className="text-xs font-extrabold text-teal-600 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded">Disponível</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-teal-200 shadow-sm">
                <span className="text-xs font-mono font-bold text-teal-700">20:00h - 21:00h</span>
                <span className="text-xs font-extrabold text-teal-600 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded">Disponível</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/agendar')}
              className="w-full text-center text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900 transition-colors pt-2"
            >
              Clique para ver a grade completa →
            </button>
          </div>

        </div>
      </section>

      {/* ESTATÍSTICAS ESTILO DASHBOARD */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left py-6 px-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Estrutura</span>
            <span className="text-3xl font-light text-[#1e2221] font-mono tracking-tighter">04 <span className="text-base font-sans font-medium text-slate-400">Quadras Cobertas</span></span>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-4 sm:pt-0 sm:pl-8">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Comunidade</span>
            <span className="text-3xl font-light text-teal-600 font-mono tracking-tighter">+500 <span className="text-base font-sans font-medium text-slate-400">Atletas</span></span>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l border-slate-200/80 pt-4 sm:pt-0 sm:pl-8">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Localização</span>
            <span className="text-3xl font-light text-slate-900 font-mono tracking-tighter">Próximo <span className="text-base font-sans font-medium text-slate-400">ao Batel</span></span>
          </div>
        </div>
      </section>

      {/* SEÇÃO COMO FUNCIONA (CARDS FLUIDOS DO ADMIN) */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-4">
            <p className="text-xs font-black uppercase tracking-widest text-teal-600 mb-2">Fluxo Simplificado</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Agende sem burocracia ou intermediários.</h2>
            <p className="text-slate-400 text-sm font-normal mt-3 leading-relaxed">
              Desenvolvemos um ecossistema limpo para que sua única preocupação seja a partida.
            </p>
          </div>

          <div className="lg:col-span-8 space-y-4">
            {[
              { num: '01', title: 'Escolha a Quadra e o Horário', desc: 'Nossa grade mostra em tempo real as quadras e horários livres na Arena.' },
              { num: '02', title: 'Identifique-se Instantaneamente', desc: 'Entre com sua conta rápida para vincular a reserva de forma segura.' },
              { num: '03', title: 'Confirmação via PIX', desc: 'Integração de pagamento direto. Confirmou, a quadra já fica trancada no seu nome no painel.' }
            ].map((step, idx) => (
              <div key={idx} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 flex items-start gap-6 transition-all group">
                <span className="text-2xl font-mono font-black text-slate-300 group-hover:text-teal-600 transition-colors leading-none">
                  {step.num}
                </span>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">{step.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAL TO ACTION (ESTILO ALERTA DE CONFIRMAÇÃO) */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-base text-teal-900 bg-teal-50 border border-teal-200/60 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-black text-xl text-[#1e2221]">Quer garantir o melhor horário da semana?</h4>
            <p className="text-teal-800 text-sm font-medium">Os horários nobres de fim de tarde costumam fechar rápido. Garanta o seu.</p>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-3.5 rounded-xl bg-[#1e2221] hover:bg-black text-white text-sm font-bold shadow-md transition whitespace-nowrap w-full md:w-auto text-center"
          >
            Começar Agora
          </button>
        </div>
      </section>

      {/* FOOTER INSTITUCIONAL */}
      <footer className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/80 text-sm text-slate-400">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="font-bold text-slate-800">pahragon arena</span>
          <span className="opacity-40">•</span>
          <span>Santa Quitéria — Curitiba</span>
        </div>
        <p className="mt-2 sm:mt-0 text-xs font-mono">© 2026 — Premium Sand Experience</p>
      </footer>
    </div>
  )
}