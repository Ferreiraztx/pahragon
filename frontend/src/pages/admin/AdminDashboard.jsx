import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AgendaAdmin from "./AgendaAdmin";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function AdminDashboard() {
  const [reservas, setReservas] = useState([]);
  const [quadras, setQuadras] = useState([]);
  const [torneios, setTorneios] = useState([]);
  const [caixa, setCaixa] = useState(null);
  const [aba, setAba] = useState("reservas");
  const [atletas, setAtletas] = useState([]);
  const [atletaSelecionado, setAtletaSelecionado] = useState(null);
  const [horarios, setHorarios] = useState([]);

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtroDataAtivo, setFiltroDataAtivo] = useState("tudo");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [menuAberto, setMenuAberto] = useState(false);

  const [novaQuadra, setNovaQuadra] = useState({
    nome: "",
    descricao: "",
    precoPorHora: "",
  });

  const [novoTorneio, setNovoTorneio] = useState({
    nome: "",
    descricao: "",
    data: "",
    vagas: "",
    preco: "",
    whatsapp: "",
  });
  const [mensagem, setMensagem] = useState("");
  const navigate = useNavigate();

  const [modalConfirmacao, setModalConfirmacao] = useState({
    open: false,
    titulo: "",
    mensagem: "",
    acaoConfirmar: null,
  });

  const admin = JSON.parse(localStorage.getItem("admin") || "{}");
  const token = localStorage.getItem("adminToken");

  const formatarNascimentoCompleto = (dataStr) => {
    if (!dataStr) return "—";

    const dataPura = dataStr.split("T")[0];
    const [ano, mes, dia] = dataPura.split("-");

    const meses = [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ];
    const nomeMes = meses[parseInt(mes, 10) - 1];

    return `${parseInt(dia, 10)} ${nomeMes} ${ano}`;
  };

  const [aviso, setAviso] = useState({
    aberto: false,
    tipo: "sucesso",
    mensagem: "",
  });
  const [modalConfirmar, setModalConfirmar] = useState({
    aberto: false,
    id: null,
    texto: "",
  });

  const [bloqueioForm, setBloqueioForm] = useState({
    quadraId: "",
    data: "",
    horaInicio: "",
    horaFim: "",
    motivo: "",
  });
  const [loadingBloqueio, setLoadingBloqueio] = useState(false);

  const handleCriarBloqueio = async (e) => {
    e.preventDefault();
    setLoadingBloqueio(true);

    try {
      const response = await api.post("/bookings/bloqueios", bloqueioForm, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token")}`,
        },
      });

      if (response.status === 200 || response.status === 201) {
        setAviso({
          aberto: true,
          tipo: "sucesso",
          mensagem: "Quadra bloqueada com sucesso!",
        });
        setBloqueioForm({
          quadraId: "",
          data: "",
          horaInicio: "",
          horaFim: "",
          motivo: "",
        });
        carregarBloqueios();
      } else {
        setAviso({
          aberto: true,
          tipo: "erro",
          mensagem: "Erro ao processar o bloqueio na arena.",
        });
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || "Erro na conexão com o servidor.";
      setAviso({
        aberto: true,
        tipo: "erro",
        mensagem: errorMsg,
      });
    } finally {
      setLoadingBloqueio(false);
    }
  };

  const handleDeletarBloqueio = (id, data, quadra) => {
    setModalConfirmar({
      aberto: true,
      id,
      texto: `Deseja realmente cancelar o bloqueio da ${quadra} no dia ${data}?`,
    });
  };

  const confirmarAcaoDeletar = async () => {
    const id = modalConfirmar.id;
    setModalConfirmar({ aberto: false, id: null, texto: "" });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/bloqueios/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      if (response.ok) {
        setAviso({
          aberto: true,
          tipo: "sucesso",
          mensagem: "Bloqueio cancelado com sucesso!",
        });
        carregarBloqueios();
      } else {
        setAviso({
          aberto: true,
          tipo: "erro",
          mensagem: "Erro ao cancelar o bloqueio.",
        });
      }
    } catch (error) {
      setAviso({
        aberto: true,
        tipo: "erro",
        mensagem: "Erro na conexão com o servidor.",
      });
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    carregarDados();
  }, []);

  async function carregarDados() {
    const headers = { Authorization: `Bearer ${token}` };
    const resultados = await Promise.allSettled([
      api.get("/bookings/todas", { headers }),
      api.get("/courts"),
      api.get("/tournaments"),
      api.get("/tournaments/caixa", { headers }),
      api.get("/auth/usuarios", { headers }),
      api.get("/horarios"),
    ]);

    const [resReservas, resQuadras, resTorneios, resCaixa, resAtletas] =
      resultados;

    if (resReservas.status === "fulfilled") setReservas(resReservas.value.data);
    if (resQuadras.status === "fulfilled") setQuadras(resQuadras.value.data);
    if (resTorneios.status === "fulfilled") setTorneios(resTorneios.value.data);
    if (resCaixa.status === "fulfilled") setCaixa(resCaixa.value.data);
    if (resAtletas.status === "fulfilled") setAtletas(resAtletas.value.data);
    if (resultados[5].status === "fulfilled")
      setHorarios(resultados[5].value.data);

    resultados.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(
          `Falha ao carregar dados [${i}]:`,
          r.reason?.response?.data || r.reason?.message,
        );
      }
    });
  }

  const diasSemana = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  const [bloqueios, setBloqueios] = useState([]);

  const carregarBloqueios = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/bookings/bloqueios`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setBloqueios(data);
      }
    } catch (error) {
      console.error("Erro ao carregar bloqueios:", error);
    }
  };

  useEffect(() => {
    if (aba === "gestao") {
      carregarBloqueios();
    }
  }, [aba]);

  async function atualizarHorario(diaSemana, campo, valor) {
    const horarioAtual = horarios.find((h) => h.diaSemana === diaSemana);
    const updated = { ...horarioAtual, [campo]: valor };

    setHorarios(horarios.map((h) => (h.diaSemana === diaSemana ? updated : h)));

    try {
      await api.put(
        "/horarios",
        {
          diaSemana,
          ativo: updated.ativo,
          orderAbertura: updated.horaAbertura,
          horaFechamento: updated.horaFechamento,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      setMensagem("❌ Erro ao salvar horário de funcionamento.");
      carregarDados();
    }
  }

  async function criarQuadra(e) {
    e.preventDefault();
    try {
      await api.post(
        "/courts",
        { ...novaQuadra, precoPorHora: Number(novaQuadra.precoPorHora) },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMensagem("✅ Quadra adicionada com sucesso.");
      setNovaQuadra({ nome: "", descricao: "", precoPorHora: "" });
      carregarDados();
    } catch {
      setMensagem("❌ Erro ao cadastrar quadra.");
    }
  }

  async function criarTorneio(e) {
    e.preventDefault();
    try {
      const whatsappLimpo = novoTorneio.whatsapp
        ? novoTorneio.whatsapp.replace(/\D/g, "")
        : "";

      const dadosParaEnviar = {
        nome: novoTorneio.nome,
        descricao: novoTorneio.descricao,
        data: novoTorneio.data,
        vagas: Number(novoTorneio.vagas),
        preco: Number(novoTorneio.preco),
        whatsapp: whatsappLimpo,
      };

      await api.post("/tournaments", dadosParaEnviar, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMensagem("✅ Torneio publicado com sucesso.");
      setNovoTorneio({
        nome: "",
        descricao: "",
        data: "",
        vagas: "",
        preco: "",
        whatsapp: "",
      });
      carregarDados();
    } catch (error) {
      console.error(
        "Erro ao publicar torneio:",
        error.response?.data || error.message,
      );
      setMensagem("❌ Erro ao publicar torneio. Verifique os dados.");
    }
  }

  function solicitarDeletarQuadra(id, nome) {
    setModalConfirmacao({
      aberto: true,
      titulo: "Remover Quadra",
      mensagem: `Tem certeza que deseja desativar e remover a "${nome}" da estrutura da arena?`,
      acaoConfirmar: async () => {
        await api.delete(`/courts/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        carregarDados();
        fecharModal();
      },
    });
  }

  function solicitarDeletarTorneio(id, nome) {
    setModalConfirmacao({
      aberto: true,
      titulo: "Cancelar Torneio",
      mensagem: `Tem certeza que deseja remover o torneio "${nome}"? Esta ação não pode ser desfeita.`,
      acaoConfirmar: async () => {
        await api.delete(`/tournaments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        carregarDados();
        fecharModal();
      },
    });
  }

  function fecharModal() {
    setModalConfirmacao({
      aberto: false,
      titulo: "",
      mensagem: "",
      acaoConfirmar: null,
    });
  }

  function selecionarAba(id) {
    setAba(id);
    setFiltroStatus("todos");
    setMenuAberto(false);
  }

  function sair() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  }

  function aplicarFiltroRapido(tipo) {
    const hoje = new Date();
    const isoString = (d) => d.toISOString().split("T")[0];
    setFiltroDataAtivo(tipo);

    switch (tipo) {
      case "hoje":
        setDataInicio(isoString(open));
        setDataFim(isoString(hoje));
        break;
      case "semana": {
        const semanaPassada = new Date();
        semanaPassada.setDate(hoje.getDate() - 7);
        setDataInicio(isoString(semanaPassada));
        setDataFim(isoString(hoje));
        break;
      }
      case "mes": {
        const mesPassado = new Date();
        mesPassado.setMonth(hoje.getMonth() - 1);
        setDataInicio(isoString(mesPassado));
        setDataFim(isoString(hoje));
        break;
      }
      case "ano": {
        const anoPassado = new Date();
        anoPassado.setFullYear(hoje.getFullYear() - 1);
        setDataInicio(isoString(anoPassado));
        setDataFim(isoString(hoje));
        break;
      }
      case "tudo":
      default:
        setDataInicio("");
        setDataFim("");
        break;
    }
  }

  const reservasFiltradasPorData = reservas.filter((r) => {
    const dataReservaISO = new Date(r.data).toISOString().split("T")[0];
    if (dataInicio && dataReservaISO < dataInicio) return false;
    if (dataFim && dataReservaISO > dataFim) return false;
    return true;
  });

  const paymentsFiltradosPorPeriodo = (caixa?.payments || []).filter((p) => {
    const dataPagamentoISO = new Date(p.booking.data)
      .toISOString()
      .split("T")[0];
    if (dataInicio && dataPagamentoISO < dataInicio) return false;
    if (dataFim && dataPagamentoISO > dataFim) return false;
    return true;
  });

  const totalFiltradoPorPeriodo = paymentsFiltradosPorPeriodo.reduce(
    (soma, p) => soma + p.valor,
    0,
  );

  const totalConfirmadasNoPeriodo = reservasFiltradasPorData.filter(
    (r) => r.status === "confirmado",
  ).length;
  const totalPendentesNoPeriodo = reservasFiltradasPorData.filter(
    (r) => r.status === "pendente",
  ).length;
  const totalCanceladasNoPeriodo = reservasFiltradasPorData.filter(
    (r) => r.status === "cancelado",
  ).length;

  const reservasExibidasNaLista = reservasFiltradasPorData.filter((r) => {
    return filtroStatus === "todos" || r.status === filtroStatus;
  });

  const dadosGrafico = paymentsFiltradosPorPeriodo.length
    ? Object.values(
        paymentsFiltradosPorPeriodo.reduce((acc, p) => {
          const dataObj = new Date(p.booking.data);
          const dataFormatada = `${dataObj.getDate().toString().padStart(2, "0")}/${(dataObj.getMonth() + 1).toString().padStart(2, "0")}`;

          if (!acc[dataFormatada]) {
            acc[dataFormatada] = { name: dataFormatada, faturamento: 0 };
          }

          acc[dataFormatada].faturamento += p.valor;
          return acc;
        }, {}),
      ).sort((a, b) => {
        const [diaA, mesA] = a.name.split("/").map(Number);
        const [diaB, mesB] = b.name.split("/").map(Number);
        return mesA !== mesB ? mesA - mesB : diaA - diaB;
      })
    : [];

  function estatisticasAtleta(userId) {
    const reservasDoAtleta = reservas.filter((r) => r.user?.id === userId);
    const totalReservas = reservasDoAtleta.length;
    const ultimaReserva = totalReservas
      ? reservasDoAtleta.reduce((maisRecente, r) =>
          new Date(r.data) > new Date(maisRecente.data) ? r : maisRecente,
        )
      : null;

    return { totalReservas, ultimaReserva };
  }

  const statusStyle = {
    pendente:
      "text-amber-800 bg-amber-100/80 px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase",
    confirmado:
      "text-teal-900 bg-teal-100/80 px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase",
    cancelado:
      "text-slate-500 bg-slate-200/60 px-3 py-1 rounded-lg text-xs font-medium",
  };

  const abas = [
    { id: "reservas", label: "Reservas", count: reservas.length },
    { id: "quadras", label: "Quadras", count: quadras.length },
    { id: "torneios", label: "Torneios", count: torneios.length },
    { id: "atletas", label: "Atletas", count: atletas.length },
    { id: "horarios", label: "Horário de Funcionamento", count: null },
    { id: "gestao", label: "Bloqueio de Quadras", count: null },
    { id: "caixa", label: "Fluxo de Caixa", count: null },
  ];

  const formatarDataLateral = (dataString) => {
    const dataObj = new Date(dataString);
    const dia = dataObj.getDate().toString().padStart(2, "0");
    const mes = dataObj
      .toLocaleString("pt-BR", { month: "short" })
      .replace(".", "");
    return `${dia} ${mes}`;
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#2d3130] antialiased tracking-tight font-sans text-base overflow-x-hidden">
      {/* MODAL DE CONFIRMAÇÃO CUSTOMIZADO */}
      {modalConfirmacao.aberto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                {modalConfirmacao.titulo}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {modalConfirmacao.mensagem}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={fecharModal}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition"
              >
                Cancelar
              </button>
              <button
                onClick={modalConfirmacao.acaoConfirmar}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-sm transition"
              >
                Confirmar Remoção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHE DO ATLETA */}
      {atletaSelecionado &&
        (() => {
          const { totalReservas, ultimaReserva } = estatisticasAtleta(
            atletaSelecionado.id,
          );
          return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 max-w-md w-full shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {atletaSelecionado.nome}
                    </h3>
                    <p className="text-sm text-slate-500 font-mono">
                      {atletaSelecionado.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setAtletaSelecionado(null)}
                    className="opacity-40 hover:opacity-100 text-xl leading-none px-2"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-100 pt-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-0.5">
                      Telefone
                    </span>
                    <span className="text-slate-800 font-semibold">
                      {atletaSelecionado.telefone || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-0.5">
                      CPF
                    </span>
                    <span className="text-slate-800 font-semibold">
                      {atletaSelecionado.cpf || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-0.5">
                      Cidade
                    </span>
                    <span className="text-slate-800 font-semibold">
                      {atletaSelecionado.cidade
                        ? `${atletaSelecionado.cidade}${atletaSelecionado.estado ? "/" + atletaSelecionado.estado : ""}`
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-0.5">
                      Nascimento
                    </span>
                    <span className="text-slate-800 font-semibold">
                      {atletaSelecionado.dataNascimento
                        ? formatarNascimentoCompleto(
                            atletaSelecionado.dataNascimento,
                          )
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Atividade na Arena
                  </p>
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <span className="text-sm font-semibold text-slate-600">
                      Total de reservas
                    </span>
                    <span className="text-lg font-extrabold text-slate-900 font-mono">
                      {totalReservas}
                    </span>
                  </div>

                  {ultimaReserva ? (
                    <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1">
                      <span className="text-xs font-bold text-slate-400 block">
                        Última reserva
                      </span>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {ultimaReserva.court?.nome}
                        </span>
                        <span className="text-sm font-mono text-slate-500">
                          {formatarDataLateral(ultimaReserva.data)}
                        </span>
                      </div>
                      <span className={statusStyle[ultimaReserva.status]}>
                        {ultimaReserva.status}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 px-1">
                      Ainda não fez nenhuma reserva.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setAtletaSelecionado(null)}
                  className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          );
        })()}

      {/* CABEÇALHO */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex items-center justify-between border-b border-slate-200/80">
        <div className="flex items-baseline gap-2.5">
          <span className="font-black text-2xl sm:text-3xl tracking-tighter text-[#1e2221]">
            pahragon
          </span>
          <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600">
            arena
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-8 text-sm sm:text-base">
          <span className="text-slate-500">
            Logado como{" "}
            <span className="font-bold text-slate-800">{admin.nome}</span>
          </span>
          <button
            onClick={sair}
            className="text-slate-400 hover:text-rose-600 transition font-semibold"
          >
            Sair
          </button>
        </div>

        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="lg:hidden flex flex-col items-center justify-center gap-1.5 w-10 h-10 rounded-xl hover:bg-slate-200/60 transition"
          aria-label="Abrir menu"
        >
          <span
            className={`block w-6 h-0.5 bg-[#1e2221] transition-transform ${menuAberto ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-[#1e2221] transition-opacity ${menuAberto ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-[#1e2221] transition-transform ${menuAberto ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </header>

      {/* PAINEL DO MENU MOBILE */}
      {menuAberto && (
        <div className="lg:hidden border-b border-slate-200/80 bg-white shadow-md animate-fadeIn">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
              <span className="text-sm text-slate-500">
                Logado como{" "}
                <span className="font-bold text-slate-800">{admin.nome}</span>
              </span>
              <button
                onClick={sair}
                className="text-sm font-bold text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition"
              >
                Sair
              </button>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Menu Principal
              </p>
              <nav className="flex flex-col gap-2">
                {abas.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => selecionarAba(a.id)}
                    className={`text-left px-4 py-3 rounded-xl text-base font-bold transition flex items-center justify-between ${
                      aba === a.id
                        ? "bg-[#1e2221] text-white shadow-md"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    <span>{a.label}</span>
                    {a.count !== null && (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md font-mono ${aba === a.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}
                      >
                        {a.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {mensagem && (
          <div className="mb-8 sm:mb-10 text-base text-teal-900 bg-teal-50 border border-teal-200/60 px-5 py-4 rounded-xl flex items-center justify-between">
            <span className="font-medium">{mensagem}</span>
            <button
              onClick={() => setMensagem("")}
              className="opacity-50 hover:opacity-100 text-lg"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-16 items-start">
          {/* Barra Lateral de Controle */}
          <div className="lg:col-span-1 space-y-10 lg:sticky lg:top-10 min-w-0 w-full overflow-hidden">
            <div className="hidden lg:block">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Menu Principal
              </p>
              <nav className="flex flex-col gap-2">
                {abas.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => selecionarAba(a.id)}
                    className={`text-left px-4 py-3 rounded-xl text-base font-bold transition flex items-center justify-between ${
                      aba === a.id
                        ? "bg-[#1e2221] text-white shadow-md"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    <span>{a.label}</span>
                    {a.count !== null && (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md font-mono ${aba === a.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}
                      >
                        {a.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {(aba === "reservas" || aba === "caixa") && (
              <div className="space-y-6 pt-6 lg:pt-0 lg:border-t-0 border-t border-slate-200/80 min-w-0 w-full">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Filtrar Período
                </p>
                <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto -mx-4 px-4 lg:overflow-visible lg:mx-0 lg:px-0 pb-1 w-full">
                  {[
                    { id: "tudo", label: "Todo o histórico" },
                    { id: "hoje", label: "Apenas hoje" },
                    { id: "semana", label: "Últimos 7 dias" },
                    { id: "mes", label: "Últimos 30 dias" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => aplicarFiltroRapido(item.id)}
                      className={`text-left text-sm px-3 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                        filtroDataAtivo === item.id
                          ? "text-teal-700 font-bold bg-teal-50"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 pt-2 min-w-0 w-full">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Período Customizado
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-4 min-w-0 w-full">
                    <div className="flex flex-col gap-1 w-full">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider pl-0.5">
                        De
                      </span>
                      <input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => {
                          setDataInicio(e.target.value);
                          setFiltroDataAtivo("custom");
                        }}
                        className="block w-full min-w-0 max-w-full box-border bg-white border border-slate-300 rounded-xl px-4 text-base text-slate-800 h-12 focus:outline-none focus:border-slate-900 shadow-sm appearance-none items-center justify-center text-left"
                      />
                    </div>

                    <div className="flex flex-col gap-1 w-full">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider pl-0.5">
                        Até
                      </span>
                      <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => {
                          setDataFim(e.target.value);
                          setFiltroDataAtivo("custom");
                        }}
                        className="block w-full min-w-0 max-w-full box-border bg-white border border-slate-300 rounded-xl px-4 text-base text-slate-800 h-12 focus:outline-none focus:border-slate-900 shadow-sm appearance-none items-center justify-center text-left"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Área Conteúdo */}
          <div className="lg:col-span-3 space-y-10 min-w-0 w-full">
            {/* RESERVAS */}
            {aba === "reservas" && (
              <div className="space-y-10">
                <div className="grid grid-cols-3 gap-4 sm:gap-8 py-4 border-b border-slate-200/80">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-400 block mb-1">
                      Confirmadas
                    </span>
                    <span className="text-3xl sm:text-5xl font-light text-slate-900 font-mono tracking-tighter">
                      {totalConfirmadasNoPeriodo}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-400 block mb-1">
                      Pendentes
                    </span>
                    <span className="text-3xl sm:text-5xl font-light text-amber-600 font-mono tracking-tighter">
                      {totalPendentesNoPeriodo}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-400 block mb-1">
                      Canceladas
                    </span>
                    <span className="text-3xl sm:text-5xl font-light text-slate-400 font-mono tracking-tighter">
                      {totalCanceladasNoPeriodo}
                    </span>
                  </div>
                </div>

                <AgendaAdmin
                  reservas={reservasFiltradasPorData}
                  quadras={quadras}
                  token={token}
                  aoAtualizarDados={carregarDados}
                />

                <div className="flex gap-4 sm:gap-6 text-sm border-b border-slate-200/40 pb-3 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pt-6">
                  {[
                    { id: "todos", label: "Todos os status" },
                    { id: "confirmado", label: "Confirmadas" },
                    { id: "pendente", label: "Pendentes" },
                    { id: "cancelado", label: "Canceladas" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFiltroStatus(tab.id)}
                      className={`pb-1.5 transition text-sm font-medium whitespace-nowrap ${
                        filtroStatus === tab.id
                          ? "text-slate-900 border-b-2 border-slate-900 font-bold"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {reservasExibidasNaLista.length === 0 ? (
                    <div className="text-slate-400 text-base py-16 text-center font-light">
                      Nenhuma reserva encontrada para os critérios selecionados.
                    </div>
                  ) : (
                    reservasExibidasNaLista.map((r) => (
                      <div
                        key={r.id}
                        className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
                          <span className="text-sm font-mono font-bold text-slate-400 uppercase sm:w-20 tracking-wider">
                            {formatarDataLateral(r.data)}
                          </span>

                          <div>
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                              <span className="font-extrabold text-slate-900 text-base sm:text-lg">
                                {r.court?.nome || "Quadra"}
                              </span>
                              <span className="text-sm font-mono font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                                {new Date(r.horaInicio).toLocaleTimeString(
                                  "pt-BR",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                                h –{" "}
                                {new Date(r.horaFim).toLocaleTimeString(
                                  "pt-BR",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                                h
                              </span>
                            </div>
                            <div className="text-sm text-slate-500 mt-1.5 flex items-center flex-wrap gap-x-2">
                              <span className="font-semibold text-slate-700">
                                {r.nomeAvulso || r.user?.nome || "Usuário"}
                              </span>
                              <span className="opacity-40">•</span>
                              <span className="font-mono text-slate-400 text-xs sm:text-sm">
                                {r.user?.email || "—"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className={statusStyle[r.status]}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* QUADRAS */}
            {aba === "quadras" && (
              <div className="space-y-12">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-6">
                    Estrutura das Quadras
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {quadras.length === 0 ? (
                      <p className="text-slate-400 text-base py-4">
                        Nenhuma quadra listada.
                      </p>
                    ) : (
                      quadras.map((q) => (
                        <div
                          key={q.id}
                          className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-all"
                        >
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-lg">
                              {q.nome}
                            </h4>
                            <p className="text-sm text-slate-500 mt-1">
                              {q.descricao || "Sem descrição cadastrada"}
                              <span className="mx-2 text-slate-300">•</span>
                              Tarifa:{" "}
                              <span className="text-teal-700 font-extrabold font-mono">
                                R$ {q.precoPorHora}/h
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() => solicitarDeletarQuadra(q.id, q.nome)}
                            className="self-start sm:self-auto text-sm font-bold text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200/80 max-w-lg">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                    Nova Quadra
                  </h3>
                  <form onSubmit={criarQuadra} className="space-y-4">
                    <input
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-slate-900 h-12 shadow-sm"
                      placeholder="Título/Identificação da Quadra"
                      value={novaQuadra.nome}
                      onChange={(e) =>
                        setNovaQuadra({ ...novaQuadra, nome: e.target.value })
                      }
                      required
                    />
                    <input
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-slate-900 h-12 shadow-sm"
                      placeholder="Descrição ou observações estruturais"
                      value={novaQuadra.descricao}
                      onChange={(e) =>
                        setNovaQuadra({
                          ...novaQuadra,
                          descricao: e.target.value,
                        })
                      }
                    />
                    <input
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-slate-900 font-mono h-12 shadow-sm"
                      placeholder="Preço Cobrado por Hora (Ex: 80)"
                      type="number"
                      value={novaQuadra.precoPorHora}
                      onChange={(e) =>
                        setNovaQuadra({
                          ...novaQuadra,
                          precoPorHora: e.target.value,
                        })
                      }
                      required
                    />
                    <button
                      className="bg-[#1e2221] hover:bg-black text-white text-sm font-bold px-5 py-3.5 rounded-xl transition shadow-md w-full sm:w-auto"
                      type="submit"
                    >
                      Adicionar à Arena
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TORNEIOS */}
            {aba === "torneios" && (
              <div className="space-y-12">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-6">
                    Torneios Ativos
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {torneios.length === 0 ? (
                      <p className="text-slate-400 text-base">
                        Sem competições agendadas.
                      </p>
                    ) : (
                      torneios.map((t) => {
                        const irParaWhatsappDoTorneio = () => {
                          let numeroDestino = t.whatsapp
                            ? String(t.whatsapp).replace(/\D/g, "")
                            : "";

                          if (!numeroDestino) {
                            alert(
                              "Este torneio não possui um número de contato cadastrado.",
                            );
                            return;
                          }

                          if (!numeroDestino.startsWith("55")) {
                            numeroDestino = `55${numeroDestino}`;
                          }

                          const mensagem = `Olá! Vi o torneio "${t.nome}" no painel da arena e gostaria de saber se ainda restam vagas disponíveis para inscrição?`;
                          const link = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(mensagem)}`;
                          window.open(link, "_blank");
                        };

                        return (
                          <div
                            key={t.id}
                            className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                              <span className="self-start text-xs sm:text-sm font-mono font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
                                {formatarDataLateral(t.data)}
                              </span>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                                  {t.nome}
                                </h4>
                                <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-y-1">
                                  <span>👥 {t.vagas} duplas/vagas totais</span>
                                  <span className="mx-2 text-slate-300">•</span>
                                  <span>
                                    Inscrição:{" "}
                                    <span className="font-mono text-slate-700 font-bold">
                                      R$ {Number(t.preco).toFixed(2)}
                                    </span>
                                  </span>
                                  {t.whatsapp && (
                                    <>
                                      <span className="mx-2 text-slate-300">
                                        •
                                      </span>
                                      <span className="text-slate-600 font-medium">
                                        📞 {t.whatsapp}
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                              <button
                                onClick={irParaWhatsappDoTorneio}
                                className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-3 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
                              >
                                Inscrição
                              </button>
                              <button
                                onClick={() =>
                                  solicitarDeletarTorneio(t.id, t.nome)
                                }
                                className="text-xs font-bold text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-200/80 max-w-lg">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                    Novo Torneio
                  </h3>
                  <form onSubmit={criarTorneio} className="space-y-4">
                    <input
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-slate-900 h-12 shadow-sm"
                      placeholder="Nome da Competição"
                      value={novoTorneio.nome}
                      onChange={(e) =>
                        setNovoTorneio({ ...novoTorneio, nome: e.target.value })
                      }
                      required
                    />
                    <input
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-slate-900 h-12 shadow-sm"
                      placeholder="Categorias envolvidas (Ex: Open Masculino / Mista B)"
                      value={novoTorneio.descricao}
                      onChange={(e) =>
                        setNovoTorneio({
                          ...novoTorneio,
                          descricao: e.target.value,
                        })
                      }
                    />

                    <div className="flex flex-col gap-1 w-full">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider pl-0.5">
                        Data do Torneio
                      </span>
                      <input
                        className="block w-full min-w-0 max-w-full box-border bg-white border border-slate-300 rounded-xl px-4 text-base focus:outline-none focus:border-slate-900 text-slate-800 h-12 shadow-sm appearance-none items-center justify-center text-left"
                        type="datetime-local"
                        value={novoTorneio.data}
                        onChange={(e) =>
                          setNovoTorneio({
                            ...novoTorneio,
                            data: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-slate-900 font-mono h-12 shadow-sm"
                        placeholder="Limite de Vagas"
                        type="number"
                        value={novoTorneio.vagas}
                        onChange={(e) =>
                          setNovoTorneio({
                            ...novoTorneio,
                            vagas: e.target.value,
                          })
                        }
                        required
                      />
                      <input
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-slate-900 font-mono h-12 shadow-sm"
                        placeholder="Valor Inscrição R$ (Ex: 120)"
                        type="number"
                        value={novoTorneio.preco}
                        onChange={(e) =>
                          setNovoTorneio({
                            ...novoTorneio,
                            preco: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider pl-0.5">
                        WhatsApp de Contato *
                      </span>
                      <input
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-slate-900 h-12 shadow-sm"
                        placeholder="Ex: 41999999999 (DDD + Número)"
                        type="text"
                        required
                        value={novoTorneio.whatsapp}
                        onChange={(e) =>
                          setNovoTorneio({
                            ...novoTorneio,
                            whatsapp: e.target.value,
                          })
                        }
                      />
                    </div>

                    <button
                      className="bg-[#1e2221] hover:bg-black text-white text-sm font-bold px-5 py-3.5 rounded-xl transition shadow-md w-full sm:w-auto"
                      type="submit"
                    >
                      Lançar Torneio
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ATLETAS */}
            {aba === "atletas" && (
              <div className="space-y-12">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-6">
                    Atletas Cadastrados
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {atletas.length === 0 ? (
                      <p className="text-slate-400 text-base py-4">
                        Nenhum atleta cadastrado ainda.
                      </p>
                    ) : (
                      atletas.map((at) => {
                        const { totalReservas, ultimaReserva } =
                          estatisticasAtleta(at.id);

                        return (
                          <div
                            key={at.id}
                            onClick={() => setAtletaSelecionado(at)}
                            className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 hover:shadow-md cursor-pointer transition-all"
                          >
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-lg">
                                {at.nome}
                              </h4>
                              <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-x-2">
                                <span className="font-mono text-slate-400 text-xs sm:text-sm">
                                  {at.email}
                                </span>
                                {at.telefone && (
                                  <>
                                    <span className="opacity-40">•</span>
                                    <span>{at.telefone}</span>
                                  </>
                                )}
                                {at.cidade && (
                                  <>
                                    <span className="opacity-40">•</span>
                                    <span>
                                      {at.cidade}
                                      {at.estado ? `/${at.estado}` : ""}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-6 sm:gap-8">
                              <div className="text-center sm:text-right">
                                <span className="text-xs font-bold text-slate-400 block">
                                  Reservas
                                </span>
                                <span className="text-xl font-extrabold text-slate-900 font-mono">
                                  {totalReservas}
                                </span>
                              </div>
                              <div className="text-center sm:text-right min-w-[80px]">
                                <span className="text-xs font-bold text-slate-400 block">
                                  Última
                                </span>
                                <span className="text-sm font-bold text-teal-700">
                                  {ultimaReserva
                                    ? formatarDataLateral(ultimaReserva.data)
                                    : "—"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* HORÁRIO DE FUNCIONAMENTO */}
            {aba === "horarios" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                    Horário de Funcionamento
                  </h2>
                  <p className="text-slate-400 text-sm font-light">
                    Desative um dia para fechar as reservas nele completamente.
                  </p>
                </div>

                <div className="space-y-3">
                  {diasSemana.map((nomeDia, indice) => {
                    const h = horarios.find(
                      (item) => item.diaSemana === indice,
                    );
                    if (!h) return null;
                    return (
                      <div
                        key={indice}
                        className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all ${
                          h.ativo
                            ? "bg-white border-slate-200"
                            : "bg-slate-50 border-slate-200/60 opacity-70"
                        }`}
                      >
                        <div className="flex items-center gap-4 min-w-[140px]">
                          <button
                            type="button"
                            onClick={() =>
                              atualizarHorario(indice, "ativo", !h.ativo)
                            }
                            className={`w-12 h-7 rounded-full relative transition-colors shrink-0 ${h.ativo ? "bg-teal-500" : "bg-slate-300"}`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${h.ativo ? "translate-x-5" : ""}`}
                            />
                          </button>
                          <span className="font-extrabold text-slate-900">
                            {nomeDia}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="time"
                            value={h.horaAbertura}
                            disabled={!h.ativo}
                            onChange={(e) =>
                              atualizarHorario(
                                indice,
                                "horaAbertura",
                                e.target.value,
                              )
                            }
                            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono disabled:opacity-40 disabled:bg-slate-100"
                          />
                          <span className="text-slate-400 text-sm">às</span>
                          <input
                            type="time"
                            value={h.horaFechamento}
                            disabled={!h.ativo}
                            onChange={(e) =>
                              atualizarHorario(
                                indice,
                                "horaFechamento",
                                e.target.value,
                              )
                            }
                            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono disabled:opacity-40 disabled:bg-slate-100"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GESTÃO DE QUADRAS (BLOQUEIOS) */}
            {aba === "gestao" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Gestão de Quadras
                  </h2>
                  <p className="text-sm text-slate-400 font-light mt-1">
                    Bloqueie horários específicos para manutenção, aulas ou
                    eventos privados.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                      <div className="w-1.5 h-5 bg-teal-500 rounded-full"></div>
                      Novo Bloqueio de Horário
                    </h3>
                  </div>

                  <form
                    onSubmit={handleCriarBloqueio}
                    className="p-6 space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-0.5">
                          Quadra
                        </label>
                        <select
                          required
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all text-sm text-slate-700"
                          value={bloqueioForm.quadraId}
                          onChange={(e) =>
                            setBloqueioForm({
                              ...bloqueioForm,
                              quadraId: e.target.value,
                            })
                          }
                        >
                          <option value="">Selecione a quadra...</option>
                          {quadras &&
                            quadras.map((q) => (
                              <option key={q.id} value={q.id}>
                                {q.nome}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-0.5">
                          Data do Bloqueio
                        </label>
                        <input
                          type="date"
                          required
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                          value={bloqueioForm.data}
                          onChange={(e) =>
                            setBloqueioForm({
                              ...bloqueioForm,
                              data: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-0.5">
                          Horário de Início
                        </label>
                        <input
                          type="time"
                          required
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                          value={bloqueioForm.horaInicio}
                          onChange={(e) =>
                            setBloqueioForm({
                              ...bloqueioForm,
                              horaInicio: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 ml-0.5">
                          Horário de Término
                        </label>
                        <input
                          type="time"
                          required
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                          value={bloqueioForm.horaFim}
                          onChange={(e) =>
                            setBloqueioForm({
                              ...bloqueioForm,
                              horaFim: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 ml-0.5">
                        Motivo (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Manutenção da areia, aula particular, evento..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm text-slate-700"
                        value={bloqueioForm.motivo}
                        onChange={(e) =>
                          setBloqueioForm({
                            ...bloqueioForm,
                            motivo: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loadingBloqueio}
                        className={`w-full py-3 rounded-xl font-extrabold text-sm text-white transition-all shadow-md ${
                          loadingBloqueio
                            ? "bg-slate-400"
                            : "bg-teal-600 hover:bg-teal-700 hover:-translate-y-0.5"
                        }`}
                      >
                        {loadingBloqueio
                          ? "Processando..."
                          : "Confirmar Bloqueio de Horário"}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">
                    Bloqueios Ativos
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {bloqueios.length === 0 ? (
                      <p className="text-slate-400 text-sm font-light pl-1 bg-white p-5 border border-slate-200 rounded-2xl shadow-sm">
                        Nenhum horário está bloqueado no momento.
                      </p>
                    ) : (
                      bloqueios.map((b) => {
                        const dataFormatadaSegura = formatarDataLateral(
                          b.data.replace(/-/g, "/"),
                        );
                        const nomeDaQuadra =
                          b.quadra?.nome ||
                          quadras.find((q) => q.id === b.quadraId)?.nome ||
                          `Quadra #${b.quadraId}`;

                        return (
                          <div
                            key={b.id}
                            className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                              <span className="self-start text-xs sm:text-sm font-mono font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg shrink-0">
                                {dataFormatadaSegura}
                              </span>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-base">
                                  {nomeDaQuadra}
                                </h4>
                                <p className="text-sm text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                                  <span className="font-mono text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded text-xs">
                                    ⏰ {b.horaInicio} às {b.horaFim}
                                  </span>
                                  {b.motivo && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="italic text-slate-400 text-xs">
                                        {b.motivo}
                                      </span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeletarBloqueio(
                                  b.id,
                                  dataFormatadaSegura,
                                  nomeDaQuadra,
                                )
                              }
                              className="self-start sm:self-auto text-xs font-bold text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
                            >
                              Remover Bloqueio
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* FLUXO DE CAIXA */}
            {aba === "caixa" && caixa && (
              <div className="space-y-12">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 py-4 border-b border-slate-200/80">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-400 block mb-1">
                      Período Selecionado
                    </span>
                    <span className="text-3xl sm:text-5xl font-light text-orange-600 font-mono tracking-tighter">
                      R$ {totalFiltradoPorPeriodo.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-400 block mb-1">
                      Acumulado Histórico
                    </span>
                    <span className="text-3xl sm:text-5xl font-light text-slate-900 font-mono tracking-tighter">
                      R$ {caixa.total.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-400 block mb-1">
                      Volume de Vendas
                    </span>
                    <span className="text-3xl sm:text-5xl font-light text-slate-700 font-mono tracking-tighter">
                      {paymentsFiltradosPorPeriodo.length}{" "}
                      <span className="text-sm text-slate-400 font-normal font-sans">
                        itens
                      </span>
                    </span>
                  </div>
                </div>

                <div className="py-4 w-full min-w-0">
                  <div className="mb-6">
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Curva de Ganhos
                    </h3>
                    <p className="text-slate-400 text-sm font-light">
                      Evolução do faturamento bruto por dia
                    </p>
                  </div>

                  {dadosGrafico.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-sm text-slate-400 font-light">
                      Nenhum dado financeiro mapeado no filtro ativo.
                    </div>
                  ) : (
                    <div className="h-60 w-full pr-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={dadosGrafico}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `R$${v}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1e2221",
                              borderColor: "#1e2221",
                              borderRadius: "12px",
                              color: "#fff",
                              padding: "12px",
                            }}
                            labelStyle={{
                              color: "rgba(255,255,255,0.6)",
                              fontSize: "11px",
                              marginBottom: "4px",
                            }}
                            itemStyle={{
                              color: "#f97316",
                              fontSize: "14px",
                              fontWeight: "bold",
                            }}
                            formatter={(value) => [
                              `R$ ${value.toFixed(2)}`,
                              "Faturamento",
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="faturamento"
                            stroke="#ea580c"
                            strokeWidth={2.5}
                            fillOpacity={0.04}
                            fill="#ea580c"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-1">
                    Entradas Registradas
                  </h3>

                  <div className="divide-y divide-slate-200/60">
                    {paymentsFiltradosPorPeriodo.length === 0 ? (
                      <p className="text-slate-400 text-base py-6 font-light">
                        Sem transações no período.
                      </p>
                    ) : (
                      paymentsFiltradosPorPeriodo.map((p) => (
                        <div
                          key={p.id}
                          className="py-4 px-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base group hover:bg-slate-200/30 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-4 sm:gap-6">
                            <span className="text-sm font-mono text-slate-400 w-16 font-bold shrink-0">
                              {formatarDataLateral(p.booking.data)}
                            </span>
                            <div>
                              <p className="font-extrabold text-slate-900 text-base">
                                {p.booking.court?.nome || "Quadra"}
                              </p>
                              <p className="text-sm text-slate-500 mt-0.5">
                                👤{" "}
                                {p.booking.nomeAvulso ||
                                  p.booking.user?.nome ||
                                  "Usuário"}{" "}
                                <span className="mx-2 text-slate-300">•</span>{" "}
                                <span className="font-mono uppercase text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                  {p.metodo}
                                </span>
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-extrabold text-orange-600 text-base pl-20 sm:pl-0">
                            + R$ {p.valor.toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TOAST DE AVISO */}
      {aviso.aberto && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md max-w-md bg-white ${
              aviso.tipo === "sucesso"
                ? "border-emerald-100"
                : "border-rose-100"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                aviso.tipo === "sucesso"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {aviso.tipo === "sucesso" ? (
                <span className="font-extrabold text-lg">✓</span>
              ) : (
                <span className="font-extrabold text-lg">✕</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-slate-900">
                {aviso.tipo === "sucesso" ? "Sucesso!" : "Ops, algo deu errado"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{aviso.mensagem}</p>
            </div>
            <button
              onClick={() => setAviso({ ...aviso, aberto: false })}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO */}
      {modalConfirmar.aberto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
                !
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Confirmar Cancelamento
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed px-2">
                  {modalConfirmar.texto}
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setModalConfirmar({ aberto: false, id: null, texto: "" })
                }
                className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-extrabold hover:bg-slate-100 transition-colors shadow-sm"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={confirmarAcaoDeletar}
                className="w-full py-3 bg-rose-600 text-white rounded-xl text-sm font-extrabold hover:bg-rose-700 transition-colors shadow-md shadow-rose-100"
              >
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
