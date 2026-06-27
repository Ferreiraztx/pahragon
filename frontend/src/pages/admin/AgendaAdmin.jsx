import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import api from "../../services/api";

// 💡 Definição de cores fixas para até 6 quadras diferentes (Fundo, Texto, Borda)
const CORES_QUADRAS = {
  0: { bg: "#ccfbf1", text: "#115e59", border: "#99f6e4" }, // Teal (Quadra 1)
  1: { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" }, // Azul (Quadra 2)
  2: { bg: "#f3e8ff", text: "#6b21a8", border: "#e9d5ff" }, // Roxo (Quadra 3)
  3: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" }, // Âmbar (Quadra 4)
  4: { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" }, // Verde (Quadra 5)
  5: { bg: "#ffe4e6", text: "#9f1239", border: "#fecdd3" }, // Rosa (Quadra 6)
};

export default function AgendaAdmin({
  reservas,
  quadras,
  token,
  aoAtualizarDados,
}) {
  const calendarRef = useRef(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [reservaIdAtual, setReservaIdAtual] = useState(null);
  const [erroMensagem, setErroMensagem] = useState("");

  // 💡 NOVO ESTADO: Controla qual quadra exibir ("todas" ou o ID da quadra)
  const [quadraFiltrada, setQuadraFiltrada] = useState("todas");

  const [dadosForm, setDadosForm] = useState({
    atleta: "",
    data: "",
    horario: "",
    horarioFim: "",
    quadraId: "",
    statusPagamento: "pago",
  });
  const [visaoAtual, setVisaoAtual] = useState("dayGridMonth");

  // 💡 Recursos dinâmicos: Se filtrar uma quadra, a visão diária mostra só a coluna dela
  const resourcesCalendar = quadras
    .filter(
      (q) =>
        quadraFiltrada === "todas" || String(q.id) === String(quadraFiltrada),
    )
    .map((q) => ({
      id: q.id,
      title: q.nome,
    }));

  // Mapeia os eventos aplicando os filtros e as cores por quadra
  const eventsCalendar = reservas
    .filter((r) => {
      // 1. Mantém apenas confirmados e pendentes
      const statusValido =
        r.status.startsWith("confirmado") || r.status.startsWith("pendente");
      // 2. Aplica o filtro da quadra selecionada no topo
      const idDaQuadraReserva = r.court?.id || r.courtId;
      const quadraValida =
        quadraFiltrada === "todas" ||
        String(idDaQuadraReserva) === String(quadraFiltrada);

      return statusValido && quadraValida;
    })
    .map((r) => {
      const [statusReal, nomeAvulso] = r.status.split("|");
      const mapearStatusFinanceiro =
        statusReal === "confirmado" ? "pago" : "pendente";
      const idDaQuadraReserva = r.court?.id || r.courtId;

      // 💡 Encontra o índice da quadra para associar a cor correspondente
      const indiceQuadra = quadras.findIndex((q) => q.id === idDaQuadraReserva);
      const estileteCor = CORES_QUADRAS[indiceQuadra % 6];

      // Se a reserva estiver pendente, damos um tom levemente mais opaco ou mantemos o padrão da quadra
      // Para manter a identidade da quadra, usaremos a cor dela, mas se preferir destacar o pendente, pode customizar.
      return {
        id: r.id,
        resourceId: idDaQuadraReserva,
        start: `${r.data.split("T")[0]}T${new Date(r.horaInicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}:00`,
        end: `${r.data.split("T")[0]}T${new Date(r.horaFim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}:00`,

        // Exibe o nome do atleta + nome da quadra (se estiver vendo todas no mês)
        title:
          quadraFiltrada === "todas" && visaoAtual === "dayGridMonth"
            ? `${nomeAvulso || r.user?.nome || "Agendamento"} (${r.court?.nome || "Quadra"})`
            : nomeAvulso || r.user?.nome || "Agendamento",

        backgroundColor: estileteCor.bg,
        textColor: estileteCor.text,
        borderColor: estileteCor.border,
        extendedProps: {
          r,
          statusReal,
          nomeAvulso,
          statusFinanceiro: mapearStatusFinanceiro,
        },
      };
    });

  const handleCliqueNoDiaDoMes = (info) => {
    const calendarApi = calendarRef.current.getApi();
    if (calendarApi.view.type === "dayGridMonth") {
      calendarApi.gotoDate(info.dateStr);
      calendarApi.changeView("resourceTimeGridDay");
      setVisaoAtual("resourceTimeGridDay");
    }
  };

  const handleSelecaoHorarioVazio = (info) => {
    const calendarApi = calendarRef.current.getApi();
    if (calendarApi.view.type === "resourceTimeGridDay") {
      if (info.start < new Date()) {
        setErroMensagem(
          "Não é possível realizar agendamentos em horários passados.",
        );
        setTimeout(() => setErroMensagem(""), 4000);
        return;
      }

      const dataSelecionada = info.startStr.split("T")[0];
      const horarioSelecionado = info.startStr.split("T")[1].substring(0, 5);

      const [horas, minutos] = horarioSelecionado.split(":").map(Number);
      const terminoSugerido = `${String(horas + 1).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;

      setModoEdicao(false);
      setErroMensagem("");
      setConfirmarExclusao(false);
      setDadosForm({
        atleta: "",
        data: dataSelecionada,
        horario: horarioSelecionado,
        horarioFim: terminoSugerido,
        quadraId: info.resource.id,
        statusPagamento: "pago",
      });
      setModalAberto(true);
    }
  };

  const handleCliqueNaReservaExistente = (info) => {
    const r = info.event.extendedProps.r;
    const { statusReal, nomeAvulso } = info.event.extendedProps;

    const dataFormatada = r.data.split("T")[0];
    const hInicio = new Date(r.horaInicio).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const hFim = new Date(r.horaFim).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setModoEdicao(true);
    setReservaIdAtual(r.id);
    setErroMensagem("");
    setConfirmarExclusao(false);
    setDadosForm({
      atleta: nomeAvulso || r.user?.nome || "",
      data: dataFormatada,
      horario: hInicio,
      horarioFim: hFim,
      quadraId: r.court?.id || r.courtId,
      statusPagamento: statusReal === "confirmado" ? "pago" : "pendente",
    });
    setModalAberto(true);
  };

  const handleAbrirReservaManualFixa = () => {
    setModoEdicao(false);
    setErroMensagem("");
    setConfirmarExclusao(false);
    setDadosForm({
      atleta: "",
      data: new Date().toISOString().split("T")[0],
      horario: "08:00",
      horarioFim: "09:00",
      quadraId:
        quadraFiltrada === "todas" ? quadras[0]?.id || "" : quadraFiltrada,
      statusPagamento: "pago",
    });
    setModalAberto(true);
  };

  const volverParaMes = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.changeView("dayGridMonth");
    setVisaoAtual("dayGridMonth");
  };

  const handleSalvarReserva = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErroMensagem("");

    if (dadosForm.horarioFim <= dadosForm.horario) {
      setErroMensagem(
        "O horário de término precisa ser maior que o horário de início.",
      );
      setLoading(false);
      return;
    }

    try {
      const url = modoEdicao
        ? `/bookings/manual/${reservaIdAtual}`
        : "/bookings/manual";
      const method = modoEdicao ? "PUT" : "POST";

      const response = await api({
        method,
        url,
        data: {
          nomeAtleta: dadosForm.atleta,
          data: dadosForm.data,
          horarioInicio: dadosForm.horario,
          horarioFim: dadosForm.horarioFim,
          courtId: dadosForm.quadraId,
          statusPagamento: dadosForm.statusPagamento,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200 || response.status === 201) {
        setModalAberto(false);
        aoAtualizarDados();
      }
    } catch (error) {
      setErroMensagem(
        error.response?.data?.error || "Erro ao processar agendamento.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirReserva = async () => {
    setLoading(true);
    setErroMensagem("");

    try {
      const response = await api.delete(`/bookings/manual/${reservaIdAtual}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        setModalAberto(false);
        setConfirmarExclusao(false);
        aoAtualizarDados();
      }
    } catch (error) {
      setErroMensagem(
        error.response?.data?.error || "Erro ao remover reserva.",
      );
    } finally {
      setLoading(false);
    }
  };

  const hojeStringParaInput = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm calendar-container space-y-4">
      {erroMensagem && !modalAberto && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-bold animate-in fade-in duration-300">
          ⚠️ {erroMensagem}
        </div>
      )}

      {/* BARRA DE AÇÕES SUPERIOR MODIFICADA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          {visaoAtual === "resourceTimeGridDay" && (
            <button
              onClick={volverParaMes}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition shrink-0"
            >
              ← Voltar
            </button>
          )}

          {/* 💡 SELETOR FILTRO DE QUADRAS */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Filtrar:
            </label>
            <select
              value={quadraFiltrada}
              onChange={(e) => setQuadraFiltrada(e.target.value)}
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm text-slate-700 font-bold focus:ring-2 focus:ring-teal-500"
            >
              <option value="todas">🏟️ Mostrar Todas as Quadras</option>
              {quadras.map((q) => (
                <option key={q.id} value={q.id}>
                  📍 {q.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleAbrirReservaManualFixa}
          className="px-5 py-2.5 bg-[#1e2221] hover:bg-black text-white text-sm font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Nova Reserva Manual
        </button>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, resourceTimeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        allDaySlot={false}
        slotMinTime="07:00:00"
        slotMaxTime="23:00:00"
        locale={ptBrLocale}
        resources={resourcesCalendar}
        events={eventsCalendar}
        schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
        selectable={true}
        dateClick={handleCliqueNoDiaDoMes}
        select={handleSelecaoHorarioVazio}
        eventClick={handleCliqueNaReservaExistente}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
      />

      {/* MODAL MISTO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-200">
            {confirmarExclusao ? (
              <div className="space-y-6 text-center py-4 animate-in fade-in duration-200">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
                  !
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Remover Reserva
                  </h3>
                  <p className="text-xs text-slate-400 px-4">
                    Tem certeza que deseja cancelar e apagar definitivamente
                    esse agendamento do mapa da arena?
                  </p>
                </div>
                {erroMensagem && (
                  <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg mx-4">
                    {erroMensagem}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmarExclusao(false);
                      setErroMensagem("");
                    }}
                    className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-extrabold hover:bg-slate-100 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleExcluirReserva}
                    disabled={loading}
                    className="w-full py-3 bg-rose-600 text-white rounded-xl text-sm font-extrabold hover:bg-rose-700 transition-colors shadow-md disabled:bg-slate-400"
                  >
                    {loading ? "Removendo..." : "Sim, Remover"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {modoEdicao ? "Editar Agendamento" : "Nova Reserva Manual"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gerenciamento direto pelo balcão da arena
                  </p>
                </div>

                {erroMensagem && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 p-2.5 rounded-xl text-xs font-bold">
                    ⚠️ {erroMensagem}
                  </div>
                )}

                <form onSubmit={handleSalvarReserva} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-0.5">
                      Nome do Atleta
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Digite o nome completo"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                      value={dadosForm.atleta}
                      onChange={(e) =>
                        setDadosForm({ ...dadosForm, atleta: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-0.5">
                      Quadra
                    </label>
                    <select
                      required
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                      value={dadosForm.quadraId}
                      onChange={(e) =>
                        setDadosForm({ ...dadosForm, quadraId: e.target.value })
                      }
                    >
                      <option value="" disabled>
                        Selecione a quadra
                      </option>
                      {quadras.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-0.5">
                        Data
                      </label>
                      <input
                        type="date"
                        required
                        min={modoEdicao ? "" : hojeStringParaInput}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                        value={dadosForm.data}
                        onChange={(e) =>
                          setDadosForm({ ...dadosForm, data: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-0.5">
                        Início
                      </label>
                      <input
                        type="time"
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                        value={dadosForm.horario}
                        onChange={(e) =>
                          setDadosForm({
                            ...dadosForm,
                            horario: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-0.5">
                        Término
                      </label>
                      <input
                        type="time"
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                        value={dadosForm.horarioFim}
                        onChange={(e) =>
                          setDadosForm({
                            ...dadosForm,
                            horarioFim: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-0.5">
                      Financeiro
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() =>
                          setDadosForm({
                            ...dadosForm,
                            statusPagamento: "pago",
                          })
                        }
                        className={`py-2 rounded-lg text-xs font-extrabold transition-all ${dadosForm.statusPagamento === "pago" ? "bg-emerald-600 text-white shadow" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        ✓ JÁ FOI PAGO
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDadosForm({
                            ...dadosForm,
                            statusPagamento: "pendente",
                          })
                        }
                        className={`py-2 rounded-lg text-xs font-extrabold transition-all ${dadosForm.statusPagamento === "pendente" ? "bg-amber-500 text-white shadow" : "text-slate-500 hover:text-slate-800"}`}
                      >
                        ⚠ PENDENTE
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setModalAberto(false)}
                        className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-extrabold hover:bg-slate-100 transition-colors shadow-sm"
                      >
                        Voltar
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#1e2221] hover:bg-black text-white rounded-xl text-sm font-extrabold transition-colors shadow-md disabled:bg-slate-400"
                      >
                        {loading ? "Processando..." : "Confirmar"}
                      </button>
                    </div>

                    {modoEdicao && (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmarExclusao(true);
                          setErroMensagem("");
                        }}
                        className="w-full py-2.5 mt-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold border border-rose-100 transition"
                      >
                        Remover Agendamento da Arena
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
