import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Pega o token direto da URL: ?token=XXXXXX
  const token = searchParams.get("token");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    // Reutiliza a validação de Senha Forte que criamos no cadastro
    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!senhaRegex.test(senha)) {
      setErro("A senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais.");
      return;
    }

    try {
      // Envia o token e a nova senha pro seu back-end atualizar no banco
      await api.post("/auth/reset-password", { token, senha });
      
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate("/login");
      }, 3000);
    } catch (_err) {
      const msg = _err.response?.data?.message || _err.response?.data?.error;
      setErro(msg || "O link de recuperação expirou ou é inválido.");
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4 relative">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Nova Senha</h1>
          <p className="text-slate-500 text-sm mt-1">Crie uma nova senha de acesso para sua conta.</p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          {erro && <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm px-4 py-3 rounded-xl mb-6 font-medium">{erro}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
              <input
                className="w-full mt-1.5 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            <button className="w-full bg-[#1e2221] hover:bg-black text-white font-bold py-3.5 rounded-xl transition shadow-sm cursor-pointer" type="submit">
              Alterar Senha
            </button>
          </form>
        </div>
      </div>

      {/* Toast Bonito de Sucesso */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-4 rounded-3xl shadow-2xl border border-slate-100/80 backdrop-blur-xl flex items-start gap-4 max-w-sm bg-white/95">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="flex-1 pr-1">
              <p className="text-sm font-black text-slate-950 tracking-tight">Senha alterada!</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Sua nova senha já está ativa. Fazendo redirecionamento...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}