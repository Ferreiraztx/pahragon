import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function MinhasReservas() {
  const [reservas, setReservas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [reservaParaCancelar, setReservaParaCancelar] = useState(null);
  const navigate = useNavigate();

  // Função isolada para buscar as reservas atualizadas do banco e ordenar
  function carregarReservas() {
    api
      .get("/bookings/minhas")
      .then((res) => {
        // Mapeamento de prioridade dos status para desempate cronológico
        const prioridadeStatus = {
          confirmado: 1,
          pendente: 2,
          cancelado: 3,
        };

        // Ordenação robusta combinando Data + Horário com desempate por Status
        const dadosOrdenados = res.data.sort((a, b) => {
          // Extrai o horário de início (trata ISO completo ou strings simples)
          const obterHora = (dataStr, horaStr) => {
            const ISORegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
            if (ISORegex.test(horaStr)) return new Date(horaStr);
            return new Date(
              `${dataStr.split("T")[0]}T${horaStr.slice(0, 5)}:00`,
            );
          };

          const dataHoraA = obterHora(a.data, a.horaInicio);
          const dataHoraB = obterHora(b.data, b.horaInicio);

          // 1. REGRA PRINCIPAL: Ordena por proximidade de data e hora (Mais próximas primeiro)
          if (dataHoraA.getTime() !== dataHoraB.getTime()) {
            return dataHoraA.getTime() - dataHoraB.getTime();
          }

          // 2. CRITÉRIO DE DESEMPATE: Se no mesmo dia e mesma hora, ordena pelo peso do status
          const statusA = String(a.status).toLowerCase();
          const statusB = String(b.status).toLowerCase();

          const pesoA = prioridadeStatus[statusA] || 99;
          const pesoB = prioridadeStatus[statusB] || 99;

          return pesoA - pesoB;
        });

        setReservas(dadosOrdenados);
      })
      .catch((err) => console.error("Erro ao carregar reservas:", err));
  }

  useEffect(() => {
    // 1. Carrega logo quando o componente monta na tela
    carregarReservas();

    // 2. Evento de segurança: Sempre que o usuário voltar para essa aba/tela, recarrega os dados
    const dispararNoFoco = () => {
      carregarReservas();
    };

    window.addEventListener("focus", dispararNoFoco);
    return () => window.removeEventListener("focus", dispararNoFoco);
  }, []);

  // Apenas abre o modal e guarda o ID da reserva alvo
  function abrirModalCancelamento(id) {
    setReservaParaCancelar(id);
    setModalAberto(true);
  }

  // Executa o cancelamento real após a confirmação no modal customizado
  async function executarCancelamento() {
    if (!reservaParaCancelar) return;

    try {
      await api.patch(`/bookings/${reservaParaCancelar}/cancelar`);
      // Após o patch, recarrega as reservas do banco para aplicar a ordenação correta com o novo status
      carregarReservas();
    } catch (err) {
      console.error("Erro ao cancelar reserva:", err);
    } finally {
      setModalAberto(false);
      setReservaParaCancelar(null);
    }
  }

  // Mapeamento de estilos usando tons pastéis elegantes e bordas finas idênticas ao Admin
  const statusStyle = {
    pendente: "bg-amber-50 text-amber-800 border-amber-200/60",
    confirmado: "bg-teal-50 text-teal-900 border-teal-200/60",
    cancelado: "bg-slate-50 text-slate-400 border-slate-200",
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d3130] antialiased tracking-tight font-sans text-base relative">
      {/* Cabeçalho Minimalista Integrado */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900 transition flex items-center gap-1"
          >
            ← Voltar
          </button>

          <div className="text-right">
            <h1 className="text-[#1e2221] font-black text-xl tracking-tighter leading-none">
              Minhas Reservas
            </h1>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-teal-600 block mt-1">
              Pahragon Beach Tennis
            </span>
          </div>
        </div>
      </header>

      {/* Área de Conteúdo Centralizada */}
      <main className="max-w-xl mx-auto px-6 py-10 space-y-4">
        {/* Estado Vazio Traduzido para o Design Limpo */}
        {reservas.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl">
              🎾
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">
              Nenhuma reserva encontrada
            </h3>
            <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
              Você ainda não agendou nenhum horário na areia para as próximas
              semanas.
            </p>
            <button
              onClick={() => navigate("/agendar")}
              className="mt-5 inline-block bg-[#1e2221] hover:bg-black text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm"
            >
              Agendar agora
            </button>
          </div>
        ) : (
          /* Lista de Reservas Individuais */
          reservas.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Linha de Cima: Título e Badge de Status */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Espaço
                    </span>
                    <h3 className="text-[#1e2221] font-black text-lg tracking-tight leading-tight">
                      {r.court?.nome || "Quadra de Beach Tennis"}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusStyle[r.status] || statusStyle.pendente}`}
                  >
                    {r.status}
                  </span>
                </div>

                {/* Grid de Metadados Cronológicos */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Agendado para
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {new Date(r.data).toLocaleDateString("pt-BR", {
                        timeZone: "UTC",
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Intervalo de Horário
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {new Date(r.horaInicio).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      —{" "}
                      {new Date(r.horaFim).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rodapé de Ações do Card */}
              {r.status !== "cancelado" && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
                  {/* Botão de Pagar - Visível apenas para pendentes */}
                  {r.status === "pendente" && (
                    <button
                      onClick={() =>
                        navigate(`/pagamento/aguardando?bookingId=${r.id}`)
                      }
                      className="text-xs font-bold uppercase tracking-wider text-white bg-[#1e2221] hover:bg-black px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                        />
                      </svg>
                      Pagar Horário
                    </button>
                  )}

                  {/* Botão de Cancelamento Discreto */}
                  <button
                    onClick={() => abrirModalCancelamento(r.id)}
                    className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50/50 px-4 py-2.5 rounded-xl transition"
                  >
                    Cancelar reserva
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </main>

      {/* Modal de Confirmação de Cancelamento Customizado */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-6 text-center space-y-6 shadow-xl transform scale-100 transition-all duration-200">
            {/* Ícone de Alerta Minimalista */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
              <svg
                className="h-5 w-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-[#1e2221] font-black text-xl tracking-tighter">
                Cancelar Reserva?
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto font-medium">
                Tem certeza de que deseja cancelar este agendamento? O horário
                ficará disponível para outros jogadores.
              </p>
            </div>

            {/* Ações Alinhadas ao Design do Sistema */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={executarCancelamento}
                className="w-full bg-[#1e2221] hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl transition text-xs uppercase tracking-wider active:scale-[0.99]"
              >
                Sim, Cancelar Horário
              </button>
              <button
                onClick={() => {
                  setModalAberto(false);
                  setReservaParaCancelar(null);
                }}
                className="w-full text-slate-400 hover:text-slate-600 font-bold py-2.5 transition text-xs uppercase tracking-wider"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
