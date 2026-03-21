import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, MapPin, User, LogOut, Download, PieChart, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PerfilUsuario = () => {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userName = localStorage.getItem('user_name');

  useEffect(() => {
    const token = localStorage.getItem('user_token');
    if (!token) {
      navigate('/login-colaborador');
      return;
    }

    const fetchHistorico = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/me/historico', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistorico(response.data);
      } catch (err) {
        toast.error("Sessão expirada. Faça login novamente.");
        localStorage.clear();
        navigate('/login-colaborador');
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    toast.info("Até logo!");
    navigate('/');
  };

  const exportarPDF = () => {
    if (historico.length === 0) {
      toast.warning("Nenhum registro para exportar.");
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(30, 64, 175);
    doc.text("PontoE - Espelho de Ponto", 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Colaborador: ${userName}`, 14, 32);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 40);

    const tableColumn = ["Tipo de Registro", "Data e Hora", "Localização", "Status"];
    const tableRows = [];

    historico.forEach(item => {
      const rowData = [
        item.tipo.replace('_', ' '),
        item.hora,
        item.lat ? `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}` : "Sem GPS",
        "Confirmado"
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [30, 64, 175] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`Espelho_PontoE_${userName.replace(' ', '_')}.pdf`);
    toast.success("Documento PDF gerado com sucesso!");
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <div className="w-16 h-16 bg-primary-100 rounded-full mb-4"></div>
      <div className="h-4 w-48 bg-secondary-100 rounded"></div>
    </div>
  );

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b border-secondary-100 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-widest mb-3">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
            Portal do Colaborador
          </div>
          <h1 className="text-4xl font-black text-secondary-900 tracking-tight">
            Olá, <span className="text-primary-600">{userName}</span>
          </h1>
          <p className="text-secondary-500 font-medium">Veja seu desempenho e histórico de pontos.</p>
        </div>
        
        <button onClick={handleLogout} className="btn-secondary group">
           <LogOut size={20} className="group-hover:text-red-500 transition-colors" /> 
           Sair do Sistema
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white border-0 shadow-lg shadow-primary-200">
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <TrendingUp size={24} />
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-widest opacity-70">Mês Atual</div>
                    <div className="text-2xl font-black italic tracking-tighter">Março 2026</div>
                </div>
            </div>
            <div className="mb-2 text-sm font-medium opacity-80">Saldo Banco de Horas</div>
            <div className="text-5xl font-black tracking-tighter">+12:45</div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Clock size={14} /> 100% dos pontos validados
            </div>
        </div>

        <div className="card col-span-1 lg:col-span-2 flex flex-col md:flex-row gap-8 items-center justify-around bg-secondary-50 border-secondary-200">
            <div className="text-center">
                <div className="text-secondary-400 text-xs font-bold uppercase tracking-widest mb-1">Total de Registros</div>
                <div className="text-4xl font-black text-secondary-900 tracking-tighter">{historico.length}</div>
            </div>
            <div className="h-full w-px bg-secondary-200 hidden md:block"></div>
            <div className="text-center">
                <div className="text-secondary-400 text-xs font-bold uppercase tracking-widest mb-1">Última Batida</div>
                <div className="text-xl font-black text-secondary-900 tracking-tight">
                    {historico[0]?.hora.split(' ')[1] || "N/A"}
                </div>
                <div className="text-xs font-bold text-primary-600 uppercase tracking-widest mt-1">
                    {historico[0]?.tipo || "SEM REGISTROS"}
                </div>
            </div>
            <div className="h-full w-px bg-secondary-200 hidden md:block"></div>
             <button onClick={exportarPDF} className="btn-secondary whitespace-nowrap bg-white hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-all shadow-sm">
                <Download size={20} /> Baixar Espelho PDF
             </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-secondary-100 text-secondary-600 rounded-xl">
                <Calendar size={20} />
            </div>
            <h2 className="text-xl font-black text-secondary-900 tracking-tight">Histórico de Movimentações</h2>
        </div>

        <div className="overflow-x-auto -mx-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-secondary-100 bg-secondary-50/50">
                <th className="py-4 px-8 text-xs font-bold text-secondary-400 uppercase tracking-widest">Informação</th>
                <th className="py-4 px-8 text-xs font-bold text-secondary-400 uppercase tracking-widest">Horário</th>
                <th className="py-4 px-8 text-xs font-bold text-secondary-400 uppercase tracking-widest">Localização</th>
                <th className="py-4 px-8 text-xs font-bold text-secondary-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-50">
              {historico.map((reg, idx) => (
                <tr key={idx} className="hover:bg-secondary-50 transition-colors group">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                            reg.tipo === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600' : 
                            reg.tipo.includes('ALMOCO') ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                        }`}>
                            <Clock size={16} />
                        </div>
                        <span className="font-bold text-secondary-700">{reg.tipo.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="py-5 px-8">
                    <div className="font-mono text-secondary-500 font-bold">{reg.hora}</div>
                  </td>
                  <td className="py-5 px-8">
                    {reg.lat ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-secondary-400 group-hover:text-primary-500 transition-colors">
                        <MapPin size={14} /> {reg.lat.toFixed(4)}, {reg.lng.toFixed(4)}
                      </div>
                    ) : (
                      <span className="text-xs text-secondary-300 italic">Sem GPS</span>
                    )}
                  </td>
                  <td className="py-5 px-8">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">
                        Confirmado
                    </span>
                  </td>
                </tr>
              ))}
              {historico.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-20 text-center text-secondary-400 italic">
                    Nenhum ponto registrado até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerfilUsuario;
