import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Clock, Home as HomeIcon, UserPlus, List } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './pages/Home';
import Registrar from './pages/Registrar';
import BaterPonto from './pages/BaterPonto';
import Dashboard from './pages/Dashboard';
import LoginUsuario from './pages/LoginUsuario';
import PerfilUsuario from './pages/PerfilUsuario';
import Relogio from './components/Relogio';

import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        {/* Sophisticated Navbar */}
        <nav className="glass sticky top-0 z-50 border-b border-secondary-100 py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-3 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-200 group-hover:scale-110 transition-transform">
                <Clock size={32} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-r from-secondary-900 to-primary-600">PontoE</span>
                <span className="text-xs font-bold text-primary-500 uppercase tracking-widest leading-none mt-1">Smart Control</span>
              </div>
            </Link>
            
            <div className="hidden lg:flex items-center gap-10">
              <div className="flex gap-8 border-r border-secondary-100 pr-10 mr-4">
                <Link to="/" className="nav-link">
                   Início
                </Link>
                <Link to="/registrar" className="nav-link">
                   Novo Colaborador
                </Link>
                <Link to="/bater-ponto" className="nav-link">
                   Registrar Ponto
                </Link>
                <Link to="/dashboard" className="nav-link">
                   Painel RH
                </Link>
              </div>
              
              <div className="flex items-center gap-8">
                 <Link to="/login-colaborador" className="btn-secondary py-3.5 px-8 text-base">
                    <UserPlus size={22} /> Acesso Colaborador
                 </Link>
                 <Relogio />
              </div>
            </div>

            {/* Mobile Clock Only */}
            <div className="lg:hidden">
                <Relogio />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/registrar" element={<Registrar />} />
              <Route path="/bater-ponto" element={<BaterPonto />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login-colaborador" element={<LoginUsuario />} />
              <Route path="/meu-ponto" element={<PerfilUsuario />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} PontoE. Todos os direitos reservados. Feito para Solides Clone.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;