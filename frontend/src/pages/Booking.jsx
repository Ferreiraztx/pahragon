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

  // Lista com TODOS os blocos possíveis do dia (Horário de funcionamento da quadra)
  const gradeCompletaDoDia = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
  ];

  // Aqui guardaremos os blocos processados: { horario: "08:00", status: "disponivel" | "ocupado" }
  const [horariosProcessados, setHorariosProcessados] = useState([]);
  // Array que guarda todos os blocos de 30 min selecionados (strings simples)
  const [blocosSelecionados, setBlocosSelecionados] = useState([]);

  const [mensagem, setMensagem] = useState("");

  // Estado para controlar o Modal de Aviso Bonitinho
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
        const estaDisponivel =
          horariosDisponiveisVindoDoBanco.includes(horario);
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

  // Lógica de preenchimento automático
  function lidarComSelecaoDeBloco(horarioClicado) {
    setMensagem("");

    // Se já estiver selecionado, limpa a seleção para reiniciar
    if (blocosSelecionados.includes(horarioClicado)) {
      setBlocosSelecionados([]);
      return;
    }

    // Se for a primeira seleção
    if (blocosSelecionados.length === 0) {
      setBlocosSelecionados([horarioClicado]);
      return;
    }

    // Intervalo automático entre o primeiro clique e o atual
    const primeiroSelecionado = blocosSelecionados[0];
    const indexPrimeiro = gradeCompletaDoDia.indexOf(primeiroSelecionado);
    const indexAtual = gradeCompletaDoDia.indexOf(horarioClicado);

    const deIndex = Math.min(indexPrimeiro, indexAtual);
    const ateIndex = Math.max(indexPrimeiro, indexAtual);

    const intervaloPreenchido = gradeCompletaDoDia.slice(deIndex, ateIndex + 1);

    // Validação: Verificar se há algum horário ocupado no meio do intervalo
    const possuiOcupadoNoMeio = intervaloPreenchido.some((h) => {
      const correspondente = horariosProcessados.find((p) => p.horario === h);
      return correspondente && correspondente.status === "ocupado";
    });

    if (possuiOcupadoNoMeio) {
      setMensagem(
        "⚠️ Não é possível selecionar esse intervalo pois existem horários já reservados no meio dele.",
      );
      return;
    }

    setBlocosSelecionados(intervaloPreenchido);
  }

  async function handleAgendar() {
    if (blocosSelecionados.length < 2) {
      setMensagem(
        "⚠️ O tempo mínimo de agendamento é de 1 hora (Selecione pelo menos 2 blocos).",
      );
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
    const ultimoMinutos = converterParaMinutos(
      selecionadosOrdenados[selecionadosOrdenados.length - 1],
    );

    const obterStatusPorMinutos = (minutos) => {
      const hStr = `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
      const encontrado = horariosProcessados.find((p) => p.horario === hStr);
      return encontrado ? encontrado.status : null;
    };

    // Validação de Buracos de 30 minutos ANTES
    const minutos30Antes = primeiroMinutos - 30;
    const minutos60Antes = primeiroMinutos - 60;
    if (
      obterStatusPorMinutos(minutos30Antes) === "disponivel" &&
      obterStatusPorMinutos(minutos60Antes) === "ocupado"
    ) {
      const msgAntes =
        "Sua reserva deixará um intervalo vago de apenas 30 minutos antes do seu jogo. Por favor, inclua esse horário ou junte com a reserva anterior.";
      setModalAviso({ visivel: true, texto: msgAntes }); // <--- ABRE O MODAL CUSTOMIZADO
      setMensagem(`⚠️ ${msgAntes}`);
      return;
    }

    // Validação de Buracos de 30 minutos DEPOIS
    const minutos30Depois = ultimoMinutos + 30;
    const minutes60Depois = ultimoMinutos + 60;
    if (
      obterStatusPorMinutos(minutos30Depois) === "disponivel" &&
      obterStatusPorMinutos(minutes60Depois) === "ocupado"
    ) {
      const msgDepois =
        "Sua reserva deixará um intervalo vago de apenas 30 minutos após o seu jogo. Por favor, inclua mais 30 minutos ou estenda até o próximo agendamento.";
      setModalAviso({ visivel: true, texto: msgDepois }); // <--- ABRE O MODAL CUSTOMIZADO
      setMensagem(`⚠️ ${msgDepois}`);
      return;
    }

    const primeiroBloco = selecionadosOrdenados[0];
    const ultimoBloco = selecionadosOrdenados[selecionadosOrdenados.length - 1];

    const [hFim, mFim] = ultimoBloco.split(":").map(Number);
    const minFinal = mFim + 30;
    const horaFinalCalculada = minFinal === 60 ? hFim + 1 : hFim;
    const minutoFinalCalculada = minFinal === 60 ? 0 : 30;

    const horaInicioISO = new Date(
      `${data}T${primeiroBloco}:00.000Z`,
    ).toISOString();
    const horaFimISO = new Date(
      `${data}T${String(horaFinalCalculada).padStart(2, "0")}:${String(minutoFinalCalculada).padStart(2, "0")}:00.000Z`,
    ).toISOString();

    try {
      const resBooking = await api.post("/bookings", {
        courtId: quadraSelecionada,
        data,
        horaInicio: horaInicioISO,
        horaFim: horaFimISO,
      });

      navigate(`/pagamento/aguardando?bookingId=${resBooking.data.id}`);
    } catch {
      setMensagem(
        "❌ Erro ao processar o agendamento. Verifique se os horários ainda estão vagos.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d3130] font-sans pb-10">
      {/* MODAL CUSTOMIZADO — BONITINHO E MODERNO */}
      {modalAviso.visivel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Fundo escurecido com desfoque (Glassmorphism) */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalAviso({ visivel: false, texto: "" })}
          />

          {/* Card do Modal */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl max-w-md w-full p-6 relative z-10 shadow-2xl space-y-5 text-center animate-scale-up">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400 text-xl">
              ⚠️
            </div>

            <div className="space-y-2">
              <h3 className="text-white font-black text-lg">
                Ajuste de Grade Necessário
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {modalAviso.texto}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalAviso({ visivel: false, texto: "" })}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-purple-600/10 active:scale-[0.98] "
            ></button>
          </div>
        </div>
      )}

      <header className="max-w-xl mx-auto px-6 py-8 border-b border-slate-200">
        <button
          onClick={() => navigate("/")}
          className="text-sm font-bold text-slate-400 hover:text-[#1e2221]"
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

      <main className="max-w-xl mx-auto px-6 py-10 space-y-6">
        {mensagem && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
            {mensagem}
          </div>
        )}

        {/* Seleção da Quadra */}
        <div>
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Quadra
          </label>
          <select
            className="w-full h-[52px] bg-white border border-teal-600 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 transition appearance-none cursor-pointer"
            value={quadraSelecionada}
            onChange={(e) => setQuadraSelecionada(e.target.value)}
          >
            <option value="">Selecione uma quadra</option>
            {quadras.map((q) => (
              <option key={q.id} value={q.id}>
                {q.nome} — R$ {q.precoPorHora}/h
              </option>
            ))}
          </select>
        </div>

        {/* Seleção de Data */}
        <div>
          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Data
          </label>
          <div className="relative mt-2">
            <button
              type="button"
              onClick={() =>
                document.getElementById("meu-input-data").showPicker()
              }
              className="w-full bg-white border border-teal-600 rounded-xl px-4 py-3 text-slate-800 text-left focus:outline-none focus:border-teal-600 transition flex justify-between items-center cursor-pointer select-none"
            >
              <span>
                {data
                  ? new Date(data + "T00:00:00").toLocaleDateString("pt-BR")
                  : "Selecione uma data"}
              </span>
              <span className="text-white/30 text-sm">📅</span>
            </button>

            <input
              id="meu-input-data"
              type="date"
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
              value={data}
              onChange={(e) => setData(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        {/* LISTAGEM DE HORÁRIOS */}
        {horariosProcessados.length > 0 && (
          <div>
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Selecione os Blocos (Mínimo 1 hora)
              </label>
              {blocosSelecionados.length > 0 && (
                <span className="text-xs font-bold text-[#0d9488]">
                  {blocosSelecionados.length * 30} min selecionados
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 mt-3 max-h-[350px] overflow-y-auto pr-1">
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
                    className={`w-full px-5 py-3.5 rounded-xl font-bold text-left border transition flex justify-between items-center ${
                      isOcupado
                        ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                        : isSelected
                          ? "bg-teal-600 border-teal-600 text-white shadow-lg"
                          : "bg-white border-slate-300 text-slate-800 hover:border-teal-600"
                    }`}
                  >
                    <span className="text-base tracking-wide">
                      {item.horario} &gt;&gt; {horarioFimFiltrado}
                    </span>

                    <span
                      className={`text-xs font-bold ${
                        isOcupado
                          ? "text-rose-500" // Cor de erro legível no fundo claro
                          : isSelected
                            ? "text-teal-50" // Branco bem clarinho para contrastar com o fundo teal
                            : "teal-600" // Preto para o status "Disponível"
                      }`}
                    >
                      {isOcupado
                        ? "❌ RESERVADO"
                        : isSelected
                          ? "✓ SELECIONADO"
                          : "DISPONÍVEL"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Botão de Confirmação */}
        {blocosSelecionados.length > 0 && (
          <button
            onClick={handleAgendar}
            className={`w-full font-bold py-4 rounded-xl transition text-lg mt-4 shadow-lg ${
              blocosSelecionados.length >= 2
                ? "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20" // Cor de destaque do Admin
                : "bg-slate-200 text-slate-400 cursor-not-allowed" // Cor de desativado
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
