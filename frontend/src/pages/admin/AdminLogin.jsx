import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    try {
      const res = await api.post("/auth/admin/login", { email, senha });
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));
      navigate("/admin");
    } catch (_err) {
      setErro("Credenciais inválidas.");
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        {/* Header da marca */}
        <div className="text-center mb-8">
          <h1 className="font-black text-3xl tracking-tighter text-[#1e2221]">
            Pahragon
          </h1>
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-teal-600 mt-1">
            Painel de Administração
          </h2>
        </div>

        {erro && (
          <div className="mb-6 p-3 bg-rose-50 text-rose-600 text-sm font-bold text-center rounded-xl border border-rose-100">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full px-5 py-4 bg-[#f8f9fa] border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition placeholder-slate-400 text-slate-700"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full px-5 py-4 bg-[#f8f9fa] border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition placeholder-slate-400 text-slate-700"
            type="password"
            placeholder="Senha"
            value={senha} // <--- Aqui estava 'email', altere para 'senha'
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-4 bg-[#1e2221] text-white font-bold rounded-2xl hover:bg-black transition-all active:scale-[0.98]"
          >
            Acessar Sistema
          </button>
        </form>
      </div>
    </div>
  );
}
