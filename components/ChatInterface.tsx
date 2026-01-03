
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Camera, TrendingDown, TrendingUp, Calendar, Loader2, X, Check, Bot, Edit2, Trash2 } from 'lucide-react';
import { processUserCommand, executeAction, analyzeReceiptImage } from '../services/geminiService';
import { store } from '../services/mockStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  actionData?: any; // Structured data from NLP
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
  
  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalInitialData, setModalInitialData] = useState<any>(null); // To prepopulate modal on edit
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- STT: Speech-to-Text Setup ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      } else {
        alert("Reconhecimento de voz não suportado neste navegador.");
      }
    }
  };

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
    const result = await processUserCommand(newMessage.content, base64Data);

    setIsLoading(false);
    
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

  // --- VISION: Camera/OCR Logic ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        
        // Auto-analyze vision
        setIsLoading(true);
        const base64Clean = base64.split(',')[1];
        const commandText = await analyzeReceiptImage(base64Clean);
        setIsLoading(false);
        
        // Set text and trigger NLP
        setInputText(commandText);
        handleSendMessage(commandText, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmAction = (messageId: string, actionData: any) => {
      const result = executeAction(actionData);
      setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'CONFIRMED' } : msg
      ));
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.message
      }]);
  };

  const handleCancelAction = (messageId: string) => {
      setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'CANCELLED' } : msg
      ));
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: "❌ Operação cancelada."
      }]);
  };

  const handleEditAction = (messageId: string, actionData: any) => {
      setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'CANCELLED' } : msg
      ));

      const details = actionData.transactionDetails || actionData.eventDetails;
      let initialData: any = {};
      
      if (actionData.action === 'ADD_EVENT') {
          initialData = {
              title: details.title,
              description: details.description,
              date: details.dateTime ? details.dateTime.split('T')[0] : '',
              time: details.dateTime ? details.dateTime.split('T')[1]?.substring(0,5) : ''
          };
          setActiveModal('EVENT');
      } else {
          initialData = {
              value: details.value,
              category: details.category,
              description: details.description,
              date: new Date().toISOString().split('T')[0]
          };
          setActiveModal(details.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
      }
      setModalInitialData(initialData);
  };

  const handleSaveManual = (data: any) => {
    if (activeModal === 'EXPENSE' || activeModal === 'INCOME') {
        store.addTransaction({
            type: activeModal,
            value: parseFloat(data.value),
            category: data.category,
            description: data.description || (activeModal === 'EXPENSE' ? 'Despesa Manual' : 'Receita Manual'),
            date: data.date || new Date().toISOString()
        });
        const emoji = activeModal === 'EXPENSE' ? '💸' : '💰';
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `${emoji} ${activeModal === 'EXPENSE' ? 'Despesa' : 'Receita'} de R$ ${data.value} registrada!`
        }]);
    } else if (activeModal === 'EVENT') {
        const dateTimeString = `${data.date}T${data.time}:00`;
        store.addEvent({
            title: data.title,
            dateTime: dateTimeString,
            description: data.description
        });
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `📅 Evento "${data.title}" agendado com sucesso!`
        }]);
    }
    setActiveModal(null);
    setModalInitialData(null);
  };

  const renderConfirmationCard = (msg: Message) => {
      if (!msg.actionData || msg.status !== 'PENDING') return null;

      const { action, transactionDetails, eventDetails } = msg.actionData;
      const isCredit = action === 'ADD_CREDIT_TRANSACTION';
      const isEvent = action === 'ADD_EVENT';
      const details = transactionDetails || eventDetails;

      const getSafeDate = (isoStr: string) => {
          return new Date(isoStr);
      };

      return (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-2xl p-4 w-full animate-fade-in shadow-sm">
              <div className="text-[10px] text-gray-400 mb-3 font-black uppercase tracking-widest">Resumo Identificado</div>
              
              <div className="space-y-2.5 text-sm text-gray-700 mb-4">
                  {isEvent ? (
                      <>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-400 font-medium">Título:</span>
                            <span className="font-bold text-gray-900 text-right max-w-[180px]">{details.title}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-400 font-medium">Data:</span>
                            <span className="font-bold text-gray-900">{getSafeDate(details.dateTime).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-400 font-medium">Horário:</span>
                            <span className="font-bold text-gray-900">{getSafeDate(details.dateTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
                        </div>
                      </>
                  ) : (
                      <>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-400 font-medium">Valor:</span>
                            <span className="font-bold text-gray-900">R$ {details.value?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-2">
                            <span className="text-gray-400 font-medium">Categoria:</span>
                            <span className="font-bold text-gray-900">{details.category}</span>
                        </div>
                        {isCredit && (
                             <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-400 font-medium">Cartão:</span>
                                <span className="text-purple-600 font-bold">{details.cardName}</span>
                            </div>
                        )}
                      </>
                  )}
              </div>

              <div className="flex space-x-2">
                  <button 
                    onClick={() => handleConfirmAction(msg.id, msg.actionData)}
                    className="flex-[2] bg-lyvo-secondary text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-green-100 hover:bg-green-600 flex items-center justify-center space-x-1 transition active:scale-95"
                  >
                      <Check className="w-3.5 h-3.5" /> <span>Confirmar</span>
                  </button>
                  <button 
                    onClick={() => handleEditAction(msg.id, msg.actionData)}
                    className="flex-1 bg-blue-50 text-lyvo-primary text-xs font-black uppercase tracking-widest py-3 rounded-xl hover:bg-blue-100 flex items-center justify-center space-x-1 transition active:scale-95"
                  >
                      <Edit2 className="w-3.5 h-3.5" /> <span>Editar</span>
                  </button>
                  <button 
                    onClick={() => handleCancelAction(msg.id)}
                    className="bg-gray-100 text-gray-400 p-3 rounded-xl hover:bg-gray-200 transition active:scale-95"
                  >
                      <X className="w-4 h-4" />
                  </button>
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-[#E5DDD5]"> 
      <div className="bg-white/90 backdrop-blur-md shadow-sm z-10 rounded-b-[2rem] w-full">
         <div className="max-w-3xl mx-auto w-full">
            <div className="flex items-center space-x-4 px-6 pt-6 pb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lyvo-primary to-blue-400 flex items-center justify-center text-white shadow-lg shadow-blue-200 flex-shrink-0">
                    <Bot className="w-7 h-7" />
                </div>
                <div className="flex flex-col">
                    <h1 className="font-bold text-gray-800 text-xl tracking-tight leading-none">Lyvo Assistente</h1>
                    <div className="flex items-center space-x-1.5 mt-1.5">
                        <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <p className="text-xs text-green-600 font-medium tracking-wide">Online agora</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3 px-4 pb-5 pt-3">
                <button onClick={() => setActiveModal('EXPENSE')} className="flex flex-col items-center justify-center py-2.5 bg-red-50 text-red-600 rounded-2xl border border-red-100/50 active:scale-95 transition-all hover:bg-red-100">
                    <TrendingDown className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">Despesa</span>
                </button>
                <button onClick={() => setActiveModal('INCOME')} className="flex flex-col items-center justify-center py-2.5 bg-green-50 text-green-600 rounded-2xl border border-green-100/50 active:scale-95 transition-all hover:bg-green-100">
                    <TrendingUp className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">Receita</span>
                </button>
                <button onClick={() => setActiveModal('EVENT')} className="flex flex-col items-center justify-center py-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 active:scale-95 transition-all hover:bg-blue-100">
                    <Calendar className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">Evento</span>
                </button>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-[#E5DDD5] bg-opacity-50">
        <div className="max-w-3xl mx-auto w-full space-y-4">
            {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                    className={`max-w-[85%] md:max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-sm md:text-base relative ${
                    msg.role === 'user' 
                        ? 'bg-lyvo-primary text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none'
                    }`}
                >
                {msg.image && (
                    <img src={msg.image} alt="Upload" className="w-full h-40 object-cover rounded-lg mb-2 bg-gray-100" />
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {renderConfirmationCard(msg)}
                <span className={`text-[10px] block text-right mt-1 opacity-70 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(parseInt(msg.id) || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                </div>
            </div>
            ))}
            {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-lyvo-primary" />
                <span className="text-gray-500 text-sm italic">Lyvo está processando...</span>
                </div>
            </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white p-3 space-y-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20 w-full">
        <div className="max-w-3xl mx-auto w-full">
            <div className="flex items-end space-x-2">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
                <div className="flex-1 bg-gray-100 rounded-3xl flex items-center px-4 py-2 relative min-h-[50px]">
                    {selectedImage && (
                        <div className="absolute -top-14 left-0 bg-white p-2 rounded-xl shadow-lg border border-gray-100 flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden">
                                <img src={selectedImage} className="w-full h-full object-cover" alt="Preview" />
                            </div>
                            <button onClick={() => setSelectedImage(null)} className="text-xs text-red-500 font-bold px-2">Remover</button>
                        </div>
                    )}
                    <input
                        id="chat-input"
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={isListening ? "Ouvindo..." : "Agendar reunião amanhã 15h"}
                        className="flex-1 bg-transparent focus:outline-none text-sm text-gray-800 max-h-24 py-1"
                    />
                    <div className="flex items-center space-x-3 ml-2 text-gray-500">
                        <button onClick={triggerCamera} className="hover:text-lyvo-primary transition-all active:scale-90"><Camera className="w-5 h-5" /></button>
                        <button 
                          onClick={toggleListening} 
                          className={`transition-all duration-300 ${isListening ? 'text-red-500 scale-125 animate-pulse' : 'hover:text-lyvo-primary active:scale-90'}`}
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <button 
                    onClick={() => handleSendMessage()} 
                    disabled={(!inputText.trim() && !selectedImage) || isListening}
                    className={`p-3.5 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                        (inputText.trim() || selectedImage) && !isListening ? 'bg-lyvo-primary text-white scale-100' : 'bg-gray-200 text-gray-400 scale-95'
                    }`}
                >
                    <Send className="w-5 h-5 ml-0.5" /> 
                </button>
            </div>
        </div>
      </div>

      {activeModal && (
          <ManualEntryModal 
            type={activeModal} 
            initialData={modalInitialData}
            onClose={() => { setActiveModal(null); setModalInitialData(null); }} 
            onSave={handleSaveManual} 
          />
      )}
    </div>
  );
};

interface ManualModalProps {
    type: ModalType;
    initialData?: any;
    onClose: () => void;
    onSave: (data: any) => void;
}

const ManualEntryModal: React.FC<ManualModalProps> = ({ type, initialData, onClose, onSave }) => {
    const [title, setTitle] = useState(initialData?.title || ''); 
    const [value, setValue] = useState(initialData?.value?.toString() || ''); 
    const [category, setCategory] = useState(initialData?.category || 'Outros');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(initialData?.time || '09:00');
    const [description, setDescription] = useState(initialData?.description || '');

    const isEvent = type === 'EVENT';
    const isIncome = type === 'INCOME';
    const titleLabel = isEvent ? 'Novo Evento' : (isIncome ? 'Nova Receita' : 'Nova Despesa');

    const handleSave = () => {
        if (isEvent && !title) return;
        if (!isEvent && !value) return;
        onSave({ title, value, category, date, time, description });
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-lg text-gray-800">{titleLabel}</h3>
                    <button onClick={onClose} className="bg-gray-200/50 p-1.5 rounded-full text-gray-500 hover:text-gray-700 transition">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5 space-y-5">
                    {isEvent && (
                         <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Título</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título exato" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-900 outline-none focus:ring-2 ring-blue-500/20 shadow-sm" />
                        </div>
                    )}
                    {!isEvent && (
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Valor</label>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center shadow-sm">
                                <span className="text-gray-400 text-sm mr-2 font-medium">R$</span>
                                <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0,00" className="w-full text-lg outline-none bg-transparent font-bold text-gray-900" />
                            </div>
                        </div>
                    )}
                    <div className="flex space-x-3">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Data</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none text-gray-900 shadow-sm" />
                        </div>
                        {isEvent && (
                            <div className="w-1/3">
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Hora</label>
                                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none text-gray-900 shadow-sm" />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-widest">Observação</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes..." rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none resize-none text-gray-900 shadow-sm focus:ring-2 ring-blue-500/20" />
                    </div>
                </div>
                <div className="p-5 pt-0 flex space-x-3">
                    <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition">Cancelar</button>
                    <button onClick={handleSave} className="flex-1 bg-lyvo-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-600 transition">Salvar</button>
                </div>
            </div>
        </div>
    );
}

export default ChatInterface;
