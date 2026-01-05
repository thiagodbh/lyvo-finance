import React, { useState, useEffect } from 'react';
import { MessageCircle, PieChart, Calendar, User, Settings, LogOut } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import FinanceDashboard from './components/FinanceDashboard';
import AgendaView from './components/AgendaView';
import LandingPage from './components/LandingPage';
import { AppTab } from './types';
import { auth } from './services/firebase'; // IMPORTANTE
import { onAuthStateChanged, signOut } from 'firebase/auth'; // IMPORTANTE

const ProfileScreen = ({ onLogout }: { onLogout: () => void }) => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6">
    <div className="w-24 h-24 bg-lyvo-primary rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
      <User className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-bold text-gray-800">Meu Perfil</h2>
    <div className="mt-8 w-full max-w-xs space-y-3">
      <button onClick={onLogout} className="w-full bg-red-50 text-red-500 p-4 rounded-xl font-bold hover:bg-red-100 transition flex items-center justify-center space-x-2">
        <LogOut className="w-5 h-5" />
        <span>Sair da Conta</span>
      </button>
    </div>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // NOVO: Impede o reset indevido
  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.CHAT);

  // SINCRONIZAÇÃO COM O FIREBASE (O que resolve seu problema)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = async () => {
    await signOut(auth); // Desloga no Firebase real
    setIsAuthenticated(false);
    setCurrentTab(AppTab.CHAT);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">Carregando LYVO™...</div>;

  if (isAuthenticated) {
    const renderContent = () => {
      switch (currentTab) {
        case AppTab.CHAT: return <ChatInterface />;
        case AppTab.FINANCE: return <FinanceDashboard />;
        case AppTab.AGENDA: return <AgendaView />;
        case AppTab.PROFILE: return <ProfileScreen onLogout={handleLogout} />;
        default: return <ChatInterface />;
      }
    };

    const NavButton = ({ tab, icon: Icon, label }: { tab: AppTab; icon: any; label: string }) => {
      const isActive = currentTab === tab;
      return (
        <button onClick={() => setCurrentTab(tab)} className={`flex flex-col items-center justify-center transition-all w-full h-full ${isActive ? 'text-lyvo-primary' : 'text-gray-400'}`}>
          <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
          <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{label}</span>
        </button>
      );
    };

    return (
      <div className="h-screen w-full bg-gray-50 flex flex-col">
        <main className="flex-1 overflow-hidden relative flex flex-col pb-16">
          {renderContent()}
        </main>
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around z-50 shadow-lg">
          <NavButton tab={AppTab.CHAT} icon={MessageCircle} label="Chat" />
          <NavButton tab={AppTab.FINANCE} icon={PieChart} label="Finanças" />
          <NavButton tab={AppTab.AGENDA} icon={Calendar} label="Agenda" />
          <NavButton tab={AppTab.PROFILE} icon={User} label="Perfil" />
        </nav>
      </div>
    );
  }

  return <LandingPage onLogin={handleLogin} />;
}

export default App;
