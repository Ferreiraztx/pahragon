import React, { useState, useRef, useEffect } from "react";
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

  const [quadraFiltrada, setQuadraFiltrada] = useState("todas");
  const [qtdRaquetes, setQtdRaquetes] = useState(0);
  const [precoRaquete, setPrecoRaquete] = useState(0); // 💡 Armazena o preço vindo da API

  const [dadosForm, setDadosForm] = useState({
    atleta: "",
    data: "",
    horario: "",
    horarioFim: "",
    quadraId: "",
    statusPagamento: "pago",
  });
  const [visaoAtual, setVisaoAtual] = useState("dayGridMonth");

  // 💡 Busca o preço oficial da raquete do backend para o cálculo interativo
  useEffect(() => {
    api
      .get("/bookings/preco-raquete")
      .then((res) => setPrecoRaquete(Number(res.data.preco)))
      .catch((err) => {
        console.error("Erro ao carregar preço da raquete", err);
        setPrecoRaquete(15.0); // Fallback de segurança
      });
  }, []);

  // 💡 Calcula dinamicamente o valor total em tempo real com base no form
  const calcularTotalManual = () => {
    const quadraSelecionada = quadras.find(
      (q) => String(q.id) === String(dadosForm.quadraId),
    );
    if (!quadraSelecionada || !dadosForm.horario || !dadosForm.horarioFim)
      return 0;

    const [hIni, mIni] = dadosForm.horario.split(":").map(Number);
    const [hFim, mFim] = dadosForm.horarioFim.split(":").map(Number);

    const minutosInicio = hIni * 60 + mIni;
    const minutosFim = hFim * 60 + mFim;
    const diferencaHoras = (minutosFim - minutosInicio) / 60;

    if (diferencaHoras <= 0) return 0;

    const valorQuadra = diferencaHoras * quadraSelecionada.precoPorHora;
    const valorRaquetes = qtdRaquetes * precoRaquete;

    return valorQuadra + valorRaquetes;
  };

  const resourcesCalendar = quadras
    .filter(
      (q) =>
        quadraFiltrada === "todas" || String(q.id) === String(quadraFiltrada),
    )
    .map((q) => ({
      id: q.id,
      title: q.nome,
    }));

  const eventsCalendar = (reservas || [])
    .filter((r) => {
      if (!r) return false;
      const idDaQuadraReserva = r.court?.id || r.courtId;
      const quadraValida =
        quadraFiltrada === "todas" ||
        String(idDaQuadraReserva) === String(quadraFiltrada);

      if (r.tipo === "bloqueio" || r.tipo === "torneio") {
        return quadraValida;
      }

      const statusValido =
        r.status &&
        (r.status.startsWith("confirmado") ||
          r.status.startsWith("pendente") ||
          r.status.startsWith("pago"));
      return statusValido && quadraValida;
    })
    .map((r) => {
      const idDaQuadraReserva = r.court?.id || r.courtId;

      const dataApenas = r.data
        ? r.data.split("T")[0]
        : new Date().toISOString().split("T")[0];

      const hInicio =
        r.horaInicioStr ||
        new Date(r.horaInicio).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      const hFim =
        r.horaFimStr ||
        new Date(r.horaFim).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

      if (r.tipo === "torneio") {
        return {
          id: r.id,
          resourceId: idDaQuadraReserva,
          start: `${dataApenas}T${hInicio}:00`,
          end: `${dataApenas}T${hFim}:00`,
          title: r.nomeAvulso || "🏆 Torneio Ativo",
          backgroundColor: "#065f46",
          textColor: "#ffffff",
          borderColor: "#047857",
          extendedProps: { r, desativarClique: true },
        };
      }

      if (r.tipo === "bloqueio") {
        return {
          id: r.id,
          resourceId: idDaQuadraReserva,
          start: `${dataApenas}T${hInicio}:00`,
          end: `${dataApenas}T${hFim}:00`,
          title: r.nomeAvulso || "🚧 Horário Bloqueado",
          backgroundColor:
            "repeating-linear-gradient(45deg, #ffedd5, #ffedd5 10px, #fff7ed 10px, #fff7ed 20px)",
          textColor: "#9a3412",
          borderColor: "#fdba74",
          extendedProps: { r, desativarClique: true },
        };
      }

      const isPendente = r.status ? r.status.startsWith("pendente") : false;
      const indiceQuadra = quadras.findIndex((q) => q.id === idDaQuadraReserva);
      const estileteCor = CORES_QUADRAS[indiceQuadra % 6] || CORES_QUADRAS[0];

      const backgroundColor = !isPendente
        ? estileteCor.bg
        : `repeating-linear-gradient(45deg, ${estileteCor.bg}, ${estileteCor.bg} 10px, #ffffff 10px, #ffffff 20px)`;

      return {
        id: r.id,
        resourceId: idDaQuadraReserva,
        start: `${dataApenas}T${hInicio}:00`,
        end: `${dataApenas}T${hFim}:00`,
        title: isPendente
          ? `⚠️ [PENDENTE] ${r.nomeAvulso || "Agendamento"}`
          : quadraFiltrada === "todas" && visaoAtual === "dayGridMonth"
            ? `${r.nomeAvulso || "Agendamento"} (${r.court?.nome || "Quadra"})`
            : r.nomeAvulso || "Agendamento",
        backgroundColor: backgroundColor,
        textColor: estileteCor.text,
        borderColor: isPendente ? "#ef4444" : estileteCor.border,
        extendedProps: {
          r,
          isPendente,
          desativarClique: false,
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
      setQtdRaquetes(0);
      setErroMensagem("");
      setConfirmarExclusao(false);
      setDadosForm({
        atleta: "",
        data: dataSelecionada,
        horario: SandyHorarioManual(horarioSelecionado),
        horarioFim: SandyHorarioManual(terminoSugerido),
        quadraId: info.resource.id,
        statusPagamento: "pago",
      });
      setModalAberto(true);
    }
  };

  const SandyHorarioManual = (horarioStr) => {
    if (!horarioStr) return "08:00";
    const [h, m] = horarioStr.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  };

  const handleCliqueNaReservaExistente = (info) => {
    if (info.event.extendedProps.desativarClique) {
      return;
    }

    const r = info.event.extendedProps.r;
    const isPendente = info.event.extendedProps.isPendente;

    const dataFormatada =
      typeof r.data === "string"
        ? r.data.split("T")[0]
        : new Date(r.data).toISOString().split("T")[0];

    const hInicio =
      r.horaInicioStr ||
      new Date(r.horaInicio).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    const hFim =
      r.horaFimStr ||
      new Date(r.horaFim).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

    setModoEdicao(true);
    setReservaIdAtual(r.id);
    setQtdRaquetes(r.qtdRaquetes || 0);
    setErroMensagem("");
    setConfirmarExclusao(false);
    setDadosForm({
      atleta: r.nomeAvulso || r.user?.nome || r.user?.name || "",
      data: dataFormatada,
      horario: SandyHorarioManual(hInicio),
      horarioFim: SandyHorarioManual(hFim),
      quadraId: r.court?.id || r.courtId,
      statusPagamento: isPendente ? "pendente" : "pago",
    });
    setModalAberto(true);
  };

  const handleAbrirReservaManualFixa = () => {
    setModoEdicao(false);
    setQtdRaquetes(0);
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
          qtdRaquetes: Number(qtdRaquetes),
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

                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold text-slate-500 ml-0.5 uppercase tracking-wider block">
                      Aluguel de Raquetes Extras (Balcão)
                    </label>
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <span className="text-xs font-semibold text-slate-600">
                        Quantidade incluída:
                      </span>

                      <div className="flex items-center gap-3 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
                        <button
                          type="button"
                          onClick={() =>
                            setQtdRaquetes((prev) => Math.max(0, prev - 1))
                          }
                          className="w-7 h-7 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition cursor-pointer select-none"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-slate-800 w-5 text-center">
                          {qtdRaquetes}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQtdRaquetes((prev) => Math.min(4, prev + 1))
                          }
                          className="w-7 h-7 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center transition cursor-pointer select-none"
                        >
                          +
                        </button>
                      </div>
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

                  {/* 💡 ADICIONADO: Caixa de resumo financeiro interativa em tempo real para o balcão admin */}
                  {calcularTotalManual() > 0 && (
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex justify-between items-center animate-in fade-in duration-200">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Valor total no balcão:
                      </span>
                      <span className="text-base font-black text-slate-800 font-mono">
                        R$ {calcularTotalManual().toFixed(2)}
                      </span>
                    </div>
                  )}

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
