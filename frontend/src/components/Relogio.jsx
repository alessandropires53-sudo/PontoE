import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const Relogio = () => {
  const [hora, setHora] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setHora(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatarHora = (date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatarData = (date) => {
    const opcoes = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('pt-BR', opcoes).replace('.', '');
  };

  return (
    <div className="flex flex-col items-center sm:items-end transition-all duration-300 hover:scale-105 group cursor-default">
      <div className="text-3xl sm:text-4xl font-black text-secondary-900 tracking-tighter flex items-center gap-2 tabular-nums">
        <Clock className="text-primary-600 animate-pulse group-hover:rotate-12 transition-transform duration-500" size={32} />
        <span className="group-hover:text-primary-600 transition-colors duration-300">
            {formatarHora(hora)}
        </span>
      </div>
      <div className="text-sm font-bold uppercase tracking-widest text-secondary-400 group-hover:text-primary-400 transition-colors duration-300">
        {formatarData(hora)}
      </div>
    </div>
  );
};

export default Relogio;
