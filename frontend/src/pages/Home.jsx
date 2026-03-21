import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Clock, List, LayoutDashboard, ShieldCheck } from 'lucide-react';

function Home() {
  return (
    <div className="max-w-6xl mx-auto pt-12 pb-20 px-4">
      {/* Hero Section */}
      <div className="text-center mb-20 relative">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
        <div className="flex justify-center mb-8">
            <div className="p-5 bg-white rounded-[2.5rem] shadow-2xl shadow-primary-100 relative group">
                <div className="absolute inset-0 bg-primary-600 rounded-[2.5rem] scale-90 blur-xl opacity-20 group-hover:scale-100 transition-transform"></div>
                <Clock size={72} className="text-primary-600 relative" strokeWidth={2.5} />
            </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-secondary-900 tracking-tighter mb-6 leading-[0.9]">
          Controle de Ponto <br/> <span className="text-primary-600">Inteligente</span>.
        </h1>
        
        <p className="text-xl text-secondary-500 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
          Segurança absoluta com biometria facial e geolocalização. O sistema PontoE redefine a gestão de jornada para empresas modernas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Link to="/registrar" className="card group hover:-translate-y-2 transition-all duration-500 bg-white/50 backdrop-blur-sm border-secondary-100 hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-100">
          <div className="p-4 bg-primary-50 text-primary-600 rounded-2xl mb-6 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 w-fit">
            <UserPlus size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-secondary-900 mb-2 tracking-tight">Novos Talentos</h2>
          <p className="text-secondary-500 text-sm font-medium leading-relaxed">
            Cadastre novos colaboradores e configure biometria facial em segundos.
          </p>
        </Link>
        
        <Link to="/bater-ponto" className="card group hover:-translate-y-2 transition-all duration-500 relative overflow-hidden bg-primary-600 border-0 shadow-lg shadow-primary-200">
          <div className="absolute top-0 right-0 bg-white/20 text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-bl-xl backdrop-blur-md">
            GPS ATIVO
          </div>
          <div className="p-4 bg-white text-primary-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500 w-fit">
            <Clock size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Registrar Ponto</h2>
          <p className="text-primary-100 text-sm font-medium leading-relaxed">
            Marcação oficial com reconhecimento facial e validação geográfica instantânea.
          </p>
        </Link>
        
        <Link to="/login-colaborador" className="card group hover:-translate-y-2 transition-all duration-500 bg-white/50 backdrop-blur-sm border-secondary-100 hover:border-violet-200 hover:shadow-2xl hover:shadow-indigo-100">
          <div className="p-4 bg-secondary-100 text-secondary-600 rounded-2xl mb-6 group-hover:bg-secondary-800 group-hover:text-white transition-all duration-500 w-fit">
            <ShieldCheck size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-secondary-900 mb-2 tracking-tight">Meu Portal</h2>
          <p className="text-secondary-500 text-sm font-medium leading-relaxed">
            Consulte seu espelho de ponto, saldo de banco de horas e comprovantes.
          </p>
        </Link>

        <Link to="/dashboard" className="card group hover:-translate-y-2 transition-all duration-500 bg-white/50 backdrop-blur-sm border-secondary-100 hover:border-secondary-300">
          <div className="p-4 bg-secondary-50 text-secondary-400 rounded-2xl mb-6 group-hover:bg-secondary-200 group-hover:text-secondary-900 transition-all duration-500 w-fit">
            <LayoutDashboard size={32} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-secondary-900 mb-2 tracking-tight">Gestão RH</h2>
          <p className="text-secondary-500 text-sm font-medium leading-relaxed">
            Visão completa do time, relatórios avançados e análise de frequência.
          </p>
        </Link>

      </div>

      <div className="mt-20 p-8 glass rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                    <div className="w-12 h-12 rounded-full border-4 border-white bg-primary-100 flex items-center justify-center font-bold text-primary-600">JS</div>
                    <div className="w-12 h-12 rounded-full border-4 border-white bg-amber-100 flex items-center justify-center font-bold text-amber-600">MA</div>
                    <div className="w-12 h-12 rounded-full border-4 border-white bg-emerald-100 flex items-center justify-center font-bold text-emerald-600">RL</div>
                </div>
                <div className="text-sm font-bold text-secondary-600">
                   Junte-se a mais de <span className="text-primary-600 font-black">500+ empresas</span> <br/> que confiam no PontoE.
                </div>
            </div>
            <div className="flex gap-4">
                <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-secondary-400 uppercase tracking-widest">Segurança Bancária</div>
                    <div className="text-sm font-black text-secondary-900 tracking-tight">Criptografia AES-256</div>
                </div>
                <div className="w-px h-10 bg-secondary-100 hidden sm:block"></div>
                <div className="flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black tracking-widest border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                    SISTEMA ONLINE
                </div>
            </div>
      </div>
    </div>
  );
}

export default Home;
