import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Camera, RefreshCw, CheckCircle, Save, Keyboard, ShieldCheck, Upload } from 'lucide-react';
import { toast } from 'react-toastify';

function Registrar() {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [modo, setModo] = useState('facial'); // 'facial' or 'manual'
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [imgSrc, setImgSrc] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [codigoUnico, setCodigoUnico] = useState('');

  const capture = useCallback(() => {
    if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgSrc(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error('Por favor, informe o nome.');
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('nome', nome);
      formData.append('cpf', cpf);
      formData.append('email', email);
      
      if (modo === 'facial' && imgSrc) {
          const fetchResponse = await fetch(imgSrc);
          const blob = await fetchResponse.blob();
          formData.append('foto', blob, 'foto.jpg');
      }

      const response = await axios.post('/api/registrar-usuario', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setCodigoUnico(response.data.codigo_unico);
      toast.success(response.data.mensagem || 'Usuário Registrado com Sucesso!');
      
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10 border-b border-secondary-100 pb-8">
        <div>
            <h1 className="text-4xl font-black text-secondary-900 tracking-tight">
                Novos <span className="text-primary-600">Talentos</span>
            </h1>
            <p className="text-secondary-500 font-medium mt-1 text-sm uppercase tracking-widest">Painel de Admissão Digital</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-secondary-400 bg-secondary-50 px-3 py-1.5 rounded-full border border-secondary-100">
            <ShieldCheck size={14} className="text-primary-500" /> Criptografia Ponta-a-Ponta
        </div>
      </div>
      
      {codigoUnico ? (
        <div className="card text-center bg-emerald-50/50 border-emerald-200 shadow-2xl shadow-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
          <CheckCircle size={80} className="mx-auto text-emerald-500 mb-6" />
          <h2 className="text-4xl font-black text-emerald-900 mb-4 tracking-tight text-center">Registro Concluído!</h2>
          <p className="text-emerald-700 font-medium mb-10 max-w-xl mx-auto text-center">
            {modo === 'manual' 
                ? "Este colaborador usará o CPF/E-mail e o código abaixo para seu primeiro acesso."
                : "A biometria facial foi treinada. O código abaixo serve como backup de segurança."
            }
          </p>
          <div className="bg-white mx-auto w-full max-w-sm px-12 py-8 rounded-3xl shadow-xl border border-emerald-100 mb-10 relative">
            <span className="text-6xl font-mono font-black tracking-[0.2em] text-secondary-900">
                {codigoUnico}
            </span>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] uppercase font-black px-4 py-1 rounded-full shadow-lg">CÓDIGO ÚNICO</div>
          </div>
          <button onClick={() => window.location.reload()} className="btn-primary w-full sm:w-auto px-12">
            REGISTRAR OUTRO COLABORADOR
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
                type="button"
                onClick={() => setModo('facial')} 
                className={`flex-1 inline-flex justify-center items-center gap-3 py-4 px-6 rounded-2xl border-2 font-black transition-all text-sm uppercase tracking-widest ${
                    modo === 'facial' 
                        ? 'border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-200' 
                        : 'border-secondary-100 bg-white text-secondary-500 hover:bg-secondary-50 hover:border-secondary-300'
                }`}
            >
                <Camera size={22} /> BIOMETRIA FACIAL
            </button>
            <button 
                type="button"
                onClick={() => { setModo('manual'); setImgSrc(null); }} 
                className={`flex-1 inline-flex justify-center items-center gap-3 py-4 px-6 rounded-2xl border-2 font-black transition-all text-sm uppercase tracking-widest ${
                    modo === 'manual' 
                        ? 'border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-200' 
                        : 'border-secondary-100 bg-white text-secondary-500 hover:bg-secondary-50 hover:border-secondary-300'
                }`}
            >
                <Keyboard size={22} /> DADOS MANUAIS
            </button>
          </div>

          <form onSubmit={handleRegister} className="card relative overflow-hidden bg-white/70 backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary-600"></div>
              
              <div className="mb-10">
                <label className="block text-xs font-black text-secondary-400 uppercase tracking-widest mb-3 ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  className="input-field text-lg font-bold" 
                  placeholder="Nome do colaborador" 
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                  <div>
                      <label className="block text-xs font-black text-secondary-400 uppercase tracking-widest mb-3 ml-1">CPF (Obrigatório)</label>
                      <input 
                          type="text" 
                          className="input-field font-mono font-bold" 
                          placeholder="000.000.000-00" 
                          value={cpf}
                          onChange={(e) => setCpf(e.target.value)}
                          required
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-black text-secondary-400 uppercase tracking-widest mb-3 ml-1">E-mail Corporativo</label>
                      <input 
                          type="email" 
                          className="input-field font-bold" 
                          placeholder="exemplo@empresa.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                      />
                  </div>
              </div>
              
              {modo === 'facial' && (
                  <div className="mb-10">
                    <label className="block text-xs font-black text-secondary-400 uppercase tracking-widest mb-4 ml-1">Reconhecimento Biométrico</label>
                    <div className="bg-secondary-900 rounded-[2.5rem] overflow-hidden relative shadow-2xl min-h-[400px] border-8 border-secondary-800 flex items-center justify-center">
                      {imgSrc ? (
                        <div className="w-full h-full relative">
                            <img src={imgSrc} alt="Foto tirada" className="w-full h-auto object-cover opacity-90" />
                            <div className="absolute inset-0 bg-gradient-to-t from-secondary-950 via-transparent flex flex-col justify-end p-8">
                                <div className="p-4 bg-emerald-500/20 backdrop-blur-md rounded-2xl border border-emerald-500/30 mb-6 flex items-center gap-3">
                                    <div className="p-1.5 bg-emerald-500 rounded-full text-white"><CheckCircle size={14} /></div>
                                    <span className="text-white text-sm font-bold tracking-tight">FACE CARREGADA COM SUCESSO</span>
                                </div>
                                <button type="button" onClick={retake} className="btn-secondary w-full bg-secondary-800 text-white border-secondary-700 hover:bg-secondary-700">
                                    <RefreshCw size={20} /> DESCARTAR E REFAZER
                                </button>
                            </div>
                        </div>
                      ) : (
                        <div className="w-full h-full relative group">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                                className="w-full h-auto opacity-70"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="w-64 h-64 border-2 border-primary-500/50 rounded-full border-dashed animate-[spin_10s_linear_infinite]"></div>
                                <div className="w-48 h-48 border-2 border-primary-400/80 rounded-[3rem] -mt-56 flex items-center justify-center font-black text-primary-500/20 text-[10px] uppercase tracking-widest">
                                     Scan Facial
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-secondary-950/80 backdrop-blur-md p-6 flex flex-col sm:flex-row gap-4 justify-center border-t border-white/20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                                <button type="button" onClick={capture} className="btn-primary px-10 group-hover:scale-105 transition-transform">
                                    <Camera size={20} /> CAPTURAR DA CAMERA
                                </button>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload}
                                />
                                <button type="button" onClick={() => fileInputRef.current.click()} className="btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20">
                                    <Upload size={20} /> ENVIAR ARQUIVO FOTO
                                </button>
                            </div>
                        </div>
                      )}
                    </div>
                  </div>
              )}
              
              <div className="mt-12 pt-8 border-t border-secondary-100">
                <button 
                  type="submit" 
                  className="btn-primary w-full text-xl py-5 shadow-xl shadow-primary-100" 
                  disabled={loading || !nome || (modo === 'facial' && !imgSrc)}
                >
                  {loading ? (
                    <span className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        CRIPTOGRAFANDO DADOS...
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                        <Save size={24} /> FINALIZAR ADMISSÃO DIGITAL
                    </span>
                  )}
                </button>
              </div>

          </form>
        </div>
      )}
    </div>
  );
}

export default Registrar;
