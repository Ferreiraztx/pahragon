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

  const resourcesCalendar = quadras.map((q) => ({
    id: q.id,
    title: q.nome,
  }));

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

  // 1. Trata especificamente o clique no quadradinho do dia (Visão de Mês)
  const handleCliqueNoDiaDoMes = (info) => {
    const calendarApi = calendarRef.current.getApi();
    if (calendarApi.view.type === "dayGridMonth") {
      calendarApi.gotoDate(info.dateStr); 
      calendarApi.changeView("resourceTimeGridDay"); 
      setVisaoAtual("resourceTimeGridDay");
    }
  };

  // 2. Trata o clique nos espaços em branco dos horários (Visão Diária)
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

  const voltarParaMes = () => {
    const calendarApi = calendarRef.current.getApi();
    calendarApi.changeView("dayGridMonth");
    setVisaoAtual("dayGridMonth");
  };

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
        aoAtualizarDados();
      }
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao criar reserva manual.");
    } finally {
      setLoading(false);
    }
  };

  const nomeQuadraSelecionada = quadras.find((q) => q.id === dadosForm.quadraId)?.nome;

  return (
    <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm calendar-container space-y-4">
      
      {visaoAtual === "resourceTimeGridDay" && (
        <button
          onClick={voltarParaMes}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition"
        >
          ← Voltar para Visão Mensal
        </button>
      )}

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
        dateClick={handleCliqueNoDiaDoMes} // Evento para clique no dia do mês
        select={handleSelecaoHorarioVazio} // Evento para seleção de bloco de horário vago
        
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
      />

      {/* MODAL DE RESERVA MANUAL */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Nova Reserva Manual</h3>
              <p className="text-xs text-slate-400">Agendamento direto pelo balcão da arena</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1 text-slate-600 font-medium">
              <p>📍 <span className="font-bold text-slate-800">Quadra:</span> {nomeQuadraSelecionada}</p>
              <p>📅 <span className="font-bold text-slate-800">Horário:</span> {dadosForm.data.split("-").reverse().join("/")} às {dadosForm.horario}h</p>
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

              <div className="grid grid-cols-2 gap-3 pt-2">
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