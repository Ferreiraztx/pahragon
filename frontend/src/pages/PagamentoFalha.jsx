import { useNavigate } from "react-router-dom";

export default function PagamentoFalha() {
  const navigate = useNavigate();

  function lidarTentarNovamente() {
    // Busca robusta pelo bookingId na URL usando Regex
    const match = window.location.search.match(/[?&]bookingId=(\d+)/);
    const bookingId = match ? match[1] : null;

    // Se o usuário estiver logado, ele pode tentar gerar o Pix/Checkout de novo
    const possuiToken = localStorage.getItem("token");

    if (bookingId && possuiToken) {
      navigate(`/pagamento/aguardando?bookingId=${bookingId}`);
    } else {
      // Caso seja um terceiro pagando ou o token tenha expirado, avisa com segurança
      alert("Não foi possível reiniciar o pagamento automaticamente. Peça para o dono da reserva gerar um novo link!");
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d3130] antialiased tracking-tight font-sans flex flex-col items-center justify-center px-6 py-12">
      <main className="max-w-md w-full">
        
        {/* Card Principal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-8 shadow-sm relative overflow-hidden">
          
          {/* Identidade Visual */}
          <div className="flex items-center justify-center gap-1.5 opacity-40">
            <span className="font-black text-sm tracking-tighter text-[#1e2221]">Pahragon</span>
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-rose-600">Beach Tennis</span>
          </div>

          {/* Ícone de Erro */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 border border-rose-100">
            <svg className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-[#1e2221] font-black text-2xl tracking-tighter">
              Ocorreu um Problema
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
              Não conseguimos detectar a aprovação do seu pagamento no banco de dados. Caso já tenha pago, o sistema pode levar alguns minutos para confirmar via Pix.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sugestões:</span>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Aguarde até 2 minutos e atualize a página.</li>
              <li>Verifique o saldo ou limite do seu cartão/Pix.</li>
            </ul>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3 pt-2">
            <button
              onClick={lidarTentarNovamente}
              className="w-full bg-[#1e2221] hover:bg-black text-white font-bold py-4 rounded-xl transition shadow-md active:scale-[0.99] text-sm tracking-wide"
            >
              Tentar Novamente / Verificar
            </button>

            <button
              onClick={() => {
                const possuiToken = localStorage.getItem("token");
                navigate(possuiToken ? "/minhas-reservas" : "/");
              }}
              className="w-full text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wider py-2 transition"
            >
              {localStorage.getItem("token") ? "Ver minhas reservas" : "Voltar para o Início"}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}