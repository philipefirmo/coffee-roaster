import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { History as HistoryIcon, Plus, Minus, Filter, Calendar, Edit2, Trash2, Search, X } from 'lucide-react';
import { formatGrams } from '../lib/utils';
import Modal from './Modal';
import MovementForm from './MovementForm';
import { Movement } from '../types';

const History: React.FC = () => {
  const { state, actions } = useApp();
  const [filterType, setFilterType] = useState<'all' | 'entrada' | 'saida'>('all');
  const [filterText, setFilterText] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const filteredMovements = state.movements.filter(movement => {
    // Type Filter
    if (filterType !== 'all' && movement.type !== filterType) return false;

    // Date Filter
    if (filterDate) {
      const movementDate = new Date(movement.timestamp).toISOString().split('T')[0];
      if (movementDate !== filterDate) return false;
    }

    // Text Filter (Coffee Name, PR, or Responsible)
    if (filterText) {
      const term = filterText.toLowerCase();
      const coffeeMatch = movement.coffeeName.toLowerCase().includes(term);
      const prMatch = movement.pr.toLowerCase().includes(term);
      const responsibleMatch = movement.responsible ? movement.responsible.toLowerCase().includes(term) : false;
      
      if (!coffeeMatch && !prMatch && !responsibleMatch) return false;
    }

    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getTypeIcon = (type: 'entrada' | 'saida') => {
    return type === 'entrada' ? <Plus size={12} /> : <Minus size={12} />;
  };

  const handleDelete = (movement: Movement) => {
    if (window.confirm(`Tem certeza que deseja excluir esta movimentação de ${formatGrams(movement.quantity)} do café ${movement.coffeeName}? O estoque será revertido.`)) {
      actions.deleteMovement(movement.id);
    }
  };

  const handleEdit = (movement: Movement) => {
    setEditingMovement(movement);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-natural-200 dark:border-gray-700 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-natural-100 dark:bg-gray-700 p-2 rounded-lg text-black dark:text-white">
            <HistoryIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black dark:text-white">Histórico de Movimentações</h1>
            <p className="text-sm text-black dark:text-gray-300 mt-1 font-bold">
              Total: {filteredMovements.length} registros
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-natural-200 dark:border-gray-700 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por Café, PR/Lote ou Responsável..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-natural-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-espresso-500"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-4 py-2 rounded-lg border border-natural-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-espresso-500"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'entrada' | 'saida')}
              className="w-full sm:w-auto pl-10 pr-8 py-2 rounded-lg border border-natural-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-espresso-500 appearance-none cursor-pointer"
            >
              <option value="all">Todas as Movimentações</option>
              <option value="entrada">Apenas Entradas</option>
              <option value="saida">Apenas Saídas</option>
            </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Histórico (Desktop) / Cards (Mobile) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-natural-200 dark:border-gray-700 overflow-hidden transition-colors">
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-natural-200 dark:divide-gray-700">
            <thead className="bg-natural-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Data/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Café</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">PR/Lote</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-black dark:text-white uppercase tracking-wider">Qtd (g)</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Responsável</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Obs</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-black dark:text-white uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-natural-200 dark:divide-gray-700">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-black dark:text-white">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar size={32} className="text-gray-400 dark:text-gray-600" />
                      <p>Nenhuma movimentação encontrada</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-natural-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white font-bold">
                      {formatDate(movement.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        movement.type === 'entrada'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        <span className="mr-1">{getTypeIcon(movement.type)}</span>
                        <span className="capitalize">{movement.type}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black dark:text-white">
                      {movement.coffeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-gray-300 font-medium">
                      {movement.pr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                      <span className={movement.type === 'entrada' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                        {movement.type === 'entrada' ? '+' : '-'}{formatGrams(movement.quantity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-gray-300 font-medium">
                      {movement.responsible || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-black dark:text-gray-300 max-w-xs truncate font-medium">
                      {movement.observations || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(movement)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(movement)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-natural-200 dark:divide-gray-700">
           {filteredMovements.length === 0 ? (
              <div className="p-12 text-center text-black dark:text-white">
                <div className="flex flex-col items-center gap-2">
                  <Calendar size={32} className="text-gray-400 dark:text-gray-600" />
                  <p>Nenhuma movimentação encontrada</p>
                </div>
              </div>
            ) : (
              filteredMovements.map((movement) => (
                <div key={movement.id} className="p-4 bg-white dark:bg-gray-800">
                   <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mb-1 ${
                          movement.type === 'entrada'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>
                          <span className="mr-1">{getTypeIcon(movement.type)}</span>
                          <span className="capitalize">{movement.type}</span>
                        </span>
                        <h4 className="font-bold text-black dark:text-white">{movement.coffeeName}</h4>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex gap-2 mb-1">
                          <button
                            onClick={() => handleEdit(movement)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(movement)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">{formatDate(movement.timestamp)}</span>
                         <span className={`text-lg font-bold ${movement.type === 'entrada' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                          {movement.type === 'entrada' ? '+' : '-'}{formatGrams(movement.quantity)}
                        </span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase block">PR / Lote</span>
                        <span className="text-black dark:text-gray-300 font-medium">{movement.pr}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase block">Responsável</span>
                        <span className="text-black dark:text-gray-300 font-medium">{movement.responsible || '-'}</span>
                      </div>
                   </div>

                   {movement.observations && (
                      <div className="mt-2 p-2 bg-natural-50 dark:bg-gray-700/50 rounded text-sm text-black dark:text-gray-300">
                        <span className="font-bold text-xs block mb-1">Obs:</span>
                        {movement.observations}
                      </div>
                    )}
                </div>
              ))
            )}
        </div>
      </div>

      <Modal
        isOpen={!!editingMovement}
        onClose={() => setEditingMovement(null)}
        title="Editar Movimentação"
      >
        {editingMovement && (
          <MovementForm
            initialData={editingMovement}
            onSuccess={() => setEditingMovement(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default History;
