
import React, { useState } from 'react';
import { MessageCircle, PieChart, Calendar, User, Settings, LogOut } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import FinanceDashboard from './components/FinanceDashboard';
import AgendaView from './components/AgendaView';
import LandingPage from './components/LandingPage';
import { AppTab } from './types';

// Placeholder for Profile Screen
const ProfileScreen = ({ onLogout }: { onLogout: () => void }) => (
  <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6">
    <div className="w-24 h-24 bg-lyvo-primary rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
      <User className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-bold text-gray-800">Meu Perfil</h2>
    <p className="text-gray-500 text-center mt-2 max-w-xs">
      Gerencie sua conta, suas conexões bancárias e preferências do Lyvo.
    </p>
    
    <div className="mt-8 w-full max-w-xs space-y-3">
      <button className="w-full flex items-center justify-center space-x-2 bg-white p-4 rounded-xl shadow-sm text-gray-700 font-medium border border-gray-100 hover:bg-gray-50 transition">
        <Settings className="w-5 h-5" />
        <span>Configurações</span>
      </button>
      
      <button 
        onClick={onLogout}
        className="w-full bg-red-50 text-red-500 p-4 rounded-xl font-bold hover:bg-red-100 transition flex items-center justify-center space-x-2"
      >
        <LogOut className="w-5 h-5" />
        <span>Sair da Conta</span>
      </button>
    </div>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState<AppTab>(AppTab.CHAT);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentTab(AppTab.CHAT);
  };

  // --- Authenticated Layout (Responsive with Fixed Bottom Nav) ---
  if (isAuthenticated) {
    const renderContent = () => {
      switch (currentTab) {
        case AppTab.CHAT:
          return <ChatInterface />;
        case AppTab.FINANCE:
          return <FinanceDashboard />;
        case AppTab.AGENDA:
          return <AgendaView />;
        case AppTab.PROFILE:
          return <ProfileScreen onLogout={handleLogout} />;
        default:
          return <ChatInterface />;
      }
    };

    const NavButton = ({ tab, icon: Icon, label }: { tab: AppTab; icon: any; label: string }) => {
      const isActive = currentTab === tab;
      return (
        <button 
          onClick={() => setCurrentTab(tab)}
          className={`
            flex flex-col items-center justify-center transition-all duration-200 space-y-1 w-full h-full active:scale-95
            ${isActive ? 'text-lyvo-primary' : 'text-gray-400 hover:text-gray-600'}
          `}
        >
          <Icon className={`
            w-6 h-6 
            ${isActive ? 'fill-current' : ''} transition-all duration-300
          `} strokeWidth={isActive ? 2.5 : 2} />
          <span className={`
            text-[10px] 
            font-medium ${isActive ? 'font-bold' : ''}
          `}>{label}</span>
        </button>
      );
    };

    return (
      <div className="h-screen w-full bg-gray-50 relative overflow-hidden flex flex-col">
        
        {/* MAIN CONTENT AREA - Padding bottom matched to nav height */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-gray-50 md:bg-white/50 pb-16">
          {renderContent()}
        </main>

        {/* BOTTOM NAV (STRICTLY FIXED AT BOTTOM) */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <NavButton tab={AppTab.CHAT} icon={MessageCircle} label="Chat" />
          <NavButton tab={AppTab.FINANCE} icon={PieChart} label="Finanças" />
          <NavButton tab={AppTab.AGENDA} icon={Calendar} label="Agenda" />
          <NavButton tab={AppTab.PROFILE} icon={User} label="Perfil" />
        </nav>
      </div>
    );
  }

  // --- Unauthenticated Layout (Landing Page) ---
  return <LandingPage onLogin={handleLogin} />;
}

export default App;
