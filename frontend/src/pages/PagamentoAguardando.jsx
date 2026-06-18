/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function PagamentoAguardando() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [tempoRestante, setTempoRestante] = useState("10:00");
  const [initPoint, setInitPoint] = useState("");
  const [valorTotal, setValorTotal] = useState(0);

  // Estado para controlar se existe algum aviso de buraco na agenda

  useEffect(() => {
    if (!bookingId) {
      setErro("Reserva não identificada.");
      setLoading(false);
      return;
    }

    // Simulação da busca dos dados do agendamento e geração do link do Mercado Pago
    async function inicializarPagamento() {
      try {
        // 1. Busca os detalhes da reserva
        const resBooking = await api.get(`/bookings/detalhes/${bookingId}`);

        // CORREÇÃO AQUI: Acessa o preço que vem da relação 'court'
        // Se o seu campo no banco for diferente, ajuste 'precoPorHora'
        const preco = resBooking.data.court?.precoPorHora || 80;
        setValorTotal(preco);

        // 2. Tenta gerar a preferência
        const resPagamento = await api.post("/payments/criar-preferencia", {
          bookingId,
        });

        // Verifique se a API realmente retornou o link
        if (resPagamento.data.initPoint) {
          setInitPoint(resPagamento.data.initPoint);
        } else {
          throw new Error("Link não gerado pelo servidor");
        }

        setLoading(false);
      } catch (err) {
        console.error("Erro detalhado:", err);
        setErro("Erro ao conectar com o Mercado Pago. Tente novamente.");
        setLoading(false);
      }
    }

    inicializarPagamento();
  }, [bookingId]);

  // Cronômetro regressivo de 10 minutos
  useEffect(() => {
    // 1. Tenta recuperar o tempo final salvo no navegador
    const tempoFinalSalvo = localStorage.getItem(`tempoFim_${bookingId}`);

    // Se não existir, calcula 10 minutos a partir de agora
    const tempoFim = tempoFinalSalvo
      ? parseInt(tempoFinalSalvo)
      : new Date().getTime() + 10 * 60 * 1000;

    // Se não existia, salva no localStorage
    if (!tempoFinalSalvo) {
      localStorage.setItem(`tempoFim_${bookingId}`, tempoFim);
    }

    const intervalo = setInterval(() => {
      const agora = new Date().getTime();
      const restante = tempoFim - agora;

      if (restante <= 0) {
        clearInterval(intervalo);
        localStorage.removeItem(`tempoFim_${bookingId}`); // Limpa ao acabar
        navigate("/booking");
      } else {
        const m = String(Math.floor(restante / 1000 / 60)).padStart(2, "0");
        const s = String(Math.floor((restante / 1000) % 60)).padStart(2, "0");
        setTempoRestante(`${m}:${s}`);
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [navigate, bookingId]);

  function irParaMercadoPago() {
    console.log("Conteúdo de initPoint:", initPoint); // Verifique se isso aparece no F12 -> Console

    if (initPoint) {
      window.location.href = initPoint;
    } else {
      alert("Erro: O link de pagamento não foi gerado. Verifique o console.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
        <p className="text-white font-medium text-lg animate-pulse">
          Gerando Pix do Mercado Pago...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-12">
      <main className="max-w-md w-full space-y-6">
        {erro && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl text-center">
            {erro}
          </div>
        )}

        {/* Card do Cronômetro Principal */}
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="space-y-2">
            <h2 className="text-purple-400 font-bold text-lg tracking-wide">
              Reserva Quase Pronta!
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
              Seguramos o seu horário na quadra. Conclua o pagamento antes que o
              cronômetro zere para não perder a vaga.
            </p>
          </div>

          {/* Display do Timer */}
          <div className="bg-black/40 border border-white/5 rounded-xl py-6 max-w-[240px] mx-auto shadow-inner">
            <span className="text-5xl font-black text-[#00c46a] tracking-wider font-mono">
              {tempoRestante}
            </span>
          </div>

          {/* Botão de Redirecionamento */}
          <button
            onClick={irParaMercadoPago}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all duration-200 text-base shadow-lg shadow-purple-600/10 border border-purple-500/20 active:scale-[0.99]"
          >
            Ir para o Mercado Pago (Pagar R$ {valorTotal})
          </button>

          <button
            onClick={() => navigate("/booking")}
            className="text-white/40 hover:text-white/70 text-xs font-semibold tracking-wide block mx-auto transition pt-2"
          >
            ← Cancelar e voltar
          </button>
        </div>
      </main>
    </div>
  );
}
