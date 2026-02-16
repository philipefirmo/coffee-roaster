import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Check, Edit2 } from 'lucide-react';
import { MultipleMovementEntry } from '../types';
import { supabase } from '../lib/supabase';

interface MovementFormEntry {
    id: string;
    coffeeId: string;
    pr: string;
    date: string;
    quantity: string;
    observations: string;
}

interface MultipleMovementFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const MultipleMovementForm: React.FC<MultipleMovementFormProps> = ({ onSuccess, onCancel }) => {
    const { state, actions } = useApp();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [entries, setEntries] = useState<MovementFormEntry[]>([
        {
            id: crypto.randomUUID(),
            coffeeId: '',
            pr: '',
            date: new Date().toISOString().split('T')[0],
            quantity: '',
            observations: '',
        },
    ]);

    const [showSummary, setShowSummary] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado para validação de PRs em tempo real
    const [prErrors, setPrErrors] = useState<Record<string, string>>({});
    const [validatingPrs, setValidatingPrs] = useState<Record<string, boolean>>({});

    // Ordenar cafés alfabeticamente
    const sortedCoffees = [...state.coffees].sort((a, b) => a.name.localeCompare(b.name));

    const addEntry = () => {
        setEntries([
            ...entries,
            {
                id: crypto.randomUUID(),
                coffeeId: '',
                pr: '',
                date: new Date().toISOString().split('T')[0],
                quantity: '',
                observations: '',
            },
        ]);
    };

    const removeEntry = (id: string) => {
        if (entries.length === 1) {
            showToast('Deve haver pelo menos uma entrada', 'error');
            return;
        }
        setEntries(entries.filter(entry => entry.id !== id));
    };

    const updateEntry = (id: string, field: keyof MovementFormEntry, value: string) => {
        setEntries(entries.map(entry =>
            entry.id === id ? { ...entry, [field]: value } : entry
        ));

        // Acionar validação se for campo PR
        if (field === 'pr') {
            const timeoutId = setTimeout(() => {
                validatePr(id, value);
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    };

    const validatePr = async (entryId: string, prValue: string) => {
        // 1. Limpar erro se vazio
        if (!prValue) {
            setPrErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[entryId];
                return newErrors;
            });
            return;
        }

        // 2. Validação Local: Duplicidade no mesmo formulário
        // (Já era feita no validateEntries, mas vamos fazer realtime também)
        const isDuplicateLocal = entries.some(entry =>
            entry.id !== entryId && entry.pr === prValue
        );

        if (isDuplicateLocal) {
            setPrErrors(prev => ({ ...prev, [entryId]: 'PR duplicado neste formulário' }));
            return;
        }

        // Limpar erro local antes de verificar global
        setPrErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[entryId];
            return newErrors;
        });

        // 3. Validação Global
        const entry = entries.find(e => e.id === entryId);
        if (!entry || !entry.coffeeId) return;

        setValidatingPrs(prev => ({ ...prev, [entryId]: true }));

        try {
            const { data, error } = await supabase
                .from('movements')
                .select('coffee_id, coffees(name)')
                .eq('pr', prValue)
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                const existingCoffeeId = data[0].coffee_id;
                // @ts-ignore
                const existingCoffeeName = data[0].coffees?.name || 'outro café';

                if (existingCoffeeId !== entry.coffeeId) {
                    setPrErrors(prev => ({ ...prev, [entryId]: `PR já pertence ao café "${existingCoffeeName}"` }));
                }
            }
        } catch (err) {
            console.error("Erro validando PR:", err);
        } finally {
            setValidatingPrs(prev => {
                const newState = { ...prev };
                delete newState[entryId];
                return newState;
            });
        }
    };

    const validateEntries = (): boolean => {
        // Validar campos obrigatórios
        for (const entry of entries) {
            if (!entry.coffeeId) {
                showToast('Todos os campos de Café são obrigatórios', 'error');
                return false;
            }
            if (!entry.pr.trim()) {
                showToast('Todos os campos de PR são obrigatórios', 'error');
                return false;
            }
            if (!entry.date) {
                showToast('Todos os campos de Data são obrigatórios', 'error');
                return false;
            }
            if (!entry.quantity || Number(entry.quantity) <= 0) {
                showToast('Todos os campos de Quantidade devem ser maiores que zero', 'error');
                return false;
            }
        }

        // Validar datas (somente passadas ou hoje)
        const today = new Date().toISOString().split('T')[0];
        for (const entry of entries) {
            if (entry.date > today) {
                showToast('Somente datas passadas ou atual são permitidas', 'error');
                return false;
            }
        }

        // Validar PR únicos entre cafés diferentes
        const prCoffeeMap = new Map<string, string>();
        for (const entry of entries) {
            if (prCoffeeMap.has(entry.pr)) {
                const existingCoffeeId = prCoffeeMap.get(entry.pr);
                if (existingCoffeeId !== entry.coffeeId) {
                    const coffee1 = state.coffees.find(c => c.id === existingCoffeeId);
                    const coffee2 = state.coffees.find(c => c.id === entry.coffeeId);
                    showToast(
                        `O PR ${entry.pr} está sendo usado para cafés diferentes (${coffee1?.name} e ${coffee2?.name})`,
                        'error'
                    );
                    return false;
                }
            }
            prCoffeeMap.set(entry.pr, entry.coffeeId);
        }

        // Validar se há erros de PR pendentes
        if (Object.keys(prErrors).length > 0) {
            showToast('Corrija os erros de PR antes de continuar', 'error');
            return false;
        }

        return true;
    };

    const handleShowSummary = () => {
        if (validateEntries()) {
            setShowSummary(true);
        }
    };

    const handleEdit = () => {
        setShowSummary(false);
    };

    const handleConfirm = async () => {
        if (!user) {
            showToast('Erro: Usuário não identificado. Por favor, faça login novamente.', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const movements = entries.map(entry => {
                const coffee = state.coffees.find(c => c.id === entry.coffeeId);
                return {
                    coffeeId: entry.coffeeId,
                    coffeeName: coffee?.name || '',
                    pr: entry.pr,
                    date: entry.date,
                    quantity: Number(entry.quantity),
                    observations: entry.observations,
                    type: 'entrada' as const, // Explicitamente definindo, embora o backend/context possa tratar
                    responsible: user.user_metadata?.name || user.email || 'Usuário',
                };
            });

            // Convertendo para o tipo esperado pelo Context (Omit<Movement, 'id'>)
            // @ts-ignore - O tipo MultipleMovementEntry pode não bater exatamente, mas o contexto espera Omit<Movement, 'id'>
            const movementsForContext = movements.map(m => ({
                ...m,
                timestamp: new Date(m.date + 'T12:00:00').toISOString(), // Data aproximada para ordenação
            }));

            await actions.addMultipleMovements(movementsForContext);

            if (onSuccess) onSuccess();

        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSummary) {
        // Card de Resumo
        const totalQuantity = entries.reduce((sum, entry) => sum + Number(entry.quantity), 0);
        const groupedByCoffee = entries.reduce((acc, entry) => {
            const coffee = state.coffees.find(c => c.id === entry.coffeeId);
            const coffeeName = coffee?.name || 'Desconhecido';
            if (!acc[coffeeName]) {
                acc[coffeeName] = [];
            }
            acc[coffeeName].push(entry);
            return acc;
        }, {} as Record<string, MovementFormEntry[]>);

        return (
            <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
                    <h2 className="text-2xl font-bold text-espresso-800 dark:text-espresso-200 flex items-center gap-2">
                        <Check className="w-6 h-6" />
                        Resumo da Movimentação
                    </h2>

                    <div className="space-y-4">
                        <div className="bg-natural-50 dark:bg-gray-700 p-4 rounded-lg">
                            <p className="text-sm font-bold text-black dark:text-white mb-2">Total Geral</p>
                            <p className="text-2xl font-bold text-espresso-600 dark:text-espresso-400">{totalQuantity}g</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{entries.length} entrada(s)</p>
                        </div>

                        {Object.entries(groupedByCoffee).map(([coffeeName, coffeeEntries]) => {
                            const coffeeTotal = coffeeEntries.reduce((sum, e) => sum + Number(e.quantity), 0);
                            return (
                                <div key={coffeeName} className="border dark:border-gray-600 rounded-lg p-4 space-y-3">
                                    <h3 className="font-bold text-lg text-espresso-700 dark:text-espresso-300">{coffeeName}</h3>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total: {coffeeTotal}g</p>

                                    <div className="space-y-2">
                                        {coffeeEntries.map((entry) => (
                                            <div key={entry.id} className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-600">
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="font-bold text-gray-700 dark:text-gray-300">PR:</span>
                                                        <span className="ml-2 text-black dark:text-white">{entry.pr}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-700 dark:text-gray-300">Quantidade:</span>
                                                        <span className="ml-2 text-black dark:text-white">{entry.quantity}g</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-700 dark:text-gray-300">Data:</span>
                                                        <span className="ml-2 text-black dark:text-white">
                                                            {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                    {entry.observations && (
                                                        <div className="col-span-2">
                                                            <span className="font-bold text-gray-700 dark:text-gray-300">Obs:</span>
                                                            <span className="ml-2 text-black dark:text-white">{entry.observations}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleEdit}
                            disabled={isSubmitting}
                            className="flex-1 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso-500 touch-target ripple flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Edit2 className="w-4 h-4" />
                            Editar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="flex-1 py-3 text-sm font-bold text-white bg-espresso-600 border border-transparent rounded-lg shadow-sm hover:bg-espresso-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso-500 touch-target ripple flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Confirmar Movimentação
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Formulário de Entradas
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-black dark:text-white">Múltiplas Entradas de Café</h2>
                <button
                    type="button"
                    onClick={addEntry}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-espresso-600 rounded-lg hover:bg-espresso-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso-500 touch-target"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Entrada
                </button>
            </div>

            <div className="space-y-4">
                {entries.map((entry, index) => (
                    <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-4 relative">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-espresso-700 dark:text-espresso-300">Entrada #{index + 1}</h3>
                            {entries.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeEntry(entry.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors touch-target"
                                    aria-label="Remover entrada"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Café */}
                            <div>
                                <label className="block text-sm font-bold text-black dark:text-white mb-1">Café *</label>
                                <select
                                    value={entry.coffeeId}
                                    onChange={(e) => updateEntry(entry.id, 'coffeeId', e.target.value)}
                                    className="w-full h-11 rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium touch-target"
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {sortedCoffees.map((coffee) => (
                                        <option key={coffee.id} value={coffee.id}>{coffee.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* PR */}
                            <div>
                                <label className="block text-sm font-bold text-black dark:text-white mb-1">PR / Lote *</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={entry.pr}
                                    onChange={(e) => updateEntry(entry.id, 'pr', e.target.value)}
                                    className={`w-full h-11 rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 touch-target ${prErrors[entry.id] ? 'border-red-500 focus:border-red-500' : ''}`}
                                    placeholder="Digite o código do PR"
                                    required
                                />
                                {prErrors[entry.id] && (
                                    <p className="text-xs whitespace-nowrap text-red-500 mt-1 font-bold">{prErrors[entry.id]}</p>
                                )}
                            </div>

                            {/* Data */}
                            <div>
                                <label className="block text-sm font-bold text-black dark:text-white mb-1">Data da Torra *</label>
                                <input
                                    type="date"
                                    value={entry.date}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => updateEntry(entry.id, 'date', e.target.value)}
                                    className="w-full h-11 rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium touch-target"
                                    required
                                />
                            </div>

                            {/* Quantidade */}
                            <div>
                                <label className="block text-sm font-bold text-black dark:text-white mb-1">Quantidade (g) *</label>
                                <input
                                    type="number"
                                    value={entry.quantity}
                                    onChange={(e) => updateEntry(entry.id, 'quantity', e.target.value)}
                                    className="w-full h-11 rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 touch-target"
                                    placeholder="0"
                                    min="1"
                                    required
                                />
                            </div>
                        </div>

                        {/* Observações */}
                        <div>
                            <label className="block text-sm font-bold text-black dark:text-white mb-1">Observações</label>
                            <textarea
                                value={entry.observations}
                                onChange={(e) => updateEntry(entry.id, 'observations', e.target.value)}
                                className="w-full h-20 rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 touch-target"
                                rows={2}
                                placeholder="Detalhes opcionais..."
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2 w-full">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso-500 touch-target ripple"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleShowSummary}
                    className="flex-1 py-3 text-sm font-bold text-white bg-espresso-600 border border-transparent rounded-lg shadow-sm hover:bg-espresso-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso-500 touch-target ripple"
                >
                    Continuar
                </button>
            </div>
        </div>
    );
};

export default MultipleMovementForm;
