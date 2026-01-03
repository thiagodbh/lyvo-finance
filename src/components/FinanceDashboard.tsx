
import React, { useState, useEffect } from 'react';
import { 
    ChevronDown, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    CreditCard as CreditCardIcon, 
    Plus, 
    X,
    Edit2,
    Trash2,
    TrendingUp,
    TrendingDown,
    Target,
    AlertCircle,
    Check,
    FileText,
    Download
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Legend, 
    Cell,
    PieChart,
    Pie
} from 'recharts';

import { Transaction, FixedBill, BudgetLimit, Forecast, CreditCard } from '../types';
import { getTransactions } from '../services/mockStore';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F43F5E', '#0EA5E9', '#64748B'];

const FinanceDashboard: React.FC = () => {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
    const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
    const [forecasts, setForecasts] = useState<Forecast[]>([]);
    const [limits, setLimits] = useState<BudgetLimit[]>([]);
    const [balanceData, setBalanceData] = useState({ income: 0, expense: 0, balance: 0 });
    const [prevMonthIncome, setPrevMonthIncome] = useState(0);

    const [showAddBillModal, setShowAddBillModal] = useState(false);
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [showAddForecastModal, setShowAddForecastModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedCardForDetails, setSelectedCardForDetails] = useState<CreditCard | null>(null);
    const [payInvoiceModal, setPayInvoiceModal] = useState<{cardId: string, fullValue: number} | null>(null);
    
    const [editingForecast, setEditingForecast] = useState<Forecast | null>(null);
    const [editingCategory, setEditingCategory] = useState<BudgetLimit | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{type: 'CARD' | 'TRANSACTION' | 'FORECAST', id: string} | null>(null);
    const [forecastToDelete, setForecastToDelete] = useState<Forecast | null>(null);
    const [billToDelete, setBillToDelete] = useState<FixedBill | null>(null);

    const [expandBills, setExpandBills] = useState(false);
    const [expandTransactions, setExpandTransactions] = useState(false);
    const [expandForecasts, setExpandForecasts] = useState(false);
    const [expandCategories, setExpandCategories] = useState(false);

    const refreshData = async () => {
        try {
            // Buscamos os dados reais do seu Firebase
            const data = await getTransactions();
            
            // Atualizamos o estado com o que veio do banco
            if (data) {
                setTransactions(data);
            }

            // Zeramos temporariamente os outros para a tela não travar (tela branca)
            setFixedBills([]); 
            setForecasts([]);
            setCreditCards([]);
            setLimits([]);
            setBalanceData({ income: 0, expense: 0, balance: 0 });
            setPrevMonthIncome(0);
        } catch (error) {
            console.error("Erro ao carregar dados do Financeiro:", error);
        }
    };

    useEffect(() => {
        refreshData();
    }, [selectedMonth, selectedYear, refreshTrigger]);

    const triggerUpdate = () => setRefreshTrigger(prev => prev + 1);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const handleToggleBill = (id: string) => {
        // store.toggleFixedBillStatus(id, selectedMonth, selectedYear);
        triggerUpdate();
    };

    const handleConfirmForecast = (id: string) => {
        // store.confirmForecast(id, selectedMonth, selectedYear);
        triggerUpdate();
    };

    const handlePrevMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonth(prev => prev + 1);
        }
    };

    const handleDelete = () => {
        if (!itemToDelete) return;
        if (itemToDelete.type === 'CARD') {
            // store.deleteCreditCard(itemToDelete.id);
            setSelectedCardForDetails(null);
        } else if (itemToDelete.type === 'TRANSACTION') {
            // store.deleteTransaction(itemToDelete.id);
        }
        triggerUpdate();
        setItemToDelete(null);
    };

    const handleConfirmDeleteBill = (mode: 'ONLY_THIS' | 'ALL_FUTURE') => {
        if (billToDelete) {
            // store.deleteFixedBill(billToDelete.id, mode, selectedMonth, selectedYear);
            setBillToDelete(null);
            triggerUpdate();
        }
    };

    const handleConfirmDeleteForecast = (mode: 'ONLY_THIS' | 'ALL_FUTURE') => {
        if (forecastToDelete) {
            // store.deleteForecast(forecastToDelete.id, mode, selectedMonth, selectedYear);
            setForecastToDelete(null);
            triggerUpdate();
        }
    };

    const confirmPayment = (amount: number) => {
        if (payInvoiceModal) {
            // store.payCardInvoice(payInvoiceModal.cardId, amount, selectedMonth, selectedYear);
            setPayInvoiceModal(null);
            setSelectedCardForDetails(null); 
            triggerUpdate();
        }
    };

    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const unpaidFixedBills = fixedBills.filter(b => !b.paidMonths.includes(monthKey));
    const pendingCardInvoices = creditCards.map(c => {
        const val = 0; 
        const isPaid = false; 
        return { card: c, val, isPaid };
    }).filter(item => !item.isPaid && item.val > 0);

    const totalExpectedIncome = forecasts
        .filter(f => f.type === 'EXPECTED_INCOME' && f.status === 'PENDING')
        .reduce((acc, curr) => acc + curr.value, 0);

    const totalExpectedExpense = 
        unpaidFixedBills.reduce((acc, b) => acc + b.baseValue, 0) +
        pendingCardInvoices.reduce((acc, c) => acc + c.val, 0) +
        forecasts.filter(f => f.type === 'EXPECTED_EXPENSE' && f.status === 'PENDING').reduce((acc, curr) => acc + curr.value, 0);

    const projectedBalance = balanceData.balance + totalExpectedIncome - totalExpectedExpense;

    const expenseData = limits.map(l => {
        const catExpense = transactions
            .filter(t => t.category === l.category && t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.value, 0);
        return { name: l.category, value: catExpense };
    }).filter(d => d.value > 0);

    const totalActualExpense = expenseData.reduce((sum, d) => sum + d.value, 0);

    const incomeEvolutionData = [
        { name: 'Anterior', value: prevMonthIncome },
        { name: 'Atual', value: balanceData.income }
    ];

    const expectedIncomes = forecasts.filter(f => f.type === 'EXPECTED_INCOME');

    return (
        <div className="flex flex-col h-full bg-lyvo-bg overflow-y-auto pb-24">
            
            <div className="bg-white p-6 pb-2 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-lyvo-text">Financeiro</h1>
                        <p className="text-lyvo-subtext text-sm">Resumo do mês atual</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm font-bold mt-3 sm:mt-0 text-blue-700">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <ChevronDown className="w-4 h-4 rotate-90" />
                        </button>
                        <span className="capitalize min-w-[120px] text-center">
                            {new Date(selectedYear, selectedMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                            <ChevronDown className="w-4 h-4 -rotate-90" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-lyvo-secondary flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">Receitas (mês)</p>
                            <p className="text-xl font-bold text-lyvo-secondary mt-1">{formatCurrency(balanceData.income)}</p>
                        </div>
                        <ArrowUpCircle className="w-8 h-8 text-lyvo-secondary opacity-20" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-red-500 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">Despesas (mês)</p>
                            <p className="text-xl font-bold text-red-500 mt-1">{formatCurrency(balanceData.expense)}</p>
                        </div>
                        <ArrowDownCircle className="w-8 h-8 text-red-500 opacity-20" />
                    </div>
                    <div className="bg-lyvo-primary p-4 rounded-2xl shadow-md border-l-4 border-blue-300 text-white flex justify-between items-center">
                        <div>
                            <p className="text-xs text-blue-100 font-medium uppercase">Saldo (Acumulado)</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(balanceData.balance)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
                        
                        <div className="bg-white p-5 rounded-3xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <CreditCardIcon className="w-5 h-5 text-lyvo-primary" />
                                    <h2 className="text-lg font-bold text-lyvo-text">Contas Fixas</h2>
                                </div>
                                <button onClick={() => setShowAddBillModal(true)} className="text-lyvo-primary text-sm font-bold flex items-center hover:bg-blue-50 px-2 py-1 rounded-lg">
                                    <Plus className="w-4 h-4 mr-1" /> Nova
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-0 lg:space-y-4">
                                {fixedBills.slice(0, expandBills ? undefined : 6).map(bill => {
                                    const isPaid = bill.paidMonths.includes(monthKey);
                                    return (
                                        <div key={bill.id} className="flex items-center justify-between py-1 bg-white md:bg-gray-50 md:p-3 md:rounded-xl lg:bg-transparent lg:p-0 group transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center space-x-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                    <button className="p-1 text-gray-300 hover:text-lyvo-primary rounded transition-colors">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setBillToDelete(bill)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{bill.name}</p>
                                                    <p className="text-xs text-gray-500">{formatCurrency(bill.baseValue)} - Vence dia {bill.dueDay}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`text-xs font-bold ${isPaid ? 'text-green-500' : 'text-orange-500'}`}>
                                                    {isPaid ? 'Pago' : 'Pendente'}
                                                </span>
                                                <button 
                                                    onClick={() => handleToggleBill(bill.id)}
                                                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${isPaid ? 'bg-lyvo-primary' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isPaid ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {fixedBills.length === 0 && <p className="text-xs text-gray-400 text-center py-2 col-span-full">Nenhuma conta fixa cadastrada.</p>}
                            </div>
                            {fixedBills.length > 6 && (
                                <button onClick={() => setExpandBills(!expandBills)} className="w-full mt-4 text-center text-sm text-lyvo-primary font-medium">
                                    {expandBills ? 'Ver Menos' : 'Ver Mais'}
                                </button>
                            )}
                        </div>

                        <div className="bg-white p-5 rounded-3xl shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-lyvo-text flex items-center gap-2">
                                    <CreditCardIcon className="w-5 h-5 text-lyvo-primary" />
                                    Gastos com Cartão
                                </h2>
                                <button onClick={() => setShowAddCardModal(true)} className="text-lyvo-primary text-sm font-bold flex items-center hover:bg-blue-50 px-2 py-1 rounded-lg">
                                    <Plus className="w-4 h-4 mr-1" /> Novo
                                </button>
                            </div>
                            
                            <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
                                {creditCards.length === 0 ? (
                                    <div className="w-full text-center py-4 text-gray-400 text-sm">Nenhum cartão cadastrado.</div>
                                ) : (
                                    creditCards.map(card => {
                                        const currentInvoice = 0;
                                        const available = card.limit - currentInvoice;
                                        const percent = Math.min((currentInvoice / card.limit) * 100, 100);
                                        const isPaid = false;
                                        
                                        return (
                                            <div 
                                                key={card.id} 
                                                onClick={() => setSelectedCardForDetails(card)}
                                                className="min-w-[280px] w-[300px] cursor-pointer border border-gray-100 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden bg-white active:scale-[0.98] transition-transform"
                                            >
                                                <div className={`absolute top-0 left-0 bottom-0 w-2 ${card.color}`}></div>
                                                <div className="pl-4">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="font-bold text-lg text-gray-800">{card.name}</h3>
                                                            <p className="text-xs text-gray-400">Venc. dia {card.dueDay}</p>
                                                        </div>
                                                        <CreditCardIcon className="text-gray-300 w-6 h-6" />
                                                    </div>
                                                    
                                                    <div className="mb-4">
                                                        <p className="text-xs text-gray-500">Fatura Atual</p>
                                                        <div className="flex justify-between items-end">
                                                            <p className="text-xl font-bold text-lyvo-text">{formatCurrency(currentInvoice)}</p>
                                                            {isPaid && <span className="text-green-500 font-bold text-xs bg-green-50 px-2 py-1 rounded">Paga</span>}
                                                            {!isPaid && currentInvoice > 0 && <span className="text-orange-500 font-bold text-xs bg-orange-50 px-2 py-1 rounded">Aberta</span>}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                            <span>Limite Disponível</span>
                                                            <span>{formatCurrency(available)}</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div style={{ width: `${percent}%` }} className={`h-full ${card.color}`}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                         <div className="bg-white p-5 rounded-3xl shadow-sm mb-8">
                            <h2 className="text-lg font-bold text-lyvo-text">Últimas Transações</h2>
                            <div className="space-y-4 mt-4">
                                {transactions.slice(0, expandTransactions ? undefined : 4).map(t => (
                                    <div key={t.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-full ${t.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                                {t.type === 'INCOME' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm">{t.description}</p>
                                                <div className="flex space-x-2 text-xs text-gray-400">
                                                    <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                                                    <span>•</span>
                                                    <span>{t.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-sm ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                                            {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.value)}
                                        </span>
                                    </div>
                                ))}
                                {transactions.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Nenhuma transação geral neste mês.</p>}
                            </div>
                            {transactions.length > 4 && (
                                <button 
                                    onClick={() => setExpandTransactions(!expandTransactions)}
                                    className="w-full mt-4 text-center text-xs text-lyvo-primary font-bold hover:bg-blue-50 py-2 rounded-xl transition-colors"
                                >
                                    {expandTransactions ? 'Ver Menos' : 'Ver Mais'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                         <div className="bg-white p-5 rounded-3xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h2 className="text-lg font-bold text-lyvo-text">Previsibilidade</h2>
                              <button onClick={() => { setEditingForecast(null); setShowAddForecastModal(true); }} className="p-1.5 hover:bg-blue-50 text-lyvo-primary rounded-full">
                                <Plus className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="bg-green-50 p-3 rounded-2xl border border-green-100 flex flex-col justify-center text-center">
                                    <div className="flex items-center justify-center space-x-1 mb-1">
                                        <TrendingUp className="w-3 h-3 text-green-500" />
                                        <span className="text-[10px] uppercase font-bold text-green-600">Receita</span>
                                    </div>
                                    <p className="text-sm font-bold text-green-700 leading-tight">{formatCurrency(totalExpectedIncome)}</p>
                                </div>
                                <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex flex-col justify-center text-center">
                                     <div className="flex items-center justify-center space-x-1 mb-1">
                                        <TrendingDown className="w-3 h-3 text-red-500" />
                                        <span className="text-[10px] uppercase font-bold text-red-600">Despesa</span>
                                    </div>
                                    <p className="text-sm font-bold text-red-700 leading-tight">{formatCurrency(totalExpectedExpense)}</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex flex-col justify-center text-center">
                                     <div className="flex items-center justify-center space-x-1 mb-1">
                                        <Target className="w-3 h-3 text-blue-500" />
                                        <span className="text-[10px] uppercase font-bold text-blue-600">Saldo</span>
                                    </div>
                                    <p className={`text-sm font-bold leading-tight ${projectedBalance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                                        {formatCurrency(projectedBalance)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 mt-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Receitas Previstas</h3>
                                {expectedIncomes.slice(0, expandForecasts ? undefined : 5).map(f => (
                                    <div key={f.id} className="flex items-center justify-between group p-1 transition-all border-b border-gray-50 last:border-0 pb-2">
                                        <div className="flex items-center space-x-2">
                                          <div className="flex space-x-0.5">
                                            <button onClick={() => handleConfirmForecast(f.id)} className="p-1 text-gray-300 hover:text-green-500 transition-colors" title="Confirmar Recebimento">
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => { setEditingForecast(f); setShowAddForecastModal(true); }} className="p-1 text-gray-300 hover:text-blue-500 transition-colors" title="Editar">
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => setForecastToDelete(f)} className="p-1 text-gray-300 hover:text-red-500 transition-colors" title="Excluir">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-gray-800">{f.description}</p>
                                              <p className="text-[10px] text-gray-400">{f.isRecurring ? 'Recorrente' : 'Pontual'}</p>
                                          </div>
                                        </div>
                                        <span className="text-sm font-bold text-green-600">+{formatCurrency(f.value)}</span>
                                    </div>
                                ))}
                                {expectedIncomes.length === 0 && (
                                    <p className="text-[10px] text-gray-400 text-center italic py-2">Nenhuma receita prevista.</p>
                                )}
                                {expectedIncomes.length > 5 && (
                                    <button onClick={() => setExpandForecasts(!expandForecasts)} className="w-full mt-2 text-center text-xs text-lyvo-primary font-bold hover:bg-blue-50 py-1.5 rounded-lg transition-colors">
                                        {expandForecasts ? 'Ver Menos' : 'Ver Mais'}
                                    </button>
                                )}
                            </div>
                        </div>

                         <div className="bg-white p-5 rounded-3xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-lyvo-text">Categorias</h2>
                                <button onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }} className="p-1.5 hover:bg-blue-50 text-lyvo-primary rounded-full">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {limits.slice(0, expandCategories ? undefined : 4).map(l => {
                                     const percent = l.monthlyLimit > 0 ? Math.min((l.spent / l.monthlyLimit) * 100, 100) : 0;
                                     return (
                                        <div key={l.id} className="group relative">
                                            <div className="flex justify-between items-center text-sm mb-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-semibold text-gray-700">{l.category}</span>
                                                    <button onClick={() => { setEditingCategory(l); setShowCategoryModal(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-lyvo-primary">
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <span className="text-gray-500 text-xs">{Math.round(percent)}%</span>
                                            </div>
                                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div style={{ width: `${percent}%` }} className={`h-full rounded-full ${percent > 90 ? 'bg-red-500' : 'bg-lyvo-secondary'}`}></div>
                                            </div>
                                        </div>
                                     );
                                })}
                                {limits.length > 4 && (
                                    <button 
                                        onClick={() => setExpandCategories(!expandCategories)}
                                        className="w-full mt-2 text-center text-xs text-lyvo-primary font-bold hover:bg-blue-50 py-1.5 rounded-lg transition-colors"
                                    >
                                        {expandCategories ? 'Ver Menos' : 'Ver Mais'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-3xl shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-lyvo-text">Análise de Evolução e Gastos</h2>
                                <button 
                                    onClick={() => setShowExportModal(true)}
                                    className="p-1.5 hover:bg-gray-50 text-gray-500 rounded-lg transition-colors flex items-center space-x-1"
                                >
                                    <FileText className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Extrair Relatório</span>
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Distribuição de Despesas</h3>
                                    <div className="h-48 w-full relative">
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
                                            <span className="text-sm font-black text-gray-800 leading-none">{formatCurrency(totalActualExpense)}</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={expenseData}
                                                    innerRadius={55}
                                                    outerRadius={75}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {expenseData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                                                    formatter={(value: number) => [formatCurrency(value), 'Valor']}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                                        {expenseData.map((d, i) => (
                                            <div key={i} className="flex items-center space-x-1.5">
                                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">{d.name} ({Math.round((d.value/totalActualExpense)*100)}%)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Evolução de Receitas</h3>
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={incomeEvolutionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} />
                                                <YAxis hide />
                                                <Tooltip 
                                                    cursor={{fill: '#F8FAFC'}}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                                                    formatter={(value: number) => [formatCurrency(value), 'Receita']}
                                                />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                                                    {incomeEvolutionData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index === 1 ? '#3A86FF' : '#CBD5E1'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Status de Evolução</p>
                                        <div className={`text-sm font-black flex items-center justify-center space-x-1 ${balanceData.income >= prevMonthIncome ? 'text-lyvo-secondary' : 'text-red-500'}`}>
                                            {balanceData.income >= prevMonthIncome ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                            <span>
                                                {prevMonthIncome > 0 
                                                    ? `${Math.abs(Math.round(((balanceData.income - prevMonthIncome) / prevMonthIncome) * 100))}% ${balanceData.income >= prevMonthIncome ? 'Crescimento' : 'Queda'}`
                                                    : 'Primeiro registro'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedCardForDetails && (
              <CardDetailModal 
                card={selectedCardForDetails} 
                month={selectedMonth} 
                year={selectedYear} 
                onClose={() => setSelectedCardForDetails(null)} 
                onRefresh={triggerUpdate}
                onPay={() => setPayInvoiceModal({ 
                  cardId: selectedCardForDetails.id, 
                  fullValue: 0 
                })}
              />
            )}

            {payInvoiceModal && (
              <PayInvoiceValueModal 
                fullValue={payInvoiceModal.fullValue}
                alreadyPaid={0}
                onConfirm={confirmPayment}
                onCancel={() => setPayInvoiceModal(null)}
              />
            )}

            {showAddBillModal && <AddFixedBillModal selectedMonth={selectedMonth} selectedYear={selectedYear} onClose={() => setShowAddBillModal(false)} onSave={() => { triggerUpdate(); setShowAddBillModal(false); }} />}
            {billToDelete && <DeleteBillModal onConfirm={handleConfirmDeleteBill} onCancel={() => setBillToDelete(null)} />}
            
            {forecastToDelete && (
              <DeleteForecastModal 
                onConfirm={handleConfirmDeleteForecast} 
                onCancel={() => setForecastToDelete(null)} 
              />
            )}

            {showAddForecastModal && (
              <AddForecastModal 
                selectedMonth={selectedMonth} 
                selectedYear={selectedYear} 
                initialData={editingForecast}
                onClose={() => { setShowAddForecastModal(false); setEditingForecast(null); }} 
                onSave={() => { triggerUpdate(); setShowAddForecastModal(false); setEditingForecast(null); }} 
              />
            )}

            {showCategoryModal && (
              <CategoryModal 
                initialData={editingCategory}
                onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
                onSave={() => { triggerUpdate(); setShowCategoryModal(false); setEditingCategory(null); }}
              />
            )}

            {showExportModal && (
                <ReportModal 
                    month={selectedMonth} 
                    year={selectedYear} 
                    expenseData={expenseData} 
                    incomeActual={balanceData.income}
                    incomePrev={prevMonthIncome}
                    onClose={() => setShowExportModal(false)} 
                />
            )}

            {showAddCardModal && <AddCreditCardModal onClose={() => setShowAddCardModal(false)} onSave={() => { triggerUpdate(); setShowAddCardModal(false); }} />}
            
            {itemToDelete && (
                 <ConfirmationModal 
                    message={itemToDelete.type === 'CARD' ? "Excluir cartão?" : "Excluir transação?"}
                    onConfirm={handleDelete}
                    onCancel={() => setItemToDelete(null)}
                />
            )}
        </div>
    );
};

const CardDetailModal: React.FC<{ card: CreditCard, month: number, year: number, onClose: () => void, onRefresh: () => void, onPay: () => void }> = ({ card, month, year, onClose, onRefresh, onPay }) => {
    const currentInvoice = 0;
    const paidValue = 0;
    const transactions = Transaction[] = [];
    const isPaid = false;
    const percent = Math.min((currentInvoice / card.limit) * 100, 100);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const handleUpdateTransaction = (id: string, date: string, value: number) => {
        //store.updateTransaction(id, { date, value });
        setEditingTransaction(null);
        onRefresh();
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col h-[85vh] animate-slide-up">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{card.name}</h2>
                        <p className="text-xs text-gray-400">Fatura de {new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-200/50 rounded-full text-gray-500"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Valor Total</span>
                                <p className="text-lg font-black text-blue-900 leading-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentInvoice)}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Valor Pago</span>
                                <p className="text-lg font-black text-green-700 leading-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paidValue)}</p>
                            </div>
                        </div>
                        {currentInvoice > paidValue && (
                            <div className="mt-2 pt-2 border-t border-blue-100 flex justify-between items-center">
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Resíduo Pendente</span>
                                <span className="text-sm font-bold text-red-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentInvoice - paidValue)}</span>
                            </div>
                        )}
                        <div className="h-2 bg-white/50 rounded-full overflow-hidden mt-3">
                            <div style={{ width: `${percent}%` }} className={`h-full ${card.color}`}></div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Lançamentos</h3>
                        <div className="space-y-4">
                            {transactions.map(t => (
                                <div key={t.id} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 group">
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => setEditingTransaction(t)} className="p-1.5 bg-gray-50 rounded-lg text-gray-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{t.description}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-red-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value)}</span>
                                </div>
                            ))}
                            {transactions.length === 0 && (
                                <div className="text-center py-10">
                                    <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">Nenhum lançamento nesta fatura.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                    {!isPaid ? (
                        <button 
                            onClick={onPay}
                            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-transform active:scale-95 ${card.color || 'bg-lyvo-primary'}`}
                        >
                            {paidValue > 0 ? 'Fazer Outro Pagamento' : `Pagar Fatura ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentInvoice)}`}
                        </button>
                    ) : (
                        <div className="w-full py-4 bg-green-100 text-green-600 rounded-2xl font-bold text-center">Fatura Quitada</div>
                    )}
                </div>
                
                {editingTransaction && (
                    <EditTransactionModal 
                        transaction={editingTransaction} 
                        onSave={handleUpdateTransaction} 
                        onCancel={() => setEditingTransaction(null)} 
                    />
                )}
            </div>
        </div>
    );
};

const EditTransactionModal: React.FC<{ transaction: Transaction, onSave: (id: string, date: string, val: number) => void, onCancel: () => void }> = ({ transaction, onSave, onCancel }) => {
    const [date, setDate] = useState(transaction.date.split('T')[0]);
    const [value, setValue] = useState(transaction.value.toString());

    return (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-scale-up">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Editar Lançamento</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Valor</label>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center">
                        <span className="text-gray-400 text-sm mr-2 font-medium">R$</span>
                        <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full outline-none bg-transparent font-bold text-gray-900" />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-900" />
                </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={onCancel} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold">Voltar</button>
              <button onClick={() => onSave(transaction.id, new Date(date).toISOString(), parseFloat(value))} className="flex-1 py-2.5 bg-lyvo-primary text-white rounded-xl font-bold shadow-lg">Salvar</button>
            </div>
          </div>
        </div>
    );
};

const PayInvoiceValueModal: React.FC<{ fullValue: number, alreadyPaid: number, onConfirm: (val: number) => void, onCancel: () => void }> = ({ fullValue, alreadyPaid, onConfirm, onCancel }) => {
    const remaining = fullValue - alreadyPaid;
    const [amount, setAmount] = useState(remaining.toString());

    return (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center animate-scale-up">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Valor do Pagamento</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center mb-4">
                <span className="text-gray-400 text-sm mr-2 font-medium">R$</span>
                <input 
                    type="number" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full text-lg outline-none bg-transparent font-bold text-gray-900"
                />
            </div>
            <p className="text-[10px] text-gray-400 mb-6 italic px-2">
                {parseFloat(amount) < remaining ? "Pagamento parcial: o saldo restante será levado para o próximo mês." : "Pagamento total: a fatura será quitada."}
            </p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold">Cancelar</button>
              <button onClick={() => onConfirm(parseFloat(amount))} className="flex-1 py-2.5 bg-lyvo-primary text-white rounded-xl font-bold shadow-lg">Confirmar</button>
            </div>
          </div>
        </div>
    );
};

const AddFixedBillModal: React.FC<{ selectedMonth: number, selectedYear: number, onClose: () => void, onSave: () => void }> = ({ selectedMonth, selectedYear, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [dueDay, setDueDay] = useState('5');
    const handleSave = () => {
        if (name && value) {
            store.addFixedBill({ name, baseValue: parseFloat(value), dueDay: parseInt(dueDay), category: 'Moradia', isRecurring: true }, selectedMonth, selectedYear);
            onSave();
        }
    };
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-slide-up">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Nova Conta Fixa</h3>
                <div className="space-y-4">
                    <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900 shadow-sm" />
                    <input type="number" placeholder="Valor" value={value} onChange={e => setValue(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900 shadow-sm" />
                    <input type="number" placeholder="Dia Venc." value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900 shadow-sm" />
                </div>
                <div className="flex gap-3 mt-6"><button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold">Cancelar</button><button onClick={handleSave} className="flex-1 py-3 bg-lyvo-primary text-white rounded-xl font-bold">Salvar</button></div>
            </div>
        </div>
    );
};

const AddForecastModal: React.FC<{ 
  selectedMonth: number, 
  selectedYear: number, 
  initialData?: Forecast | null,
  onClose: () => void, 
  onSave: () => void 
}> = ({ selectedMonth, selectedYear, initialData, onClose, onSave }) => {
    const [description, setDescription] = useState(initialData?.description || '');
    const [value, setValue] = useState(initialData?.value?.toString() || '');
    const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);

    const handleSave = () => {
        if (description && value) {
            if (initialData) {
              store.updateForecast(initialData.id, {
                description,
                value: parseFloat(value),
                isRecurring
              });
            } else {
              store.addForecast({ 
                  description, 
                  value: parseFloat(value), 
                  type: 'EXPECTED_INCOME', 
                  isRecurring,
                  expectedDate: new Date(selectedYear, selectedMonth, 15).toISOString()
              }, selectedMonth, selectedYear);
            }
            onSave();
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-slide-up">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{initialData ? 'Editar Receita Prevista' : 'Nova Receita Prevista'}</h3>
                <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block ml-1">Descrição</label>
                      <input type="text" placeholder="Ex: Venda de produto" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block ml-1">Valor Esperado</label>
                      <input type="number" placeholder="0,00" value={value} onChange={e => setValue(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900 shadow-sm" />
                    </div>
                    
                    <div className="flex items-center justify-between p-1">
                      <span className="text-sm font-bold text-gray-700">Repetir nos meses seguintes?</span>
                      <button 
                          onClick={() => setIsRecurring(!isRecurring)}
                          className={`w-10 h-6 rounded-full p-1 transition-colors ${isRecurring ? 'bg-lyvo-primary' : 'bg-gray-300'}`}
                      >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold">Cancelar</button>
                  <button onClick={handleSave} className="flex-1 py-3 bg-lyvo-primary text-white rounded-xl font-bold shadow-lg shadow-blue-100">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const CategoryModal: React.FC<{ 
    initialData?: BudgetLimit | null, 
    onClose: () => void, 
    onSave: () => void 
}> = ({ initialData, onClose, onSave }) => {
    const [name, setName] = useState(initialData?.category || '');
    const [limit, setLimit] = useState(initialData?.monthlyLimit?.toString() || '');

    const handleSave = () => {
        if (name && limit) {
            if (initialData) {
                store.updateBudgetLimit(initialData.id, name, parseFloat(limit));
            } else {
                store.addBudgetLimit(name, parseFloat(limit));
            }
            onSave();
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-slide-up">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{initialData ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block ml-1">Nome da Categoria</label>
                      <input type="text" placeholder="Ex: Lazer" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900 shadow-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block ml-1">Limite Mensal</label>
                      <input type="number" placeholder="0,00" value={limit} onChange={e => setLimit(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900 shadow-sm" />
                    </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold">Cancelar</button>
                  <button onClick={handleSave} className="flex-1 py-3 bg-lyvo-primary text-white rounded-xl font-bold shadow-lg shadow-blue-100">Salvar</button>
                </div>
            </div>
        </div>
    );
};

const ReportModal: React.FC<{ 
    month: number, 
    year: number, 
    expenseData: any[],
    incomeActual: number,
    incomePrev: number,
    onClose: () => void 
}> = ({ month, year, expenseData, incomeActual, incomePrev, onClose }) => {
    const monthName = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const totalExp = expenseData.reduce((s, i) => s + i.value, 0);
    const balance = incomeActual - totalExp;
    
    return (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[80vh] animate-scale-up overflow-hidden border border-white/20">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Relatório de Evolução</h3>
                        <p className="text-sm text-lyvo-primary font-bold uppercase tracking-widest mt-1 opacity-70">{monthName}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-gray-200/50 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Receita Atual</span>
                            <p className="text-lg font-black text-blue-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomeActual)}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mês Anterior</span>
                            <p className="text-lg font-black text-gray-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(incomePrev)}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 border-l-4 border-lyvo-primary pl-3">Distribuição de Despesas</h4>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
                                    <th className="pb-4 px-2">Categoria</th>
                                    <th className="pb-4 px-2 text-right">Valor</th>
                                    <th className="pb-4 px-2 text-right">%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {expenseData.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="py-5 px-2 font-bold text-gray-800">{item.name}</td>
                                        <td className="py-5 px-2 text-right text-red-500 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}</td>
                                        <td className="py-5 px-2 text-right text-gray-400 font-bold">{Math.round((item.value/totalExp)*100)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 bg-gray-900 text-white rounded-[2rem] flex justify-between items-center shadow-xl">
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Final do Período</span>
                            <p className="text-2xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}</p>
                        </div>
                        <div className="text-right">
                            <span className={`text-xs font-black uppercase ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {balance >= 0 ? 'Positivo' : 'Negativo'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-4">
                    <button 
                        onClick={() => window.print()}
                        className="flex-1 py-4 bg-lyvo-text text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black transition active:scale-95 flex items-center justify-center space-x-2"
                    >
                        <Download className="w-4 h-4" />
                        <span>Exportar PDF</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteBillModal: React.FC<{ onConfirm: (mode: 'ONLY_THIS' | 'ALL_FUTURE') => void, onCancel: () => void }> = ({ onConfirm, onCancel }) => (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
        <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Conta Fixa</h3>
            <div className="space-y-3 mt-4">
                <button onClick={() => onConfirm('ONLY_THIS')} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Apenas este mês</button>
                <button onClick={() => onConfirm('ALL_FUTURE')} className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors">Deste mês e todas as futuras</button>
                <button onClick={onCancel} className="w-full py-2 text-gray-400 font-bold">Cancelar</button>
            </div>
        </div>
    </div>
);

const DeleteForecastModal: React.FC<{ onConfirm: (mode: 'ONLY_THIS' | 'ALL_FUTURE') => void, onCancel: () => void }> = ({ onConfirm, onCancel }) => (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
        <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center animate-scale-up">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Receita Prevista</h3>
            <p className="text-xs text-gray-500 mb-6">Deseja remover esta previsão?</p>
            <div className="space-y-3">
                <button onClick={() => onConfirm('ONLY_THIS')} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Apenas este mês</button>
                <button onClick={() => onConfirm('ALL_FUTURE')} className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors">Deste mês e todas as futuras</button>
                <button onClick={onCancel} className="w-full py-2 text-gray-400 font-bold">Cancelar</button>
            </div>
        </div>
    </div>
);

const AddCreditCardModal: React.FC<{ onClose: () => void, onSave: () => void }> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [limit, setLimit] = useState('');
    const [dueDay, setDueDay] = useState('10');
    const [bestDay, setBestDay] = useState('3');

    const handleSave = () => { 
      if (name && limit) { 
        store.addCreditCard({ 
          name, 
          limit: parseFloat(limit), 
          dueDay: parseInt(dueDay), 
          bestPurchaseDay: parseInt(bestDay), 
          color: 'bg-lyvo-accent', 
          brand: 'mastercard' 
        }); 
        onSave(); 
      } 
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-slide-up">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Novo Cartão</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block ml-1">Nome do Cartão</label>
                <input type="text" placeholder="Ex: Nubank, Inter" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900 shadow-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block ml-1">Limite do Cartão</label>
                <input type="number" placeholder="0,00" value={limit} onChange={e => setLimit(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900 shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block ml-1">Dia Vencimento</label>
                  <select value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900 shadow-sm">
                    {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block ml-1">Melhor Dia</label>
                  <select value={bestDay} onChange={e => setBestDay(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 text-gray-900 shadow-sm">
                    {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={onClose} className="flex-1 py-3 text-gray-500 font-bold">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-lyvo-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95">Salvar</button>
            </div>
          </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{ message: string, onConfirm: () => void, onCancel: () => void }> = ({ message, onConfirm, onCancel }) => (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl text-center animate-scale-up">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar?</h3>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-lyvo-primary text-white rounded-xl font-bold">Confirmar</button>
        </div>
      </div>
    </div>
);

export default FinanceDashboard;
