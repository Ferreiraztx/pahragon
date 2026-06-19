import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Booking() {
  const [quadras, setQuadras] = useState([]);
  const [quadraSelecionada, setQuadraSelecionada] = useState("");
  const [data, setData] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  });

  const gradeCompletaDoDia = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30", "22:00",
  ];

  const [horariosProcessados, setHorariosProcessados] = useState([]);
  const [blocosSelecionados, setBlocosSelecionados] = useState([]);
  const [mensagem, setMensagem] = useState("");
  const [modalAviso, setModalAviso] = useState({ visivel: false, texto: "" });

  const navigate = useNavigate();

  async function buscarHorarios() {
    if (!quadraSelecionada || !data) return;
    try {
      const res = await api.get(
        `/bookings/disponiveis?courtId=${quadraSelecionada}&data=${data}`,
      );
      const horariosDisponiveisVindoDoBanco = res.data.disponiveis || [];
      const mapeados = gradeCompletaDoDia.map((horario) => {
        const estaDisponivel = horariosDisponiveisVindoDoBanco.includes(horario);
        return {
          horario,
          status: estaDisponivel ? "disponivel" : "ocupado",
        };
      });
      setHorariosProcessados(mapeados);
    } catch (err) {
      console.error("Erro ao buscar horários", err);
    }
  }

  useEffect(() => {
    api.get("/courts").then((res) => setQuadras(res.data));
  }, []);

  useEffect(() => {
    if (quadraSelecionada && data) {
      buscarHorarios();
    } else {
      setHorariosProcessados([]);
    }
    setBlocosSelecionados([]);
  }, [quadraSelecionada, data]);

  function lidarComSelecaoDeBloco(horarioClicado) {
    setMensagem("");
    if (blocosSelecionados.includes(horarioClicado)) {
      setBlocosSelecionados([]);
      return;
    }
    if (blocosSelecionados.length === 0) {
      setBlocosSelecionados([horarioClicado]);
      return;
    }
    const primeiroSelecionado = blocosSelecionados[0];
    const indexPrimeiro = gradeCompletaDoDia.indexOf(primeiroSelecionado);
    const indexAtual = gradeCompletaDoDia.indexOf(horarioClicado);

    const deIndex = Math.min(indexPrimeiro, indexAtual);
    const ateIndex = Math.max(indexPrimeiro, indexAtual);
    const intervaloPreenchido = gradeCompletaDoDia.slice(deIndex, ateIndex + 1);

    const possuiOcupadoNoMeio = intervaloPreenchido.some((h) => {
      const correspondente = horariosProcessados.find((p) => p.horario === h);
      return correspondente && correspondente.status === "ocupado";
    });

    if (possuiOcupadoNoMeio) {
      setMensagem("⚠️ Intervalo inválido: existem horários já reservados no meio dele.");
      return;
    }
    setBlocosSelecionados(intervaloPreenchido);
  }

  async function handleAgendar() {
    if (blocosSelecionados.length < 2) {
      setMensagem("⚠️ O tempo mínimo de agendamento é de 1 hora (2 blocos).");
      return;
    }

    const selecionadosOrdenados = [...blocosSelecionados].sort(
      (a, b) => gradeCompletaDoDia.indexOf(a) - gradeCompletaDoDia.indexOf(b),
    );

    const converterParaMinutos = (hStr) => {
      const [h, m] = hStr.split(":").map(Number);
      return h * 60 + m;
    };

    const primeiroMinutos = converterParaMinutos(selecionadosOrdenados[0]);
    const ultimoMinutos = converterParaMinutos(selecionadosOrdenados[selecionadosOrdenados.length - 1]);

    const obterStatusPorMinutos = (minutos) => {
      const hStr = `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
      const encontrado = horariosProcessados.find((p) => p.horario === hStr);
      return encontrado ? encontrado.status : null;
    };

    const minutos30Antes = primeiroMinutos - 30;
    const minutos60Antes = primeiroMinutos - 60;
    if (obterStatusPorMinutos(minutos30Antes) === "disponivel" && obterStatusPorMinutos(minutos60Antes) === "ocupado") {
      const msgAntes = "Sua reserva deixará um intervalo vago de apenas 30 minutos antes do seu jogo. Por favor, inclua esse horário ou junte com a reserva anterior.";
      setModalAviso({ visivel: true, texto: msgAntes });
      setMensagem(`⚠️ ${msgAntes}`);
      return;
    }

    const minutos30Depois = ultimoMinutos + 30;
    const minutes60Depois = ultimoMinutos + 60;
    if (obterStatusPorMinutos(minutos30Depois) === "disponivel" && obterStatusPorMinutos(minutes60Depois) === "ocupado") {
      const msgDepois = "Sua reserva deixará um intervalo vago de apenas 30 minutos após o seu jogo. Por favor, inclua mais 30 minutos ou estenda até o próximo agendamento.";
      setModalAviso({ visivel: true, texto: msgDepois });
      setMensagem(`⚠️ ${msgDepois}`);
      return;
    }

    const primeiroBloco = selecionadosOrdenados[0];
    const ultimoBloco = selecionadosOrdenados[selecionadosOrdenados.length - 1];

    const [hFim, mFim] = ultimoBloco.split(":").map(Number);
    const minFinal = mFim + 30;
    const horaFinalCalculada = minFinal === 60 ? hFim + 1 : hFim;
    const minutoFinalCalculada = minFinal === 60 ? 0 : 30;

    const horaInicioISO = new Date(`${data}T${primeiroBloco}:00.000Z`).toISOString();
    const horaFimISO = new Date(`${data}T${String(horaFinalCalculada).padStart(2, "0")}:${String(minutoFinalCalculada).padStart(2, "0")}:00.000Z`).toISOString();

    try {
      const resBooking = await api.post("/bookings", {
        courtId: quadraSelecionada,
        data,
        horaInicio: horaInicioISO,
        horaFim: horaFimISO,
      });
      navigate(`/pagamento/aguardando?bookingId=${resBooking.data.id}`);
    } catch {
      setMensagem("❌ Erro ao processar o agendamento. Verifique se os horários ainda estão vagos.");
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d3130] font-sans pb-16 antialiased tracking-tight">
      
      {/* MODAL PADRONIZADO — WARM FLAT / EDITORIAL */}
      {modalAviso.visivel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setModalAviso({ visivel: false, texto: "" })}
          />

          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 relative z-10 shadow-xl text-center space-y-5">
            <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center mx-auto text-amber-600 text-xl">
              ⚠️
            </div>

            <div className="space-y-1.5">
              <h3 className="text-[#1e2221] font-black text-xl tracking-tighter">
                Ajuste de Grade Necessário
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed font-normal">
                {modalAviso.texto}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalAviso({ visivel: false, texto: "" })}
              className="w-full bg-[#1e2221] hover:bg-black text-white font-bold py-3.5 rounded-xl transition shadow-sm text-xs uppercase tracking-wider"
            >
              Entendido, ajustar
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="max-w-xl mx-auto px-6 py-8 border-b border-slate-200/80">
        <button
          onClick={() => navigate("/")}
          className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#1e2221] transition"
        >
          ← Voltar
        </button>
        <h1 className="text-3xl font-black tracking-tighter text-[#1e2221] mt-2">
          Agendar Quadra
        </h1>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600 mt-1">
          Pahragon Arena
        </p>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-xl mx-auto px-6 py-8 space-y-6">
        
        {mensagem && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm px-4 py-3 rounded-xl font-medium">
            {mensagem}
          </div>
        )}

        {/* SELEÇÃO DA QUADRA */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Quadra
          </label>
          <div className="relative">
            <select
              className="w-full h-[52px] bg-white border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition appearance-none cursor-pointer font-medium text-sm"
              value={quadraSelecionada}
              onChange={(e) => setQuadraSelecionada(e.target.value)}
            >
              <option value="">Selecione uma quadra</option>
              {quadras.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.nome} — R$ {q.precoPorHora.toFixed(2)}/h
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</div>
          </div>
        </div>

        {/* SELEÇÃO DE DATA CORRIGIDA PARA MOBILE */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Data do Jogo
          </label>
          <div className="relative w-full h-[52px]">
            {/* O truque: Deixamos o input nativo invisível cobrindo todo o espaço. Ele repassa o toque nativamente para o iOS/Android abrir o calendário oficial, mas exibe o texto formatado no span abaixo. */}
            <input
              type="date"
              className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer text-base"
              value={data}
              onChange={(e) => setData(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
            
            {/* Máscara visual bonita idêntica ao select */}
            <div className="absolute inset-0 bg-white border border-slate-200 rounded-xl px-4 flex justify-between items-center z-10 pointer-events-none">
              <span className="text-slate-800 text-sm font-medium">
                {data
                  ? new Date(data + "T00:00:00").toLocaleDateString("pt-BR")
                  : "Selecione uma data"}
              </span>
              <span className="text-slate-400 text-sm">📅</span>
            </div>
          </div>
        </div>

        {/* LISTAGEM DE HORÁRIOS */}
        {horariosProcessados.length > 0 && (
          <div className="pt-2">
            <div className="flex justify-between items-center mb-3 px-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Horários Disponíveis (Mínimo 1 hora)
              </label>
              {blocosSelecionados.length > 0 && (
                <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  {blocosSelecionados.length * 30} min
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
              {horariosProcessados.map((item) => {
                const isSelected = blocosSelecionados.includes(item.horario);
                const isOcupado = item.status === "ocupado";

                const [hora, min] = item.horario.split(":").map(Number);
                let proxHora = hora;
                let proxMin = min + 30;
                if (proxMin === 60) {
                  proxMin = 0;
                  proxHora = hora + 1;
                }
                const horarioFimFiltrado = `${String(proxHora).padStart(2, "0")}:${String(proxMin).padStart(2, "0")}`;

                return (
                  <button
                    key={item.horario}
                    type="button"
                    disabled={isOcupado}
                    onClick={() => lidarComSelecaoDeBloco(item.horario)}
                    className={`w-full px-5 py-4 rounded-xl text-left border transition flex justify-between items-center ${
                      isOcupado
                        ? "bg-slate-50 border-slate-150 text-slate-300 cursor-not-allowed"
                        : isSelected
                          ? "bg-[#1e2221] border-[#1e2221] text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-sm font-mono font-bold tracking-tight">
                      {item.horario} — {horarioFimFiltrado}
                    </span>

                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                      isOcupado 
                        ? "text-rose-400" 
                        : isSelected 
                          ? "text-teal-400" 
                          : "text-teal-600"
                    }`}>
                      {isOcupado ? "Reservado" : isSelected ? "✓ Selecionado" : "Livre"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTÃO DE CONFIRMAÇÃO */}
        {blocosSelecionados.length > 0 && (
          <button
            onClick={handleAgendar}
            disabled={blocosSelecionados.length < 2}
            className={`w-full font-bold py-4 rounded-xl transition text-sm uppercase tracking-wider mt-4 shadow-sm ${
              blocosSelecionados.length >= 2
                ? "bg-[#1e2221] hover:bg-black text-white"
                : "bg-slate-100 border border-slate-200 text-slate-300 cursor-not-allowed shadow-none"
            }`}
          >
            {blocosSelecionados.length >= 2
              ? `Confirmar Reserva (${blocosSelecionados[0]} às ${(() => {
                  const ult = blocosSelecionados[blocosSelecionados.length - 1];
                  const [h, m] = ult.split(":").map(Number);
                  const minF = m + 30;
                  return `${String(minF === 60 ? h + 1 : h).padStart(2, "0")}:${String(minF === 60 ? 0 : 30).padStart(2, "0")}`;
                })()})`
              : "Selecione pelo menos 1 hora"}
          </button>
        )}
      </main>
    </div>
  );
}