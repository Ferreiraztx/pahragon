import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api"; // Certifique-se de que o caminho para o seu axios/api está correto

export default function PagamentoSucesso() {
  const navigate = useNavigate();
  const [statusTexto, setStatusTexto] = useState("Confirmando seu pagamento no sistema...");

  useEffect(() => {
    // Captura o bookingId que o Mercado Pago injeta na URL ao voltar para o site
    const params = new URLSearchParams(window.location.search);
    let bookingId = params.get("bookingId");

    // Backup por Expressão Regular caso a URL venha muito poluída pelo Mercado Pago
    if (!bookingId) {
      const match = window.location.search.match(/[?&]bookingId=(\d+)/);
      bookingId = match ? match[1] : null;
    }

    if (bookingId) {
      console.log("ID da reserva encontrado:", bookingId);
      
      // Chame a rota do backend que criamos para confirmar o pagamento direto
      api.post("/payments/confirmar", {
        bookingId: Number(bookingId),
        status: "approved"
      })
      .then((res) => {
        console.log("Banco de dados atualizado com sucesso:", res.data);
        setStatusTexto("Pagamento confirmado e horário garantido!");
      })
      .catch((err) => {
        console.error("Erro ao avisar o backend:", err);
        setStatusTexto("Pagamento aprovado no Mercado Pago, mas houve um erro ao atualizar o agendamento. Atualize a página.");
      });
    } else {
      setStatusTexto("Aviso: Código de identificação da reserva não foi encontrado na URL.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d3130] antialiased tracking-tight font-sans flex flex-col items-center justify-center px-6 py-12">
      <main className="max-w-md w-full">
        
        {/* Card Principal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-8 shadow-sm relative overflow-hidden">
          
          <div className="flex items-center justify-center gap-1.5 opacity-40">
            <span className="font-black text-sm tracking-tighter text-[#1e2221]">Pahragon</span>
            <span className="text-[8px] font-extrabold uppercase tracking-widest text-teal-600">Beach Tennis</span>
          </div>

          {/* Ícone de Sucesso */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-[#1e2221] font-black text-2xl tracking-tighter">
              Pagamento Concluído!
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto font-medium">
              {statusTexto}
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