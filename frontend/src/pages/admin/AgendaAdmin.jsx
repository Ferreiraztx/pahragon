import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import api from "../../services/api";

export default function AgendaAdmin({ reservas, quadras, token, aoAtualizarDados }) {
  const calendarRef = useRef(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [reservaIdAtual, setReservaIdAtual] = useState(null);
  
  const [dadosForm, setDadosForm] = useState({ 
    atleta: "", 
    data: "", 
    horario: "", 
    horarioFim: "", 
    quadraId: "", 
    statusPagamento: "pago" 
  });
  const [visaoAtual, setVisaoAtual] = useState("dayGridMonth");

  const resourcesCalendar = quadras.map((q) => ({
    id: q.id,
    title: q.nome,
  }));

  // Mapeia todas as reservas confirmadas
  const eventsCalendar = reservas
    .filter((r) => r.status === "confirmado")
    .map((r) => ({
      id: r.id,
      resourceId: r.court?.id || r.courtId,
      start: `${r.data.split("T")[0]}T${new Date(r.horaInicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}:00`,
      end: `${r.data.split("T")[0]}T${new Date(r.horaFim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}:00`,
      title: r.nomeAvulso || r.user?.nome || "Confirmado",
      backgroundColor: "#ccfbf1",
      textColor: "#115e59",
      borderColor: "#99f6e4",
      // Passamos a reserva bruta em anexo para facilitar a edição posterior
      extendedProps: { r }
    }));

  const handleCliqueNoDiaDoMes = (info) => {
    const calendarApi = calendarRef.current.getApi();
    if (calendarApi.view.type === "dayGridMonth") {
      calendarApi.gotoDate(info.dateStr); 
      calendarApi.changeView("resourceTimeGridDay"); 
      setVisaoAtual("resourceTimeGridDay");
    }
  };

  // Clique em um espaço vazio na grade (CRIAR)
  const handleSelecaoHorarioVazio = (info) => {
    const calendarApi = calendarRef.current.getApi();
    if (calendarApi.view.type === "resourceTimeGridDay") {
      if (info.start < new Date()) {
        alert("Não é possível realizar agendamentos em horários passados.");
        return;
      }

      const dataSelecionada = info.startStr.split("T")[0];
      const horarioSelecionado = info.startStr.split("T")[1].substring(0, 5);
      
      // Sugere o término automático adicionando 1 hora
      const [horas, minutos] = horarioSelecionado.split(":").map(Number);
      const terminoSugerido = `${String(horas + 1).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;

      setModoEdicao(false);
      setDadosForm({
        atleta: "",
        data: dataSelecionada,
        horario: horarioSelecionado,
        horarioFim: terminoSugerido,
        quadraId: info.resource.id,
        statusPagamento: "pago"
      });
      setModalAberto(true);
    }
  };

  // Clique em uma reserva existente (EDITAR)
  const handleCliqueNaReservaExistente = (info) => {
    const r = info.event.extendedProps.r;
    
    const dataFormatada = r.data.split("T")[0];
    const hInicio = new Date(r.horaInicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const hFim = new Date(r.horaFim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    setModoEdicao(true);
    setReservaIdAtual(r.id);
    setDadosForm({
      atleta: r.nomeAvulso || r.user?.nome || "",
      data: dataFormatada,
      horario: hInicio,
      horarioFim: hFim,
      quadraId: r.court?.id || r.courtId,
      statusPagamento: r.statusPagamento || "pago" // Altere conforme o enum do seu banco
    });
    setModalAberto(true);
  };

  const handleAbrirReservaManualFixa = () => {
    setModoEdicao(false);
    setDadosForm({
      atleta: "",
      data: new Date().toISOString().split("T")[0], 
      horario: "08:00", 
      horarioFim: "09:00",
      quadraId: quadras[0]?.id || "", 
      statusPagamento: "pago"
    });
    setModalAberto(true);
  };

  const volverParaMes = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.changeView("dayGridMonth");
    setVisaoAtual("dayGridMonth");
  };

  // Salvar Criação ou Alteração
  const handleSalvarReserva = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (dadosForm.horarioFim <= dadosForm.horario) {
      alert("O horário de término precisa ser maior que o horário de início.");
      setLoading(false);
      return;
    }

    try {
      const url = modoEdicao ? `/bookings/manual/${reservaIdAtual}` : "/bookings/manual";
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
          statusPagamento: dadosForm.statusPagamento
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200 || response.status === 201) {
        setModalAberto(false);
        aoAtualizarDados();
      }
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao processar agendamento.");
    } finally {
      setLoading(false);
    }
  };

  // Ação de Deletar/Cancelar a reserva na tela de Edição
  const handleExcluirReserva = async () => {
    if (!window.confirm("Deseja realmente remover/cancelar este agendamento definitivamente?")) return;
    setLoading(true);

    try {
      const response = await api.delete(`/bookings/manual/${reservaIdAtual}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 200) {
        setModalAberto(false);
        aoAtualizarDados();
      }
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao remover reserva.");
    } finally {
      setLoading(false);
    }
  };

  const hojeStringParaInput = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm calendar-container space-y-4">
      
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          {visaoAtual === "resourceTimeGridDay" ? (
            <button
              onClick={volverParaMes}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition"
            >
              ← Voltar para Visão Mensal
            </button>
          ) : (
            <span className="text-sm text-slate-400 font-medium">Visão Geral da Arena</span>
          )}
        </div>

        <button
          onClick={handleAbrirReservaManualFixa}
          className="px-5 py-2.5 bg-[#1e2221] hover:bg-black text-white text-sm font-bold rounded-xl transition shadow-md flex items-center gap-2"
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
        eventClick={handleCliqueNaReservaExistente} // 💡 NOVA INTERCEPTAÇÃO DE CLIQUE EM RESERVA
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
      />

      {/* MODAL MISTO (CADASTRO / EDIÇÃO) */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">
                {modoEdicao ? "Editar Agendamento" : "Nova Reserva Manual"}
              </h3>
              <p className="text-xs text-slate-400">Gerenciamento direto pelo balcão da arena</p>
            </div>

            <form onSubmit={handleSalvarReserva} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-0.5">Nome do Atleta</label>
                <input
                  type="text"
                  required
                  placeholder="Digite o nome completo"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                  value={dadosForm.atleta}
                  onChange={(e) => setDadosForm({ ...dadosForm, atleta: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-0.5">Quadra</label>
                <select
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                  value={dadosForm.quadraId}
                  onChange={(e) => setDadosForm({ ...dadosForm, quadraId: e.target.value })}
                >
                  <option value="" disabled>Selecione a quadra</option>
                  {quadras.map((q) => (
                    <option key={q.id} value={q.id}>{q.nome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-0.5">Data</label>
                  <input
                    type="date"
                    required
                    min={modoEdicao ? "" : hojeStringParaInput}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                    value={dadosForm.data}
                    onChange={(e) => setDadosForm({ ...dadosForm, data: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-0.5">Início</label>
                  <input
                    type="time"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                    value={dadosForm.horario}
                    onChange={(e) => setDadosForm({ ...dadosForm, horario: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-0.5">Término</label>
                  <input
                    type="time"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                    value={dadosForm.horarioFim}
                    onChange={(e) => setDadosForm({ ...dadosForm, horarioFim: e.target.value })}
                  />
                </div>
              </div>

              {/* 💡 BOTÕES DE SELEÇÃO DE STATUS DO PAGAMENTO */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 ml-0.5">Financeiro</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDadosForm({ ...dadosForm, statusPagamento: "pago" })}
                    className={`py-2 rounded-lg text-xs font-extrabold transition-all ${dadosForm.statusPagamento === "pago" ? "bg-emerald-600 text-white shadow" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    ✓ JÁ FOI PAGO
                  </button>
                  <button
                    type="button"
                    onClick={() => setDadosForm({ ...dadosForm, statusPagamento: "pendente" })}
                    className={`py-2 rounded-lg text-xs font-extrabold transition-all ${dadosForm.statusPagamento === "pendente" ? "bg-amber-500 text-white shadow" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    ⚠ PENDENTE
                  </button>
                </div>
              </div>

              {/* BARRA DE BOTÕES INFERIOR DINÂMICA */}
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
                    className="w-full py-3 bg-[#1e2221] hover:bg-black text-white rounded-xl text-sm font-extrabold transition-colors shadow-md"
                  >
                    {loading ? "Processando..." : "Confirmar"}
                  </button>
                </div>

                {modoEdicao && (
                  <button
                    type="button"
                    onClick={handleExcluirReserva}
                    className="w-full py-2.5 mt-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold border border-rose-100 transition"
                  >
                    Remover Agendamento da Arena
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}