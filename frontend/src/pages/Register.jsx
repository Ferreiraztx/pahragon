import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

export default function Register() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
  });
  const [erro, setErro] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    try {
      await api.post("/auth/register", form);
      // Em vez de logar direto com dados vazios, avisa e manda fazer login
      alert("Conta criada com sucesso! Por favor, faça o seu login.");
      navigate("/login");
    } catch (_err) {
      setErro("Erro ao cadastrar. Verifique seus dados e tente novamente.");
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Identidade Visual Refinada */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-baseline gap-2 mb-4">
            <span className="font-black text-4xl tracking-tighter text-[#1e2221]">
              Pahragon
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-teal-600">
              Beach Tennis
            </span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Criar sua conta
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Junte-se à nossa comunidade no Santa Quitéria.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          {erro && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm px-4 py-3 rounded-xl mb-6 font-medium">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              {
                name: "nome",
                label: "Nome completo",
                type: "text",
                placeholder: "Ex: Matheus Leal",
              },
              {
                name: "email",
                label: "E-mail",
                type: "email",
                placeholder: "seu@email.com",
              },
              {
                name: "senha",
                label: "Senha",
                type: "password",
                placeholder: "••••••••",
              },
              {
                name: "telefone",
                label: "Telefone",
                type: "text",
                placeholder: "(41) 99999-9999",
              },
            ].map((field) => (
              <div key={field.name}>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  {field.label}
                </label>
                <input
                  className="w-full mt-1.5 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-300 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition"
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  onChange={handleChange}
                  required={field.name !== "telefone"}
                />
              </div>
            ))}

            <button
              className="w-full bg-[#1e2221] hover:bg-black text-white font-bold py-3.5 rounded-xl transition shadow-sm mt-2"
              type="submit"
            >
              Finalizar Cadastro
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Já possui acesso?{" "}
            <Link
              to="/login"
              className="text-teal-600 font-bold hover:underline"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
