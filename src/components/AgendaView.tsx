import React, { useState, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    MapPin, 
    ChevronLeft, 
    ChevronRight, 
    Settings, 
    RefreshCw,
    Plus,
    X,
    Check
} from 'lucide-react';

import { CalendarEvent, CalendarConnection } from '../types';
import { getTransactions } from '../services/mockStore';

type ViewMode = 'DAY' | 'WEEK' | 'MONTH';

const EventCard: React.FC<{ event: CalendarEvent }> = ({ event }) => {
    const isInternal = event.source === 'INTERNAL';
    const borderColor = isInternal ? 'border-lyvo-primary' : (event.color || 'border-green-500');
    const bgColor = isInternal ? 'bg-blue-50' : 'bg-gray-50';
    const sourceLabel = isInternal ? 'Lyvo' : (event.source === 'GOOGLE' ? 'Google' : 'Externo');

    return (
        <div className={`relative bg-white p-4 rounded-xl shadow-sm border-l-[6px] ${borderColor} mb-3 flex flex-col gap-1 transition-all hover:shadow-md`}>
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800 text-sm leading-tight">{event.title}</h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${bgColor} text-gray-500`}>
                    {sourceLabel}
                </span>
            </div>
            
            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {event.location && (
                    <div className="flex items-center space-x-1 overflow-hidden">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate max-w-[120px]">{event.location}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const AgendaView: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('MONTH');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [showSyncModal, setShowSyncModal] = useState(false);
    const [connections, setConnections] = useState<CalendarConnection[]>([]);
    const [forceUpdate, setForceUpdate] = useState(0);

    // --- Data Loading ---
    useEffect(() => {
        // Inicializamos vazio para evitar erro de 'store' não definido
        setEvents([]);
        setConnections([]);
    }, [forceUpdate, showSyncModal]);

    // --- Helpers ---
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const isSameDate = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    };

    const getEventsForDate = (date: Date) => {
        return events.filter(e => isSameDate(new Date(e.dateTime), date));
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);
        if (viewMode === 'MONTH') {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        } else if (viewMode === 'WEEK') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        }
        setSelectedDate(newDate);
    };

    const toggleConnection = (id: string) => {
        // Funcionalidade desativada temporariamente para evitar erro de store
    };

    // --- Views ---
    const renderMonthView = () => {
        const daysInMonth = getDaysInMonth(selectedDate);
        const firstDay = getFirstDayOfMonth(selectedDate);
        const blanks = Array(firstDay).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <div className="bg-white rounded-3xl p-4 shadow-sm animate-fade-in h-fit">
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                        <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {blanks.map((_, i) => <div key={`blank-${i}`} className="h-10 sm:h-12 md:h-14 lg:h-16" />)}
                    {days.map(day => {
                        const currentDayDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                        const dayEvents = getEventsForDate(currentDayDate);
                        const isSelected = isSameDate(currentDayDate, selectedDate);
                        const isToday = isSameDate(currentDayDate, new Date());

                        return (
                            <button 
                                key={day} 
                                onClick={() => setSelectedDate(currentDayDate)}
                                className={`h-10 sm:h-12 md:h-14 lg:h-16 flex flex-col items-center justify-start pt-1 rounded-xl relative transition-all
                                    ${isSelected ? 'bg-lyvo-primary/10 ring-1 ring-lyvo-primary' : 'hover:bg-gray-50'}
                                    ${isToday ? 'font-bold text-lyvo-primary' : 'text-gray-700'}
                                `}
                            >
                                <span className="text-sm">{day}</span>
                                <div className="flex space-x-0.5 mt-1">
                                    {dayEvents.slice(0, 3).map((_, i) => (
                                        <div key={i} className={`w-1 h-1 rounded-full ${isToday ? 'bg-lyvo-primary' : 'bg-gray-400'}`}></div>
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderListView = (period: 'day' | 'week') => {
        let eventsToShow: CalendarEvent[] = [];
        if (period === 'day') {
            eventsToShow = getEventsForDate(selectedDate);
        } else {
            const start = new Date(selectedDate);
            const end = new Date(start);
            end.setDate(end.getDate() + 7);
            eventsToShow = events.filter(e => {
                const d = new Date(e.dateTime);
                return d >= start && d < end;
            });
        }

        if (eventsToShow.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <CalendarIcon className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-gray-500 font-medium">Sem compromissos</p>
                </div>
            );
        }

        const groupedEvents: { [key: string]: CalendarEvent[] } = {};
        eventsToShow.forEach(e => {
            const dateKey = new Date(e.dateTime).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
            if (!groupedEvents[dateKey]) groupedEvents[dateKey] = [];
            groupedEvents[dateKey].push(e);
        });

        return (
            <div className="space-y-6">
                 {Object.entries(groupedEvents).map(([dateLabel, dateEvents]) => (
                     <div key={dateLabel}>
                         <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide ml-1">{dateLabel}</h3>
                         <div className="space-y-1">
                            {dateEvents.map(event => <EventCard key={event.id} event={event} />)}
                         </div>
                     </div>
                 ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-lyvo-bg relative overflow-hidden">
            <div className="px-6 pt-6 pb-2 bg-white shadow-sm z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-lyvo-text">Minha Agenda</h1>
                        <button onClick={() => setShowSyncModal(true)} className="flex items-center space-x-1 text-lyvo-primary font-medium text-sm bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Sincronizar</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {(['DAY', 'WEEK', 'MONTH'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                        viewMode === mode ? 'bg-white text-lyvo-text shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    {mode === 'DAY' ? 'Dia' : mode === 'WEEK' ? 'Semana' : 'Mês'}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center space-x-2 text-gray-700">
                            <button onClick={() => handleNavigate('prev')} className="p-1 hover:bg-gray-100 rounded-full">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-bold min-w-[100px] text-center capitalize">
                                {viewMode === 'MONTH' 
                                    ? selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) 
                                    : selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
                                }
                            </span>
                            <button onClick={() => handleNavigate('next')} className="p-1 hover:bg-gray-100 rounded-full">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24">
                <div className="max-w-7xl mx-auto">
                    <div className="hidden md:flex gap-6 h-full">
                         <div className="flex-1 lg:flex-[2]">
                            {viewMode === 'MONTH' && renderMonthView()}
                            {viewMode !== 'MONTH' && <div className="bg-white p-10 rounded-3xl text-center text-gray-400">Visualização de lista expandida</div>}
                         </div>

                         <div className="flex-1 bg-white/50 rounded-3xl p-4 overflow-y-auto max-h-full">
                             <h3 className="text-lg font-bold text-lyvo-text mb-4 px-1 sticky top-0 bg-transparent">
                                 {viewMode === 'MONTH' ? `Eventos de ${selectedDate.toLocaleDateString('pt-BR', { day:'numeric', month: 'long' })}` : 'Lista de Eventos'}
                             </h3>
                             {renderListView(viewMode === 'WEEK' ? 'week' : 'day')}
                         </div>
                    </div>

                    <div className="md:hidden space-y-6">
                        {viewMode === 'MONTH' && (
                            <>
                                {renderMonthView()}
                                <div>
                                    <h3 className="text-lg font-bold text-lyvo-text mb-3 px-1">Eventos em {selectedDate.toLocaleDateString('pt-BR', { month: 'long' })}</h3>
                                    {renderListView('day')} 
                                </div>
                            </>
                        )}
                        {viewMode === 'WEEK' && renderListView('week')}
                        {viewMode === 'DAY' && renderListView('day')}
                    </div>
                </div>
            </div>

            <button className="absolute bottom-24 right-6 bg-lyvo-primary text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-20">
                <Plus className="w-6 h-6" />
            </button>

            {showSyncModal && (
                <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full sm:w-[90%] max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Sincronizar Agendas</h2>
                            <button onClick={() => setShowSyncModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-600"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4 mb-6">
                            {connections.map(conn => (
                                <div key={conn.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                                            <CalendarIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{conn.accountName}</p>
                                            <p className="text-[10px] text-gray-400">Status sincronizado</p>
                                        </div>
                                    </div>
                                    <button className="w-12 h-7 rounded-full p-1 bg-green-500">
                                        <div className="w-5 h-5 bg-white rounded-full translate-x-5 shadow-md"></div>
                                    </button>
                                </div>
                            ))}
                            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium text-sm hover:bg-gray-50 flex items-center justify-center space-x-2">
                                <Plus className="w-4 h-4" />
                                <span>Adicionar Nova Conta</span>
                            </button>
                        </div>

                        <button onClick={() => setShowSyncModal(false)} className="w-full bg-lyvo-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg">Concluído</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgendaView;
