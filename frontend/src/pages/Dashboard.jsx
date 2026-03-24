import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { List, Clock, LogIn, LogOut, Coffee, Download, RefreshCw, BarChart2, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function Dashboard() {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mocks simple authentication state for demonstration
  // Real implementation will verify JWT token
  const [autenticado, setAutenticado] = useState(false);
  const [senhaAdmin, setSenhaAdmin] = useState('');

  useEffect(() => {
    if (autenticado) {
      carregarHistorico();
    }
  }, [autenticado]);

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await axios.get('/api/historico', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistorico(res.data);
    } catch (err) {
      toast.error("Erro ao carregar o histórico de pontos da API.");
      if (err.response?.status === 401 || err.response?.status === 403) {
          setAutenticado(false);
          localStorage.removeItem('admin_token');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAdmin = async (e) => {
      e.preventDefault();
      try {
          const formData = new FormData();
          formData.append('senha', senhaAdmin.trim());
          const res = await axios.post('/api/login', formData);
          
          localStorage.setItem('admin_token', res.data.access_token);
          setAutenticado(true);
          toast.success("Acesso Administrativo Autorizado.");
      } catch (err) {
          toast.error(err.response?.data?.detail || "Senha Incorreta ou Erro de Servidor.");
      }
  };

  useEffect(() => {
    // Para depuração ou se o usuário quiser que a senha seja pedida sempre,
    // podemos comentar este useEffect. Por padrão, ele verifica o token.
    // Mas conforme solicitado pelo usuário, vamos exigir senha no acesso inicial do componente.
    const token = localStorage.getItem('admin_token');
    if (token) {
        // setAutenticado(true); // Comentado para forçar a tela de login ao atualizar
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAutenticado(false);
    toast.info("Sessão Administrativa Encerrada.");
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175);
    doc.text("PontoE - Relatório de Frequência", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

    const tableColumn = ["Funcionário", "Data e Hora", "Tipo de Registro"];
    const tableRows = [];

    historico.forEach(item => {
      const ticketData = [
        item.nome,
        formatarDataHora(item.hora),
        item.tipo
      ];
      tableRows.push(ticketData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [30, 64, 175] }
    });

    doc.save(`Relatorio_PontoE_${new Date().getTime()}.pdf`);
    toast.success("PDF gerado e iniciado download!");
  };

  const exportarExcel = () => {
    const dataParaExcel = historico.map(item => ({
        "Funcionário": item.nome,
        "Data e Hora": formatarDataHora(item.hora),
        "Tipo de Registro": item.tipo
    }));

    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório PontoE");
    XLSX.writeFile(wb, `Relatorio_PontoE_${new Date().getTime()}.xlsx`);
    toast.success("Excel gerado e iniciado download!");
  };

  const TraduzirTipo = (tipo) => {
    switch (tipo) {
      case 'ENTRADA': return <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full text-sm"><LogIn size={14} /> Entrada</span>;
      case 'SAIDA_ALMOCO': return <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold bg-amber-50 px-3 py-1 rounded-full text-sm"><Coffee size={14} /> Saída Almoço</span>;
      case 'RETORNO_ALMOCO': return <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full text-sm"><LogIn size={14} /> Retorno Almoço</span>;
      case 'SAIDA': return <span className="inline-flex items-center gap-1.5 text-secondary-600 font-semibold bg-secondary-100 px-3 py-1 rounded-full text-sm"><LogOut size={14} /> Saída</span>;
      default: return tipo;
    }
  };

  const formatarDataHora = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Prepara dados para o Gráfico de Barras (Contagem de tipos)
  const chartData = [
      { name: 'Entradas', value: historico.filter(h => h.tipo === 'ENTRADA' || h.tipo === 'RETORNO_ALMOCO').length },
      { name: 'Saídas', value: historico.filter(h => h.tipo === 'SAIDA' || h.tipo === 'SAIDA_ALMOCO').length },
  ];

  if (!autenticado) {
      return (
          <div className="max-w-md mx-auto py-20 px-4">
              <div className="card text-center py-12 relative overflow-hidden bg-white/70 backdrop-blur-md">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-primary-600"></div>
                  <div className="mx-auto w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-primary-100/50">
                      <ShieldCheck size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-secondary-900 mb-3 tracking-tight">Portal <span className="text-primary-600">Gestor</span></h2>
                  <p className="text-secondary-500 mb-10 font-medium px-4">Área restrita para administração de recursos humanos e auditoria de jornada.</p>
                  
                  <form onSubmit={handleLoginAdmin} className="px-4">
                      <div className="relative mb-6">
                        <input 
                            type="password" 
                            placeholder="Senha (RHadmin@)"
                            className="input-field text-center text-lg font-bold py-4 bg-secondary-50 border-secondary-200"
                            value={senhaAdmin}
                            onChange={(e) => setSenhaAdmin(e.target.value)}
                            required
                        />
                      </div>
                      <button type="submit" className="btn-primary w-full py-4 text-lg shadow-xl shadow-primary-100 uppercase tracking-widest font-black">
                          AUTENTICAR ACESSO
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12 border-b border-secondary-100 pb-10">
        <div>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">Sistema de Gestão Ativo</span>
            </div>
            <h1 className="text-5xl font-black text-secondary-900 tracking-tighter">
                Inteligência <span className="text-primary-600">RH</span>
            </h1>
            <p className="text-secondary-500 font-medium mt-2 text-base max-w-lg">Auditoria em tempo real de fluxos, frequências e conformidade de jornada de trabalho.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
            <button onClick={carregarHistorico} className="btn-secondary group">
                <RefreshCw size={18} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? "animate-spin" : ""}`} /> 
                <span className="uppercase tracking-widest font-black text-xs">Sincronizar</span>
            </button>
            <button onClick={exportarPDF} className="btn-primary bg-secondary-900 hover:bg-secondary-800 border-secondary-700 shadow-secondary-100" disabled={loading || historico.length === 0}>
                <Download size={18} /> <span className="uppercase tracking-widest font-black text-xs">Exportar PDF</span>
            </button>
            <button onClick={exportarExcel} className="btn-primary bg-emerald-600 hover:bg-emerald-500 border-emerald-500 shadow-emerald-100" disabled={loading || historico.length === 0}>
                <Download size={18} /> <span className="uppercase tracking-widest font-black text-xs">Excel</span>
            </button>
            <button onClick={handleLogout} className="btn-secondary border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                <LogOut size={18} /> <span className="uppercase tracking-widest font-black text-xs">Sair</span>
            </button>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 mb-12">
          <div className="xl:col-span-3 card relative overflow-hidden bg-white/40 backdrop-blur-sm border-secondary-100/50">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-300"></div>
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black text-secondary-900 flex items-center gap-3 tracking-tight">
                    <div className="p-2 bg-primary-50 text-primary-600 rounded-xl"><BarChart2 size={24} /></div>
                    Volume de Interações
                </h3>
                <div className="text-[10px] font-black text-secondary-400 uppercase tracking-widest px-3 py-1 bg-secondary-50 rounded-full border border-secondary-100">Últimas 24h</div>
              </div>
              <div className="h-[300px] w-full">
                {historico.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#64748b', fontSize: 11, fontWeight: 700}}
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#64748b', fontSize: 11, fontWeight: 700}}
                            />
                            <RechartsTooltip 
                                cursor={{fill: '#f8fafc'}} 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                itemStyle={{fontWeight: 800, fontSize: '12px'}}
                            />
                            <Bar dataKey="value" radius={[12, 12, 4, 4]} barSize={60}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#818cf8'} fillOpacity={0.9} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-secondary-400 gap-3">
                        <div className="w-16 h-1 bg-secondary-100 rounded-full"></div>
                        <p className="font-bold text-sm uppercase tracking-widest opacity-50">Dados Insuficientes</p>
                    </div>
                )}
              </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-8">
              <div className="card group hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-center bg-white border-secondary-100 shadow-xl shadow-secondary-100/20">
                  <div className="absolute top-4 right-4 p-2 bg-emerald-50 text-emerald-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Clock size={16} />
                  </div>
                  <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] mb-3">Marcações Hoje</p>
                  <p className="text-6xl font-black text-secondary-900 tracking-tighter">
                      {historico.filter(h => new Date(h.hora).toDateString() === new Date().toDateString()).length}
                  </p>
                  <div className="w-12 h-1.5 bg-emerald-500 mt-6 rounded-full"></div>
              </div>
              <div className="card group hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-center bg-primary-600 border-primary-500 shadow-2xl shadow-primary-200/40 relative overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 text-white/5 group-hover:scale-110 transition-transform duration-700">
                    <BarChart2 size={160} />
                  </div>
                  <p className="text-[10px] font-black text-primary-200 uppercase tracking-[0.2em] mb-3 relative z-10">Base Histórica</p>
                  <p className="text-6xl font-black text-white tracking-tighter relative z-10">{historico.length}</p>
                  <div className="w-12 h-1.5 bg-white mt-6 rounded-full relative z-10"></div>
              </div>
          </div>
      </div>

      {/* Main Table */}
      <div className="card overflow-hidden p-0 bg-white/80 backdrop-blur-md border-secondary-100 shadow-2xl shadow-secondary-200/20">
        <div className="px-8 py-6 border-b border-secondary-100 flex items-center justify-between bg-white/50">
            <h3 className="text-lg font-black text-secondary-900 uppercase tracking-widest flex items-center gap-3">
                <List size={20} className="text-primary-600" /> Histórico Operacional
            </h3>
            <div className="text-xs font-bold text-secondary-400">{historico.length} Registros Encontrados</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-[0.25em]">Colaborador</th>
                <th className="px-8 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-[0.25em]">Estampa do Tempo</th>
                <th className="px-8 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-[0.25em]">Natureza do Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {loading && historico.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
                        <span className="text-xs font-black text-secondary-400 uppercase tracking-widest">Sincronizando Datacenter...</span>
                    </div>
                  </td>
                </tr>
              ) : historico.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                        <BarChart2 size={48} className="text-secondary-300" />
                        <span className="text-xs font-black text-secondary-400 uppercase tracking-widest">Nenhum registro encontrado</span>
                    </div>
                  </td>
                </tr>
              ) : (
                historico.map((item, index) => (
                  <tr key={index} className="hover:bg-primary-50/30 transition-colors group">
                    <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center text-secondary-500 font-bold text-sm uppercase group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                {item.nome.charAt(0)}
                            </div>
                            <div>
                                <div className="font-extrabold text-secondary-900 group-hover:text-primary-700 transition-colors">{item.nome}</div>
                                <div className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-0.5">ID: {item.nome.toLowerCase().replace(' ', '')}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-secondary-600 font-bold text-sm">
                        <Clock size={16} className="text-secondary-300 group-hover:text-primary-400" />
                        {formatarDataHora(item.hora)}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      {TraduzirTipo(item.tipo)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
