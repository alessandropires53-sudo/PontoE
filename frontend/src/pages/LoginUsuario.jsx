import React, { useState } from 'react';
import axios from 'axios';
import { LogIn, UserCheck, ShieldCheck, Mail, User, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const LoginUsuario = () => {
  const [isPrimeiroAcesso, setIsPrimeiroAcesso] = useState(false);
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('identificador', identificador);
      formData.append('senha', senha);

      const response = await axios.post('http://127.0.0.1:8000/login-usuario', formData);
      localStorage.setItem('user_token', response.data.access_token);
      localStorage.setItem('user_name', response.data.nome || 'Funcionário');
      toast.success(`Bem-vindo, ${response.data.nome}!`);
      navigate('/meu-ponto');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao realizar login.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrimeiroAcesso = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('identificador', identificador);
      formData.append('nova_senha', senha);

      await axios.post('http://127.0.0.1:8000/primeiro-acesso', formData);
      toast.success("Senha cadastrada com sucesso! Agora você pode entrar.");
      setIsPrimeiroAcesso(false);
      setSenha('');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao configurar primeiro acesso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-4 bg-primary-100 text-primary-600 rounded-3xl mb-4 shadow-sm">
          {isPrimeiroAcesso ? <UserCheck size={32} /> : <ShieldCheck size={32} />}
        </div>
        <h1 className="text-3xl font-black text-secondary-900 tracking-tight">
          {isPrimeiroAcesso ? "Primeiro Acesso" : "Portal do Colaborador"}
        </h1>
        <p className="text-secondary-500 mt-2 font-medium">
          {isPrimeiroAcesso 
            ? "Configure sua senha usando seu E-mail ou CPF" 
            : "Acesse seu histórico e banco de horas"}
        </p>
      </div>

      <div className="card shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-400 to-primary-600"></div>
        
        <form onSubmit={isPrimeiroAcesso ? handlePrimeiroAcesso : handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-secondary-400 uppercase tracking-widest mb-2 ml-1">
              E-mail ou CPF
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors">
                <User size={20} />
              </span>
              <input 
                type="text" 
                className="input-field pl-12" 
                placeholder="Ex: joao@empresa.com"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary-400 uppercase tracking-widest mb-2 ml-1">
              {isPrimeiroAcesso ? "Nova Senha" : "Senha"}
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors">
                <Lock size={20} />
              </span>
              <input 
                type="password" 
                className="input-field pl-12" 
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full text-lg py-5 mt-4"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isPrimeiroAcesso ? "CADASTRAR SENHA" : "ENTRAR NO PORTAL"}
                <ArrowRight size={20} />
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-secondary-100 text-center">
            <button 
                onClick={() => setIsPrimeiroAcesso(!isPrimeiroAcesso)}
                className="text-primary-600 hover:text-primary-700 font-bold transition-colors text-sm underline decoration-primary-200 underline-offset-4"
            >
                {isPrimeiroAcesso 
                    ? "Já tenho senha, fazer login" 
                    : "É meu primeiro acesso, quero criar uma senha"}
            </button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-secondary-400 font-medium">
        Problemas com o acesso? Entre em contato com o RH.
      </div>
    </div>
  );
};

export default LoginUsuario;
