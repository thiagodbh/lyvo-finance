import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Camera, TrendingDown, TrendingUp, Calendar, Loader2, X, Check, Bot, Edit2 } from 'lucide-react';
// Caminho corrigido para a pasta services
import { processUserCommand, executeAction, analyzeReceiptImage } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  actionData?: any;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

type ModalType = 'EXPENSE' | 'INCOME' | 'EVENT' | null;

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Olá! Sou o Lyvo. 🤖\n\nPosso registrar despesas, receitas ou agendar compromissos. O que vamos organizar agora?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalInitialData, setModalInitialData] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const handleSendMessage = async (textOverride?: string, imageOverride?: string) => {
    const textToSend = textOverride || inputText;
    const imageToSend = imageOverride || selectedImage;
    if ((!textToSend.trim() && !imageToSend) || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      image: imageToSend || undefined
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    const base64Data = imageToSend ? imageToSend.split(',')[1] : undefined;
    // Chama a inteligência no geminiService
    const result = await processUserCommand(newMessage.content, base64Data);

    setIsLoading(false);
    
    // Mantém a lógica de resposta da sua inteligência
    if (result.success && result.data && result.data.action !== 'UNKNOWN') {
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: result.message || "Confirma os dados abaixo?",
            actionData: result.data,
            status: 'PENDING'
        }]);
    } else {
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: result.message || "Não consegui entender seu pedido. Pode reformular?"
        }]);
    }
  };

  const renderConfirmationCard = (msg: Message) => {
      if (!msg.actionData || msg.status !== 'PENDING') return null;
      const details = msg.actionData.transactionDetails || msg.actionData.eventDetails;

      return (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-2xl p-4 w-full shadow-sm">
              <div className="text-[10px] text-gray-400 mb-3 font-black uppercase tracking-widest">Resumo Identificado</div>
              <div className="space-y-2.5 text-sm text-gray-700 mb-4">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-400 font-medium">Valor/Título:</span>
                      <span className="font-bold text-gray-900">{details.value ? `R$ ${details.value}` : details.title}</span>
                  </div>
              </div>
              <div className="flex space-x-2">
                  <button onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? {...m, status: 'CONFIRMED'} : m))} className="flex-[2] bg-green-500 text-white text-xs font-black py-3 rounded-xl shadow-lg hover:bg-green-600 flex items-center justify-center space-x-1 transition">
                    <Check className="w-3.5 h-3.5" /> <span>Confirmar</span>
                  </button>
                  <button onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? {...m, status: 'CANCELLED'} : m))} className="bg-gray-100 text-gray-400 p-3 rounded-xl hover:bg-gray-200 transition">
                    <X className="w-4 h-4" />
                  </button>
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-[#E5DDD5]"> 
      <div className="bg-white/90 backdrop-blur-md shadow-sm z-10 rounded-b-[2rem] w-full px-6 pt-6 pb-4">
          <div className="max-w-3xl mx-auto flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lyvo-primary to-blue-400 flex items-center justify-center text-white shadow-lg">
                  <Bot className="w-7 h-7" />
              </div>
              <div className="flex flex-col">
                  <h1 className="font-bold text-gray-800 text-xl leading-none">Lyvo Assistente</h1>
                  <p className="text-xs text-green-600 font-medium mt-1">Online agora</p>
              </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm text-sm ${msg.role === 'user' ? 'bg-lyvo-primary text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}>
                  {msg.image && <img src={msg.image} alt="Upload" className="w-full h-40 object-cover rounded-lg mb-2" />}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {renderConfirmationCard(msg)}
                </div>
            </div>
            ))}
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-lyvo-primary mx-auto mt-4" />}
            <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white p-3 shadow-lg z-20">
        <div className="max-w-3xl mx-auto flex items-end space-x-2">
            <div className="flex-1 bg-gray-100 rounded-3xl flex items-center px-4 py-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Agendar reunião amanhã 15h"
                    className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 py-2"
                />
            </div>
            <button onClick={() => handleSendMessage()} className="p-3.5 bg-lyvo-primary text-white rounded-full shadow-md">
                <Send className="w-5 h-5" /> 
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
