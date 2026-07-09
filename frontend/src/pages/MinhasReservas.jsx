import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function MinhasReservas() {
  const [reservas, setReservas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [reservaParaCancelar, setReservaParaCancelar] = useState(null);
  const navigate = useNavigate();

  // ADICIONADO: Estados para o controle dos novos filtros de período
  const [periodo, setPeriodo] = useState("todos"); // todos, 7dias, 30dias, personalizado
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Função isolada para buscar as reservas atualizadas do banco e ordenar
  function carregarReservas() {
    api
      .get("/bookings/minhas")
      .then((res) => {
        const prioridadeStatus = {
          confirmado: 1,
          pendente: 2,
          cancelado: 3,
        };

        const dadosOrdenados = res.data.sort((a, b) => {
          const obterHora = (dataStr, horaStr) => {
            const ISORegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
            if (ISORegex.test(horaStr)) return new Date(horaStr);
            return new Date(
              `${dataStr.split("T")[0]}T${horaStr.slice(0, 5)}:00`,
            );
          };

          const dataHoraA = obterHora(a.data, a.horaInicio);
          const dataHoraB = obterHora(b.data, b.horaInicio);

          if (dataHoraA.getTime() !== dataHoraB.getTime()) {
            return dataHoraB.getTime() - dataHoraA.getTime();
          }

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
    carregarReservas();

    const dispararNoFoco = () => {
      carregarReservas();
    };

    window.addEventListener("focus", dispararNoFoco);
    return () => window.removeEventListener("focus", dispararNoFoco);
  }, []);

  function abrirModalCancelamento(id) {
    setReservaParaCancelar(id);
    setModalAberto(true);
  }

  async function executarCancelamento() {
    if (!reservaParaCancelar) return;

    try {
      await api.patch(`/bookings/${reservaParaCancelar}/cancelar`);
      carregarReservas();
    } catch (err) {
      console.error("Erro ao cancelar reserva:", err);
    } finally {
      setModalAberto(false);
      setReservaParaCancelar(null);
    }
  }

  const statusStyle = {
    pendente: "bg-amber-50 text-amber-800 border-amber-200/60",
    confirmado: "bg-teal-50 text-teal-900 border-teal-200/60",
    cancelado: "bg-slate-50 text-slate-400 border-slate-200",
  };

  // ADICIONADO: Lógica robusta de filtragem por períodos matemáticos
  const reservasFiltradas = reservas.filter((r) => {
    if (periodo === "todos") return true;

    // Converte a data da reserva para um objeto Date puro da meia-noite (ignora timezone)
    const dataReserva = new Date(r.data.split("T")[0] + "T00:00:00");
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (periodo === "7dias") {
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(hoje.getDate() - 7);
      return dataReserva >= seteDiasAtras && dataReserva <= hoje;
    }

    if (periodo === "30dias") {
      const trintaDiasAtras = new Date(hoje);
      trintaDiasAtras.setDate(hoje.getDate() - 30);
      return dataReserva >= trintaDiasAtras && dataReserva <= hoje;
    }

    if (periodo === "personalizado") {
      // Se escolheu personalizado mas não preencheu as datas ainda, não esconde tudo
      if (!dataInicio && !dataFim) return true;

      if (dataInicio) {
        const dInicio = new Date(dataInicio + "T00:00:00");
        if (dataReserva < dInicio) return false;
      }
      if (dataFim) {
        const dFim = new Date(dataFim + "T00:00:00");
        if (dataReserva > dFim) return false;
      }
      return true;
    }

    return true;
  });

  // Limpa os filtros voltando ao estado inicial
  function limparFiltros() {
    setPeriodo("todos");
    setDataInicio("");
    setDataFim("");
  }

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
        {/* Seletor de Períodos Dinâmico */}
        {reservas.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1 w-full sm:w-64">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Filtrar por Período
                </label>
                <select
                  value={periodo}
                  onChange={(e) => {
                    setPeriodo(e.target.value);
                    if (e.target.value !== "personalizado") {
                      setDataInicio("");
                      setDataFim("");
                    }
                  }}
                  className="px-3 py-2 bg-[#faf9f6] border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all cursor-pointer"
                >
                  <option value="todos">Todas as reservas</option>
                  <option value="7dias">Últimos 7 dias</option>
                  <option value="30dias">Últimos 30 dias</option>
                  <option value="personalizado">
                    Período Personalizado...
                  </option>
                </select>
              </div>

              {periodo !== "todos" && (
                <button
                  onClick={limparFiltros}
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-4 py-2.5 rounded-xl transition self-end sm:self-center"
                >
                  Limpar Filtro
                </button>
              )}
            </div>

            {/* Campos adicionais que "abrem" se o usuário escolher Personalizado */}
            {periodo === "personalizado" && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 animate-fadeIn">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="px-3 py-1.5 bg-[#faf9f6] border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 shadow-inner focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="px-3 py-1.5 bg-[#faf9f6] border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 shadow-inner focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado Vazio Absoluto */}
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
        ) : /* Estado Vazio do Filtro por Período */
        reservasFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-lg">
              📅
            </div>
            <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
              Nenhum agendamento neste período
            </h3>
            <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto px-4">
              Você não possui reservas correspondentes ao filtro selecionado.
            </p>
            <button
              onClick={limparFiltros}
              className="mt-4 inline-block bg-slate-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-sm"
            >
              Remover Filtros
            </button>
          </div>
        ) : (
          /* Lista de Reservas Filtradas e Ordenadas */
          reservasFiltradas.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div>
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

                {/* 💡 MODIFICADO: Grid alterado de grid-cols-2 para grid-cols-3 para incluir raquetes extras */}
                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-sm">
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
                    <span className="font-mono font-bold text-slate-800 block whitespace-nowrap">
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
                  {/* 💡 ADICIONADO: Nova coluna exibindo o equipamento extra em tempo real de forma elegante */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Equipamento Extra
                    </span>
                    <span className="font-bold text-slate-800 block text-xs mt-0.5">
                      {r.qtdRaquetes && Number(r.qtdRaquetes) > 0
                        ? `🏓 ${r.qtdRaquetes} ${Number(r.qtdRaquetes) === 1 ? "raquete" : "raquetes"}`
                        : "Nenhuma"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rodapé de Ações do Card */}
              {r.status !== "cancelado" &&
                (() => {
                  const obterDataHoraFim = (dataStr, horaFimStr) => {
                    const ISORegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
                    if (ISORegex.test(horaFimStr)) return new Date(horaFimStr);
                    return new Date(
                      `${dataStr.split("T")[0]}T${horaFimStr.slice(0, 5)}:00`,
                    );
                  };

                  const dataHoraFim = obterDataHoraFim(r.data, r.horaFim);
                  const agora = new Date();
                  const jaPassou = dataHoraFim.getTime() < agora.getTime();

                  if (jaPassou) return null;

                  return (
                    <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
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

                      <button
                        onClick={() => abrirModalCancelamento(r.id)}
                        className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50/50 px-4 py-2.5 rounded-xl transition"
                      >
                        Cancelar reserva
                      </button>
                    </div>
                  );
                })()}
            </div>
          ))
        )}
      </main>

      {/* Modal de Confirmação de Cancelamento */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl p-6 text-center space-y-6 shadow-xl transform scale-100 transition-all duration-200">
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
