import { useNavigate } from "react-router-dom";

export default function PagamentoFalha() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d3130] antialiased tracking-tight font-sans flex flex-col items-center justify-center px-6 py-12">
      <main className="max-w-md w-full">
        
        {/* Card Principal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-8 shadow-sm relative overflow-hidden">
          
          {/* Identidade Visual Discreta no topo */}
          <div className="flex items-center justify-center gap-1.5 opacity-40">
            <span className="font-black text-sm tracking-tighter text-[#1e2221]">pahragon</span>
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-rose-600">arena</span>
          </div>

          {/* Ícone de Erro Estilizado */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 border border-rose-100">
            <svg className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Textos Informativos */}
          <div className="space-y-2">
            <h2 className="text-[#1e2221] font-black text-2xl tracking-tighter">
              Ocorreu um Problema
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
              Não conseguimos processar o seu pagamento com o Mercado Pago. Nenhuma cobrança foi realizada e seu horário ainda pode estar reservado.
            </p>
          </div>

          {/* Dicas de Resolução Estilo Admin */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sugestões:</span>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Verifique o saldo ou limite do seu cartão.</li>
              <li>Tente utilizar a opção de pagamento via Pix.</li>
            </ul>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => navigate("/agendar")}
              className="w-full bg-[#1e2221] hover:bg-black text-white font-bold py-4 rounded-xl transition shadow-md active:scale-[0.99] text-sm tracking-wide"
            >
              Tentar Novamente
            </button>

            <button
              onClick={() => navigate("/minhas-reservas")}
              className="w-full text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider py-2 transition"
            >
              Ver minhas reservas
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}