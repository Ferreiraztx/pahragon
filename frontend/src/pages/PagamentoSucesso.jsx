import { useNavigate } from "react-router-dom";

export default function PagamentoSucesso() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d3130] antialiased tracking-tight font-sans flex flex-col items-center justify-center px-6 py-12">
      <main className="max-w-md w-full">
        
        {/* Card Principal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-8 shadow-sm relative overflow-hidden">
          
          {/* Identidade Visual Discreta no topo */}
          <div className="flex items-center justify-center gap-1.5 opacity-40">
            <span className="font-black text-sm tracking-tighter text-[#1e2221]">pahragon</span>
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-emerald-600">arena</span>
          </div>

          {/* Ícone de Sucesso Estilizado */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          {/* Textos Informativos */}
          <div className="space-y-2">
            <h2 className="text-[#1e2221] font-black text-2xl tracking-tighter">
              Reserva Confirmada!
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
              Seu pagamento foi aprovado com sucesso. A quadra já está preparada e reservada para o seu jogo.
            </p>
          </div>

          {/* Caixa de Aviso Informativo */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center">
            <p className="text-xs text-emerald-800 font-medium leading-relaxed">
              Os detalhes do seu agendamento já estão disponíveis no seu painel.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate("/minhas-reservas")}
              className="w-full bg-[#1e2221] hover:bg-black text-white font-bold py-4 rounded-xl transition shadow-md active:scale-[0.99] text-sm tracking-wide"
            >
              Ir para Meus Agendamentos
            </button>

            <button
              onClick={() => navigate("/agendar")}
              className="w-full text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider py-2 transition"
            >
              Reservar outro horário
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}