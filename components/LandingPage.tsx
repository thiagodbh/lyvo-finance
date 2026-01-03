
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { 
  MessageCircle, 
  BarChart2, 
  Calendar, 
  Shield, 
  Zap, 
  Users, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Star,
  ArrowRight,
  Menu,
  Lock
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Tenta o login real no seu Firebase
      await signInWithEmailAndPassword(auth, email, password);
      onLogin(); // Entra no app apenas se o Firebase autorizar
    } catch (error: any) {
      alert("Erro ao entrar: Verifique seu e-mail e senha no Firebase.");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-green-400"></div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">LYVO<span className="text-blue-500">™</span></span>
          </div>
          
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-600">
            <a href="#recursos" className="hover:text-blue-600 transition">Recursos</a>
            <a href="#como-funciona" className="hover:text-blue-600 transition">Como Funciona</a>
            <a href="#depoimentos" className="hover:text-blue-600 transition">Depoimentos</a>
            <a href="#planos" className="hover:text-blue-600 transition">Preços</a>
            <a href="#faq" className="hover:text-blue-600 transition">FAQ</a>
          </nav>

          <div className="flex items-center space-x-4">
             <button 
               onClick={() => setShowLoginModal(true)}
               className="text-sm font-bold text-gray-700 hover:text-blue-600 transition"
             >
               Entrar
             </button>
             <button className="bg-green-500 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-green-600 transition shadow-lg shadow-green-200">
               Comprar
             </button>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Controle Financeiro e Agenda <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-400">Inteligente</span>
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Organize suas finanças e compromissos em um só lugar. Com inteligência artificial que entende linguagem natural e salva tudo automaticamente.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => setShowLoginModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg shadow-xl hover:bg-blue-700 transition transform hover:-translate-y-1"
            >
              Começar Agora — 7 dias grátis
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center space-x-6 text-xs text-gray-400 font-medium uppercase tracking-wide">
             <span className="flex items-center">🔒 Dados seguros</span>
             <span className="flex items-center">📱 Funciona em qualquer dispositivo</span>
          </div>
        </div>
      </section>

      {/* --- PROBLEM VS SOLUTION --- */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Problem */}
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
               <h3 className="text-2xl font-bold text-gray-800 mb-6 leading-snug">
                 Cansado de planilhas complicadas e apps que não conversam entre si?
               </h3>
               <ul className="space-y-4">
                 {[
                   "Perder tempo organizando dados em planilhas diferentes",
                   "Esquecer compromissos importantes por falta de organização",
                   "Não saber para onde vai seu dinheiro no final do mês",
                   "Apps complexos que exigem muito tempo para configurar"
                 ].map((item, i) => (
                   <li key={i} className="flex items-start">
                     <div className="bg-red-100 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                       <X className="w-4 h-4 text-red-500" />
                     </div>
                     <span className="text-gray-600">{item}</span>
                   </li>
                 ))}
               </ul>
            </div>

            {/* Solution */}
            <div className="bg-green-50/50 p-10 rounded-3xl border border-green-100">
               <h3 className="text-2xl font-bold text-gray-800 mb-6 leading-snug">
                 Com o LYVO™, você tem:
               </h3>
               <ul className="space-y-4">
                 {[
                   "Controle financeiro e agenda em um só lugar",
                   "Inteligência artificial que entende linguagem natural",
                   "Tudo salvo automaticamente em tempo real",
                   "Interface simples que qualquer pessoa usa"
                 ].map((item, i) => (
                   <li key={i} className="flex items-start">
                     <div className="bg-green-100 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                       <Check className="w-4 h-4 text-green-600" />
                     </div>
                     <span className="text-gray-800 font-medium">{item}</span>
                   </li>
                 ))}
               </ul>
            </div>

          </div>
        </div>
      </section>

      {/* --- RECURSOS --- */}
      <section id="recursos" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Recursos que Fazem a Diferença</h2>
            <p className="text-gray-500">Tudo que você precisa para organizar sua vida financeira e pessoal</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageCircle, color: "bg-blue-500", 
                title: "Chat Inteligente", 
                desc: "Converse naturalmente: \"gastei 50 reais no mercado hoje\" e pronto! O sistema entende e organiza automaticamente."
              },
              {
                icon: BarChart2, color: "bg-green-500", 
                title: "Relatórios Visuais", 
                desc: "Gráficos bonitos e fáceis de entender mostram exatamente para onde vai seu dinheiro e como está sua evolução."
              },
              {
                icon: Calendar, color: "bg-purple-500", 
                title: "Agenda Integrada", 
                desc: "Seus compromissos e finanças conectados. Nunca mais esqueça de pagar uma conta ou perder um compromisso importante."
              },
              {
                icon: Shield, color: "bg-red-500", 
                title: "Dados Seguros", 
                desc: "Seus dados ficam salvos localmente no seu dispositivo. Privacidade total e controle completo sobre suas informações."
              },
              {
                icon: Zap, color: "bg-yellow-500", 
                title: "Tempo Real", 
                desc: "Tudo é salvo instantaneamente. Sem perder dados, sem sincronização complicada. Funciona offline e online."
              },
              {
                icon: Users, color: "bg-cyan-500", 
                title: "Para Toda Família", 
                desc: "Interface simples que qualquer pessoa consegue usar. Desde adolescentes até pessoas mais experientes."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- COMO FUNCIONA --- */}
      <section id="como-funciona" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Como Funciona</h2>
          <p className="text-gray-500 mb-16">Simples como conversar com um amigo</p>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: 1, color: "bg-blue-500", title: "Converse Naturalmente", desc: "Digite ou fale: \"gastei 120 no supermercado\" ou \"reunião amanhã às 14h\". O LYVO entende e organiza tudo." },
              { step: 2, color: "bg-green-500", title: "Confirme e Pronto", desc: "Tudo é salvo instantaneamente. Sem perder dados, sem sincronização complicada. Automática e dados organizados na hora." },
              { step: 3, color: "bg-purple-500", title: "Acompanhe Tudo", desc: "Interface simples que qualquer pessoa consegue usar. Tudo sincronizado e atualizado em tempo real." }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full ${s.color} text-white flex items-center justify-center text-2xl font-bold shadow-xl mb-6`}>
                  {s.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- DEPOIMENTOS --- */}
      <section id="depoimentos" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">O que nossos usuários dizem</h2>
            <p className="text-gray-500">Pessoas reais, resultados reais</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Maria Silva", role: "Empresária", text: "\"Finalmente um app que entende como eu falo! Não preciso mais ficar preenchendo formulários complicados.\"", color: "bg-blue-100 text-blue-600" },
              { name: "João Santos", role: "Designer", text: "\"Consegui organizar minhas finanças em uma semana. Os gráficos são lindos e fáceis de entender.\"", color: "bg-green-100 text-green-600" },
              { name: "Ana Costa", role: "Consultora", text: "\"Minha agenda e finanças finalmente conversam entre si. Nunca mais esqueci de pagar uma conta!\"", color: "bg-purple-100 text-purple-600" },
            ].map((u, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex text-yellow-400 mb-4">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">{u.text}</p>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${u.color}`}>
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PLANOS --- */}
      <section id="planos" className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Planos Simples e Transparentes</h2>
            <p className="text-gray-500">Escolha o que faz mais sentido para você</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            
            {/* Plano Essencial */}
            <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Essencial</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-bold text-blue-600">R$ 14,90</span>
                <span className="text-gray-500 ml-1">/mês</span>
              </div>
              <p className="text-sm text-gray-400 mb-8">Perfeito para uso pessoal</p>

              <ul className="space-y-4 mb-8 text-sm text-gray-600">
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Chat inteligente ilimitado</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Controle financeiro completo</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Agenda integrada</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Relatórios e gráficos</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Backup e exportação</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Suporte por email</li>
              </ul>

              <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center">
                Começar Agora <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <p className="text-[10px] text-center text-gray-400 mt-3">7 dias grátis • Cancele quando quiser</p>
            </div>

            {/* Plano Vitalício */}
            <div className="bg-white p-10 rounded-3xl border-2 border-green-400 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">MAIS POPULAR</div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Vitalício</h3>
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-bold text-green-500">R$ 99,90</span>
                <span className="text-gray-500 ml-1">/único</span>
              </div>
              <p className="text-sm text-gray-400 mb-8">Pague uma vez, use para sempre</p>

              <ul className="space-y-4 mb-8 text-sm text-gray-600">
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Tudo do plano Essencial</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Acesso vitalício</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Todas as atualizações futuras</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Suporte prioritário</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Recursos exclusivos</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Economia de R$ 79 no primeiro ano</li>
              </ul>

              <button className="w-full py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition flex items-center justify-center">
                Comprar Vitalício <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <p className="text-[10px] text-center text-gray-400 mt-3">Pagamento único • Sem mensalidades</p>
            </div>

          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h2>
            <p className="text-gray-500">Tire suas dúvidas sobre o LYVO™</p>
          </div>

          <div className="space-y-4">
            {[
              { q: "Como funciona o período gratuito?", a: "Você tem 7 dias para testar todas as funcionalidades sem pagar nada. Não pedimos cartão de crédito para começar. Após o período, você escolhe se quer continuar." },
              { q: "Meus dados ficam seguros?", a: "Sim! Seus dados ficam salvos localmente no seu dispositivo. Você tem controle total sobre suas informações e pode fazer backup quando quiser." },
              { q: "Funciona em qualquer dispositivo?", a: "Sim! O LYVO™ funciona em computadores, tablets e celulares. A interface se adapta automaticamente ao seu dispositivo." },
              { q: "Posso cancelar a qualquer momento?", a: "Claro! Não há fidelidade. Você pode cancelar quando quiser e seus dados continuam salvos no seu dispositivo." },
              { q: "Como funciona a inteligência artificial?", a: "Você escreve ou fala naturalmente, como \"gastei 50 no mercado\" ou \"reunião amanhã às 14h\". O sistema entende, categoriza e organiza automaticamente." },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full p-6 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-bold text-gray-800 text-sm">{item.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-sm text-gray-500 leading-relaxed animate-fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-500 to-green-400 rounded-[3rem] p-10 md:p-20 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Pronto para Organizar sua Vida?</h2>
            <p className="text-lg opacity-90 mb-10 max-w-2xl mx-auto">Junte-se a milhares de pessoas que já simplificaram suas finanças e agenda com o LYVO™</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => setShowLoginModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-lg"
              >
                Começar Agora — 7 dias grátis
              </button>
            </div>
            
            <div className="mt-8 flex items-center justify-center space-x-4 text-[10px] font-medium opacity-80 uppercase tracking-wide">
              <span>🔒 Dados seguros</span>
              <span>•</span>
              <span>📱 Funciona em qualquer dispositivo</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-12 text-sm">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-green-400"></div>
              <span className="text-xl font-bold">LYVO<span className="text-blue-500">™</span></span>
            </div>
            <p className="text-gray-400 max-w-xs leading-relaxed">
              Controle financeiro e agenda inteligente em um só lugar.
            </p>
            <p className="text-gray-500 mt-6 text-xs">© 2025 LYVO™ - CNPJ 36.989.165/0001-85</p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-gray-200">Links Úteis</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-white">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-white">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-white">Suporte</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-gray-200">Contato</h4>
            <ul className="space-y-3 text-gray-400">
              <li>contato@lyvo.com.br</li>
              <li className="text-xs mt-4 opacity-50">Domínio provisório: <br/> 335ff5c3-chat-financeiro-agenda-dusky.lasy.pro</li>
            </ul>
          </div>
        </div>
      </footer>

      {/* --- LOGIN MODAL --- */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-up relative">
             <button 
               onClick={() => setShowLoginModal(false)}
               className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
             >
               <X className="w-5 h-5" />
             </button>

             <div className="text-center mb-8">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Acesse sua Conta</h3>
                <p className="text-gray-500 text-sm mt-2">Bem-vindo de volta ao LYVO</p>
             </div>

             <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">E-mail</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Senha</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900"
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="flex justify-end">
                   <a href="#" className="text-xs font-bold text-blue-600 hover:underline">Esqueci minha senha</a>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  Entrar
                </button>
             </form>
             
             <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Ainda não tem conta? <a href="#" className="text-blue-600 font-bold hover:underline">Criar conta grátis</a>
                </p>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LandingPage;
