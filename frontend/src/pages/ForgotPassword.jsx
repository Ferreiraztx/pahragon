import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    try {
      // Usando o seu arquivo services/api padrão
      await api.post("/auth/forgot-password", { email });

      setSucesso(
        "Se o e-mail existir em nossa base, um link de recuperação será enviado em instantes.",
      );
      setEmail("");
    } catch (_err) {
      const msg = _err.response?.data?.message || _err.response?.data?.error;
      setErro(msg || "Erro ao processar a solicitação. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Recuperar Senha
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Digite seu e-mail para receber as instruções.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          {erro && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm px-4 py-3 rounded-xl mb-6 font-medium">
              {erro}
            </div>
          )}
          {sucesso && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-6 font-medium">
              {sucesso}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                E-mail cadastrado
              </label>
              <input
                className="w-full mt-1.5 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              className="w-full bg-[#1e2221] hover:bg-black text-white font-bold py-3.5 rounded-xl transition shadow-sm cursor-pointer"
              type="submit"
            >
              Enviar Link de Recuperação
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Lembrou a senha?{" "}
            <Link
              to="/login"
              className="text-teal-600 font-bold hover:underline"
            >
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
