import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Camera, Key, CheckCircle, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';

function BaterPonto() {
  const webcamRef = useRef(null);
  const [modo, setModo] = useState('face'); // 'face' or 'codigo'
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Geolocation state
  const [localizacao, setLocalizacao] = useState(null);
  const [locErro, setLocErro] = useState(null);

  useEffect(() => {
    // Solicita localização o mais cedo possível
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocalizacao({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocErro(null);
        },
        (error) => {
          setLocErro("Permissão de localização negada ou indisponível.");
          toast.warning("Para controle de fraude, ative a Localização do navegador.", { autoClose: false });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocErro("Geolocalização não suportada por este navegador.");
    }
  }, []);

  const captureFace = useCallback(async () => {
    if (!webcamRef.current) return;
    
    setLoading(true);
    const imageSrc = webcamRef.current.getScreenshot();
    
    try {
      const fetchResponse = await fetch(imageSrc);
      const blob = await fetchResponse.blob();
      
      const formData = new FormData();
      formData.append('foto', blob, 'foto.jpg');
      
      if (localizacao) {
          formData.append('lat', localizacao.lat);
          formData.append('lng', localizacao.lng);
      }

      const response = await axios.post('http://127.0.0.1:8000/bater-ponto/face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      mostrarSucesso(response.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao reconhecer a face. Ajuste a iluminação ou use o código.");
    } finally {
      setLoading(false);
    }
  }, [webcamRef, localizacao]);

  const handleCodigoSubmit = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;

    setLoading(true);
    try {
      const payload = { codigo };
      if (localizacao) {
          payload.lat = localizacao.lat;
          payload.lng = localizacao.lng;
      }
      
      const response = await axios.post('http://127.0.0.1:8000/bater-ponto/codigo', payload);
      mostrarSucesso(response.data);
      setCodigo('');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Código inválido ou erro de servidor.");
    } finally {
      setLoading(false);
    }
  };

  const mostrarSucesso = (data) => {
      let tipoLegivel = data.tipo;
      if (data.tipo === 'ENTRADA') tipoLegivel = "Entrada do Turno";
      if (data.tipo === 'SAIDA_ALMOCO') tipoLegivel = "Saída para o Almoço";
      if (data.tipo === 'RETORNO_ALMOCO') tipoLegivel = "Retorno do Almoço";
      if (data.tipo === 'SAIDA') tipoLegivel = "Saída Fim de Turno";

      toast.success(
          <div>
              <strong>{data.nome}</strong>, seu ponto foi registrado!<br/>
              <span className="text-sm">Tipo: {tipoLegivel}</span><br/>
              <span className="text-xs opacity-75">{data.horario}</span>
          </div>
      );
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10 border-b border-secondary-100 pb-8">
        <div>
            <h1 className="text-4xl font-black text-secondary-900 tracking-tight">
                Registrar <span className="text-primary-600">Ponto</span>
            </h1>
            <p className="text-secondary-500 font-medium mt-1 text-sm uppercase tracking-widest leading-none">Validação de Jornada Digital</p>
        </div>
        <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border shadow-sm ${localizacao ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            <MapPin size={14} className={localizacao ? 'animate-bounce' : ''} />
            {localizacao ? "GPS Ativo" : "GPS Bloqueado"}
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setModo('face')} 
          className={`flex-1 inline-flex justify-center items-center gap-3 py-4 px-6 rounded-2xl border-2 font-black transition-all text-sm uppercase tracking-widest ${
              modo === 'face' 
                  ? 'border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-100' 
                  : 'border-secondary-100 bg-white text-secondary-500 hover:bg-secondary-50'
          }`}
        >
          <Camera size={22} /> Face ID
        </button>
        <button 
          onClick={() => setModo('codigo')} 
          className={`flex-1 inline-flex justify-center items-center gap-3 py-4 px-6 rounded-2xl border-2 font-black transition-all text-sm uppercase tracking-widest ${
              modo === 'codigo' 
                  ? 'border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-100' 
                  : 'border-secondary-100 bg-white text-secondary-500 hover:bg-secondary-50'
          }`}
        >
          <Key size={22} /> Código
        </button>
      </div>

      <div className="card relative overflow-hidden pt-10 pb-8 bg-white/70 backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-2 h-full bg-primary-600"></div>
        
        {locErro && (
            <div className="bg-amber-50 border border-amber-100 text-amber-800 px-5 py-4 rounded-2xl mb-8 flex items-start gap-3">
                <div className="mt-0.5"><MapPin size={18} className="text-amber-600" /></div>
                <div className="text-sm font-medium leading-relaxed">
                    <strong className="block font-black uppercase tracking-widest text-xs mb-1">Aviso de Auditoria</strong>
                    {locErro} A marcação será sinalizada para o RH como "Sem Localização".
                </div>
            </div>
        )}

        {modo === 'face' ? (
          <div>
            <p className="text-secondary-500 mb-6 text-center font-medium">
              Posicione seu rosto dentro da moldura para validação biométrica.
            </p>
            <div className="bg-secondary-900 rounded-[2.5rem] overflow-hidden relative shadow-2xl mb-8 border-8 border-secondary-800 flex items-center justify-center min-h-[400px]">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                className="w-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-primary-500/40 rounded-full border-dashed animate-[spin_15s_linear_infinite]"></div>
                <div className="w-56 h-56 border border-white/10 rounded-[4rem] -mt-[17rem]"></div>
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-secondary-950/60 backdrop-blur-md p-6 border-t border-white/5 flex justify-center">
                 <div className="flex items-center gap-2 text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-ping"></div>
                    Scanner Biométrico Ativo
                 </div>
              </div>
            </div>
            
            <button onClick={captureFace} className="btn-primary w-full py-5 text-xl shadow-xl shadow-primary-200" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    VALIDANDO IDENTIDADE...
                </span>
              ) : (
                "BATER PONTO AGORA"
              )}
            </button>
          </div>
        ) : (
          <form onSubmit={handleCodigoSubmit}>
            <p className="text-secondary-500 mb-10 text-center font-medium">
              Insira a credencial alfanumérica de 6 dígitos.
            </p>
            
            <div className="mb-10 max-w-sm mx-auto relative group">
              <input 
                type="text" 
                className="input-field text-center text-5xl font-mono tracking-[0.2em] font-black uppercase text-secondary-900 py-8 bg-secondary-50 border-secondary-200" 
                placeholder="000000" 
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={6}
                required
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-secondary-900 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-lg">CREDENTIAL TOKEN</div>
            </div>
            
            <button type="submit" className="btn-primary w-full py-5 text-xl mt-4 shadow-xl shadow-primary-200" disabled={loading || codigo.length < 6}>
              {loading ? "PROCESSANDO TOKEN..." : "CONFIRMAR REGISTRO"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default BaterPonto;
