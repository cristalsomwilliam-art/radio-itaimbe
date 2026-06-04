"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, KeyRound, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || "Erro ao fazer login. Verifique suas credenciais.");
      } else if (data.user) {
        router.push("/admin/dashboard");
      }
    } catch (err) {
      setErrorMsg("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 md:my-20">
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* Cabeçalho do Card */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary-500/10 border border-primary-500/25 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary-400" />
          </div>
          <h1 className="text-xl font-extrabold text-white uppercase tracking-wider">
            Painel Administrativo
          </h1>
          <p className="text-xs text-zinc-500 font-medium">
            Apenas usuários autorizados têm acesso à área de controle.
          </p>
        </div>

        {/* Alerta de erro */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-red-950/40 border border-red-500/30 p-3 rounded-lg text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Campo de Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400">Endereço de E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@radioitaimbe.com.br"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-normal"
              />
            </div>
          </div>

          {/* Campo de Senha */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400">Senha</label>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-normal"
              />
            </div>
          </div>

          {/* Botão de Enviar */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Entrar no Painel</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
