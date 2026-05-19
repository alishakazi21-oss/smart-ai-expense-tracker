import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Target, 
  LogOut, 
  Plus, 
  Search, 
  Filter,
  Trash2,
  Edit2,
  ChevronRight,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Calendar,
  Brain
} from "lucide-react";
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';
import AIInsightsPanel from "../components/AIInsightsPanel";

const API_BASE = "/api";

interface Expense {
    id: number;
    title: string;
    amount: number;
    category: string;
    date: string;
    note: string;
}

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment", "Health", "Bills", "Education", "Other"
];

const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#94a3b8'];

interface Summary {
    total: number;
    budget: number;
    remaining: number;
    by_category: Record<string, number>;
    count: number;
}

interface PieEntry {
    name: string;
    value: number;
}

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [budgetInput, setBudgetInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    
    // Form State
    const [formData, setFormData] = useState({
        title: "",
        amount: "",
        category: "",
        date: format(new Date(), 'yyyy-MM-dd'),
        note: ""
    });

    const navigate = useNavigate();
    const username = localStorage.getItem("username");

    const fetchData = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [expRes, sumRes] = await Promise.all([
                axios.get(`${API_BASE}/expenses`, config),
                axios.get(`${API_BASE}/summary`, config)
            ]);
            setExpenses(expRes.data);
            setSummary(sumRes.data);
            setBudgetInput(sumRes.data.budget.toString());
        } catch (err) {
            console.error(err);
            localStorage.removeItem("token");
            navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        navigate("/login");
    };

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        try {
            if (editingExpense) {
                await axios.put(`${API_BASE}/expenses/${editingExpense.id}`, formData, config);
            } else {
                await axios.post(`${API_BASE}/expenses`, formData, config);
            }
            setIsModalOpen(false);
            setEditingExpense(null);
            setFormData({
                title: "",
                amount: "",
                category: "",
                date: format(new Date(), 'yyyy-MM-dd'),
                note: ""
            });
            fetchData();
        } catch (err) {
            alert("Error saving expense");
        }
    };

    const handleDeleteExpense = async (id: number) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.delete(`${API_BASE}/expenses/${id}`, config);
            fetchData();
        } catch (err) {
            alert("Error deleting expense");
        }
    };

    const handleSaveBudget = async () => {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };
        try {
            await axios.put(`${API_BASE}/budget`, { monthly_budget: parseFloat(budgetInput) }, config);
            fetchData();
            alert("Budget updated!");
        } catch (err) {
            alert("Error updating budget");
        }
    };

    const openEditModal = (exp: Expense) => {
        setEditingExpense(exp);
        setFormData({
            title: exp.title,
            amount: exp.amount.toString(),
            category: exp.category,
            date: exp.date,
            note: exp.note
        });
        setIsModalOpen(true);
    };

    if (loading) return <div className="min-h-screen bg-[#030303] flex items-center justify-center text-white">Loading...</div>;

    const filteredExpenses = expenses.filter(exp => {
        const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "" || exp.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const pieData: PieEntry[] = summary ? Object.entries(summary.by_category).map(([name, value]) => ({ name, value })) : [];

    const total = summary?.total || 0;
    const budget = summary?.budget || 0;
    const remaining = summary?.remaining || 0;
    const count = summary?.count || 0;
    const progress = budget > 0 ? Math.round((total / budget) * 100) : 0;

    return (
        <div className="flex min-h-screen bg-[#030303] text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-white/5 border-r border-white/10 p-6 flex flex-col gap-8 hidden md:flex">
                <div className="flex items-center gap-3 px-2 group cursor-pointer">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-rose-500 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-indigo-500/20" />
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20" />
                        <TrendingUp className="relative z-10 text-white w-6 h-6" />
                    </div>
                    <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">SpendWise</span>
                </div>
                
                <nav className="flex flex-col gap-2">
                    {[
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                        { id: 'expenses', icon: Receipt, label: 'Expenses' },
                        { id: 'analytics', icon: PieChart, label: 'Analytics' },
                        { id: 'ai', icon: Brain, label: 'AI Advisor' },
                        { id: 'budget', icon: Target, label: 'Budget' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                activeTab === item.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-white/40 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="p-6 md:px-8 border-b border-white/10 flex justify-between items-center bg-[#030303]/80 backdrop-blur-md z-30">
                    <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
                            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Add Expense
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                            <span className="text-xs text-white/60">{username}</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                    {/* DASHBOARD TAB */}
                    {activeTab === 'dashboard' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <StatCard label="Total Spent" value={`₹${total}`} icon={Wallet} color="text-rose-400" />
                                <StatCard label="Monthly Budget" value={`₹${budget}`} icon={Target} color="text-indigo-400" />
                                <StatCard label="Remaining" value={`₹${remaining}`} icon={TrendingUp} color={remaining < 0 ? "text-rose-500" : "text-emerald-400"} />
                                <StatCard label="Transactions" value={count} icon={Receipt} color="text-amber-400" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Daily Spending Trend Area Chart */}
                                    {summary && (summary as any).daily_trend && (summary as any).daily_trend.length > 0 && (
                                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                            <h3 className="text-lg font-bold mb-6">Daily Spending Trend</h3>
                                            <div className="h-[250px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={(summary as any).daily_trend}>
                                                        <defs>
                                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                                        <XAxis dataKey="date" stroke="#ffffff40" tickFormatter={(d) => d.split("-")[2] || d} />
                                                        <YAxis stroke="#ffffff40" />
                                                        <ReTooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '12px' }} formatter={(v) => [`₹${v}`, 'Spent']} />
                                                        <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold">Recent Transactions</h3>
                                            <button onClick={() => setActiveTab('expenses')} className="text-indigo-400 text-sm hover:underline">See all</button>
                                        </div>
                                        <div className="space-y-4">
                                            {expenses.slice(0, 5).map(exp => (
                                                <div key={exp.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                            {exp.category.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{exp.title}</p>
                                                            <p className="text-xs text-white/40">{exp.category} • {exp.date}</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-bold text-rose-400">-₹{exp.amount}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                        <h3 className="text-lg font-bold mb-6">Budget Usage</h3>
                                        <div className="relative pt-1">
                                            <div className="flex mb-2 items-center justify-between text-xs">
                                                <span className="text-white/60">Progress</span>
                                                <span className="font-bold text-indigo-400">
                                                    {progress}%
                                                </span>
                                            </div>
                                            <div className="overflow-hidden h-3 text-xs flex rounded-full bg-white/5">
                                                <div 
                                                    style={{ width: `${Math.min(100, progress)}%` }}
                                                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${remaining < 0 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                                ></div>
                                            </div>
                                            <p className="mt-4 text-xs text-white/40 leading-relaxed italic">
                                                {remaining < 0 
                                                    ? "Warning: You have exceeded your monthly budget!" 
                                                    : "Great! You are still within your budget limits."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl h-[300px]">
                                        <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <ReTooltip />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* EXPENSES TAB */}
                    {activeTab === 'expenses' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Search transactions..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <select 
                                        className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                    >
                                        <option value="">All Categories</option>
                                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/5 text-white/40 text-sm">
                                            <th className="px-6 py-4 font-medium">Date</th>
                                            <th className="px-6 py-4 font-medium">Title</th>
                                            <th className="px-6 py-4 font-medium">Category</th>
                                            <th className="px-6 py-4 font-medium text-right">Amount</th>
                                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredExpenses.map(exp => (
                                            <tr key={exp.id} className="hover:bg-white/[0.02] transition-all group">
                                                <td className="px-6 py-4 text-sm text-white/40">{exp.date}</td>
                                                <td className="px-6 py-4 font-medium">{exp.title}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                                                        {exp.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-rose-400">₹{exp.amount}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openEditModal(exp)} className="p-2 text-white/40 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 text-white/40 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl min-h-[400px]">
                                <h3 className="text-xl font-bold mb-8">Category Breakdown</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={pieData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                            <XAxis dataKey="name" stroke="#ffffff40" />
                                            <YAxis stroke="#ffffff40" />
                                            <ReTooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
                                            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                                <h3 className="text-xl font-bold mb-8">Detailed Breakdown</h3>
                                <div className="space-y-6">
                                {pieData.sort((a, b) => (b.value as number) - (a.value as number)).map((entry, idx) => (
                                    <div key={entry.name} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{entry.name}</span>
                                            <span className="text-white/60">₹{entry.value}</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full">
                                            <div 
                                                className="h-full rounded-full" 
                                                style={{ width: `${summary ? (entry.value / summary.total) * 100 : 0}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AI ADVISOR TAB */}
                    {activeTab === 'ai' && (
                        <AIInsightsPanel onRefreshExpenses={fetchData} />
                    )}

                    {/* BUDGET TAB */}
                    {activeTab === 'budget' && (
                        <div className="max-w-xl mx-auto space-y-8 py-12">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-indigo-600/10 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto text-4xl border border-indigo-500/20 shadow-xl shadow-indigo-500/10">🎯</div>
                                <h3 className="text-3xl font-bold">Set Monthly Budget</h3>
                                <p className="text-white/40">Define your spending limit for the month to stay on track.</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] space-y-6">
                                <div>
                                    <label className="block text-white/60 text-sm mb-3 font-medium">Monthly Limit (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-white/20">₹</span>
                                        <input 
                                            type="number" 
                                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl pl-12 pr-6 py-6 text-3xl font-bold focus:outline-none focus:border-indigo-500 transition-all text-indigo-400"
                                            value={budgetInput}
                                            onChange={(e) => setBudgetInput(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSaveBudget}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 text-lg"
                                >
                                    Update Budget
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-bold">{editingExpense ? "Edit Expense" : "Add Expense"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-all text-2xl">✕</button>
                        </div>
                        
                        <form onSubmit={handleSaveExpense} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-white/40 text-sm mb-2">Title</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-white/40 text-sm mb-2">Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                        required
                                        value={formData.amount}
                                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-white/40 text-sm mb-2">Category</label>
                                    <select 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    >
                                        <option value="" className="bg-[#0a0a0a]">Select...</option>
                                        {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#0a0a0a]">{cat}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-white/40 text-sm mb-2">Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-white/40 text-sm mb-2">Note (Optional)</label>
                                <textarea 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                                    value={formData.note}
                                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
                            >
                                {editingExpense ? "Update Expense" : "Save Transaction"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-white/20 transition-all group">
            <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
                    <Icon size={20} />
                </div>
                <p className="text-white/40 text-sm font-medium">{label}</p>
            </div>
            <h3 className={`text-2xl font-bold tracking-tight ${color === "text-rose-500" || color === "text-rose-400" ? 'text-rose-400' : 'text-white'}`}>{value}</h3>
        </div>
    );
}
