'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Calendar, Tag, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Expense {
    id: string;
    user_id: string;
    amount: number;
    category: string | null;
    description: string | null;
    expense_date: string;
    created_at: string;
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [summary, setSummary] = useState({ total_amount: 0, expense_count: 0, by_category: {} });
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        amount: '',
        category: '',
        description: '',
        expense_date: format(new Date(), 'yyyy-MM-dd')
    });

    const mockUserId = 'user_123'; // In production, get from auth session

    useEffect(() => {
        fetchExpenses();
        fetchSummary();
    }, []);

    const fetchExpenses = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/expenses/?user_id=${mockUserId}&limit=50`
            );
            if (response.ok) {
                const data = await response.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error('Failed to fetch expenses:', error);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/expenses/summary?user_id=${mockUserId}`
            );
            if (response.ok) {
                const data = await response.json();
                setSummary(data);
            }
        } catch (error) {
            console.error('Failed to fetch summary:', error);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/expenses/?user_id=${mockUserId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: parseFloat(formData.amount),
                        category: formData.category || null,
                        description: formData.description || null,
                        expense_date: formData.expense_date
                    })
                }
            );

            if (response.ok) {
                setFormData({
                    amount: '',
                    category: '',
                    description: '',
                    expense_date: format(new Date(), 'yyyy-MM-dd')
                });
                setShowAddForm(false);
                fetchExpenses();
                fetchSummary();
            }
        } catch (error) {
            console.error('Failed to add expense:', error);
        }
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/expenses/${expenseId}?user_id=${mockUserId}`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                fetchExpenses();
                fetchSummary();
            }
        } catch (error) {
            console.error('Failed to delete expense:', error);
        }
    };

    // Prepare chart data
    const categoryData = Object.entries(summary.by_category || {}).map(([name, value]) => ({
        name,
        amount: value
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <header className="glass-dark border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Personal Expenses</h1>
                            <p className="text-sm text-gray-400 mt-1">Track your spending</p>
                        </div>
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Expense
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Summary Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="card-hover bg-gradient-to-br from-primary-500 to-primary-700 text-white p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm opacity-90 mb-1">Total Spent</div>
                                <div className="text-3xl font-bold">
                                    ${summary.total_amount.toLocaleString()}
                                </div>
                            </div>
                            <DollarSign size={32} className="opacity-80" />
                        </div>
                    </div>

                    <div className="card-hover bg-gradient-to-br from-signal-good to-signal-excellent text-white p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm opacity-90 mb-1">Total Expenses</div>
                                <div className="text-3xl font-bold">{summary.expense_count}</div>
                            </div>
                            <Calendar size={32} className="opacity-80" />
                        </div>
                    </div>

                    <div className="card-hover bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm opacity-90 mb-1">Average</div>
                                <div className="text-3xl font-bold">
                                    ${summary.expense_count > 0 ? (summary.total_amount / summary.expense_count).toFixed(2) : '0.00'}
                                </div>
                            </div>
                            <TrendingUp size={32} className="opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Category Breakdown Chart */}
                {categoryData.length > 0 && (
                    <div className="card-hover bg-gray-800/50 backdrop-blur-xl p-6 mb-8">
                        <h3 className="text-lg font-semibold text-white mb-6">Spending by Category</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                    labelStyle={{ color: '#f3f4f6' }}
                                />
                                <Bar dataKey="amount" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Add Expense Form */}
                {showAddForm && (
                    <div className="card-hover bg-gray-800/50 backdrop-blur-xl p-6 mb-8">
                        <h3 className="text-lg font-semibold text-white mb-6">Add New Expense</h3>
                        <form onSubmit={handleAddExpense} className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="e.g., Food, Transport"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.expense_date}
                                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                    placeholder="Optional notes"
                                />
                            </div>

                            <div className="md:col-span-2 flex gap-4">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition"
                                >
                                    Save Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Expenses List */}
                <div className="card-hover bg-gray-800/50 backdrop-blur-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Recent Expenses</h3>
                    <div className="space-y-3">
                        {expenses.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No expenses yet. Add your first expense to get started.</p>
                            </div>
                        ) : (
                            expenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                                            <Tag className="text-primary-500" size={20} />
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold">${expense.amount.toFixed(2)}</div>
                                            <div className="text-sm text-gray-400">
                                                {expense.category || 'Uncategorized'} • {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                                            </div>
                                            {expense.description && (
                                                <div className="text-xs text-gray-500 mt-1">{expense.description}</div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteExpense(expense.id)}
                                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
