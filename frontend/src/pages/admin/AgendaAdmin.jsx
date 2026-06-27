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
  const [dadosForm, setDadosForm] = useState({ atleta: "", data: "", horario: "", quadraId: "" });
  const [visaoAtual, setVisaoAtual] = useState("dayGridMonth");

  // Mapeia as quadras do banco para as colunas do calendário diário
  const resourcesCalendar = quadras.map((q) => ({
    id: q.id,
    title: q.nome,
  }));

  // Filtra e mapeia apenas reservas com status "confirmado" para a grade visual
  const eventsCalendar = reservas
    .filter((r) => r.status === "confirmado")
    .map((r) => ({
      id: r.id,
      resourceId: r.court?.id || r.courtId,
      start: `${r.data.split("T")[0]}T${new Date(r.horaInicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}:00`,
      end: `${r.data.split("T")[0]}T${new Date(r.horaFim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}:00`,
      title: r.user?.nome || "Confirmado",
      backgroundColor: "#ccfbf1",
      textColor: "#115e59",
      borderColor: "#99f6e4",
    }));

  // Ação ao clicar no quadradinho de um dia (Na visão de MÊS)
  const handleCliqueNoDiaDoMes = (info) => {
    const calendarApi = calendarRef.current.getApi();
    if (calendarApi.view.type === "dayGridMonth") {
      calendarApi.gotoDate(info.dateStr); 
      calendarApi.changeView("resourceTimeGridDay"); 
      setVisaoAtual("resourceTimeGridDay");
    }
  };

  // Ação ao clicar em um horário vago na grade (Na visão DIÁRIA por quadras)
  const handleSelecaoHorarioVazio = (info) => {
    const calendarApi = calendarRef.current.getApi();
    if (calendarApi.view.type === "resourceTimeGridDay") {
      const dataSelecionada = info.startStr.split("T")[0];
      const horarioSelecionado = info.startStr.split("T")[1].substring(0, 5);
      const idDaQuadra = info.resource.id;

      setDadosForm({
        atleta: "",
        data: dataSelecionada,
        horario: horarioSelecionado,
        quadraId: idDaQuadra,
      });
      setModalAberto(true);
    }
  };

  // Ação do botão fixo superior "+ Nova Reserva Manual"
  const handleAbrirReservaManualFixa = () => {
    setDadosForm({
      atleta: "",
      data: new Date().toISOString().split("T")[0], 
      horario: "08:00", 
      quadraId: quadras[0]?.id || "", 
    });
    setModalAberto(true);
  };

  // Volta para o modo de exibição mensal
  const volverParaMes = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.changeView("dayGridMonth");
    setVisaoAtual("dayGridMonth");
  };

  // Dispara o envio dos dados da reserva manual ao backend no Railway
  const handleSalvarReserva = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post(
        "/bookings/manual",
        {
          nomeAtleta: dadosForm.atleta,
          data: dadosForm.data,
          horarioInicio: dadosForm.horario,
          courtId: dadosForm.quadraId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setModalAberto(false);
        aoAtualizarDados(); // Dispara o carregarDados() do arquivo pai
      }
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao criar reserva manual.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm calendar-container space-y-4">
      
      {/* BARRA DE AÇÕES SUPERIOR */}
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

      {/* CALENDÁRIO COMPLETO */}
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
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
      />

      {/* MODAL DE FORMULÁRIO DE RESERVA MANUAL */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Nova Reserva Manual</h3>
              <p className="text-xs text-slate-400">Agendamento direto pelo balcão da arena</p>
            </div>

            <form onSubmit={handleSalvarReserva} className="space-y-4">
              {/* Campo Nome do Atleta */}
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

              {/* Seleção de Quadras */}
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

              <div className="grid grid-cols-2 gap-3">
                {/* Seleção de Data */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-0.5">Data</label>
                  <input
                    type="date"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                    value={dadosForm.data}
                    onChange={(e) => setDadosForm({ ...dadosForm, data: e.target.value })}
                  />
                </div>

                {/* Seleção de Horário */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 ml-0.5">Horário de Início</label>
                  <input
                    type="time"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                    value={dadosForm.horario}
                    onChange={(e) => setDadosForm({ ...dadosForm, horario: e.target.value })}
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="grid grid-cols-2 gap-3 pt-4">
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
                  {loading ? "Gravando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}