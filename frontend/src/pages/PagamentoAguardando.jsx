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

  useEffect(() => {
    if (!bookingId) {
      setErro("Reserva não identificada.");
      setLoading(false);
      return;
    }

    async function inicializarPagamento() {
      try {
        const resBooking = await api.get(`/bookings/detalhes/${bookingId}`);

        const preco = resBooking.data.court?.precoPorHora || 80;
        setValorTotal(preco);

        const resPagamento = await api.post("/payments/criar-preferencia", {
          bookingId,
        });

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

  // Cancela a reserva no banco, liberando o horário para outras pessoas
  async function liberarReserva() {
    try {
      await api.patch(`/bookings/${bookingId}/cancelar`);
    } catch (err) {
      // Mesmo se der erro (ex: já estava cancelada), seguimos o fluxo normalmente
      console.error("Erro ao cancelar reserva:", err);
    }
  }

  // Cronômetro regressivo de 10 minutos
  useEffect(() => {
    const tempoFinalSalvo = localStorage.getItem(`tempoFim_${bookingId}`);

    const tempoFim = tempoFinalSalvo
      ? parseInt(tempoFinalSalvo)
      : new Date().getTime() + 10 * 60 * 1000;

    if (!tempoFinalSalvo) {
      localStorage.setItem(`tempoFim_${bookingId}`, tempoFim);
    }

    const intervalo = setInterval(async () => {
      const agora = new Date().getTime();
      const restante = tempoFim - agora;

      if (restante <= 0) {
        clearInterval(intervalo);
        localStorage.removeItem(`tempoFim_${bookingId}`);
        await liberarReserva();
        navigate("/agendar");
      } else {
        const m = String(Math.floor(restante / 1000 / 60)).padStart(2, "0");
        const s = String(Math.floor((restante / 1000) % 60)).padStart(2, "0");
        setTempoRestante(`${m}:${s}`);
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [navigate, bookingId]);

  async function cancelarEVoltar() {
    localStorage.removeItem(`tempoFim_${bookingId}`);
    await liberarReserva();
    navigate("/agendar");
  }

  function irParaMercadoPago() {
    console.log("Conteúdo de initPoint:", initPoint);

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

          <div className="bg-black/40 border border-white/5 rounded-xl py-6 max-w-[240px] mx-auto shadow-inner">
            <span className="text-5xl font-black text-[#00c46a] tracking-wider font-mono">
              {tempoRestante}
            </span>
          </div>

          <button
            onClick={irParaMercadoPago}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all duration-200 text-base shadow-lg shadow-purple-600/10 border border-purple-500/20 active:scale-[0.99]"
          >
            Ir para o Mercado Pago (Pagar R$ {valorTotal})
          </button>

          <button
            onClick={cancelarEVoltar}
            className="text-white/40 hover:text-white/70 text-xs font-semibold tracking-wide block mx-auto transition pt-2"
          >
            ← Cancelar e voltar
          </button>
        </div>
      </main>
    </div>
  );
}