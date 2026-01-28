import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import MovementForm from './MovementForm';
import { Package, AlertTriangle, TrendingUp, Plus, Search, Calendar, X, Filter } from 'lucide-react';
import { formatGrams } from '../lib/utils';

const Dashboard: React.FC = () => {
  const { state } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'low'>('all');

  // Calculate totals
  const totalStock = state.coffees.reduce((total, coffee) => 
    total + coffee.roasts.reduce((sum, roast) => sum + roast.quantity, 0), 0
  );

  const lowStockCount = state.coffees.filter(coffee => 
    coffee.roasts.reduce((sum, roast) => sum + roast.quantity, 0) < 500
  ).length;

  const movementsToday = state.movements.filter(m => {
    const today = new Date().toISOString().split('T')[0];
    return m.timestamp.startsWith(today);
  }).length;

  // Filter and Sort Logic
  const filteredCoffees = state.coffees
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(coffee => {
      const filteredRoasts = coffee.roasts.filter(roast => {
        // Date Check
        let dateMatch = true;
        if (filterDate) {
          const parts = roast.date.split('/');
          if (parts.length === 3) {
            let [d, m, y] = parts;
            if (y.length === 2) y = '20' + y;
            const roastIso = `${y}-${m}-${d}`;
            dateMatch = roastIso === filterDate;
          } else {
            dateMatch = false;
          }
        }

        // Text Check (Name or PR)
        let textMatch = true;
        if (filterText) {
          const term = filterText.toLowerCase();
          const nameMatch = coffee.name.toLowerCase().includes(term);
          const prMatch = roast.pr.toLowerCase().includes(term);
          textMatch = nameMatch || prMatch;
        }

        // Status Check
        let statusMatch = true;
        if (filterStatus !== 'all') {
          const isLow = roast.quantity < 500;
          if (filterStatus === 'low') statusMatch = isLow;
          if (filterStatus === 'ok') statusMatch = !isLow;
        }

        return dateMatch && textMatch && statusMatch;
      });

      return { ...coffee, roasts: filteredRoasts };
    })
    .filter(coffee => {
      // Show coffee if it has matching roasts
      if (coffee.roasts.length > 0) return true;
      
      // If filtering by status, don't show empty coffees unless they somehow matched (which they won't if roasts are empty)
      // Actually, if filterStatus is set, we only care about matching roasts.
      
      // If searching by name and no other specific filters (date/status), show empty coffee?
      // If status filter is active, we should probably hide empty coffees as they don't have a status per se (or are they 0?)
      // Let's stick to showing matching roasts.
      
      if (filterText && !filterDate && filterStatus === 'all') {
         return coffee.name.toLowerCase().includes(filterText.toLowerCase());
      }

      // If no filters, show all (even empty ones)
      if (!filterText && !filterDate && filterStatus === 'all') return true;

      return false;
    });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Visão Geral</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-black dark:text-gray-300 mt-1">
            <span className="text-sm font-medium">Última atualização: {new Date(state.lastUpdate).toLocaleString('pt-BR')}</span>
            {state.lastUpdatedBy && (
              <span className="text-sm font-medium hidden sm:inline">• por {state.lastUpdatedBy}</span>
            )}
            {state.lastUpdatedBy && (
               <span className="text-sm font-medium sm:hidden">por {state.lastUpdatedBy}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-caramel-600 text-black px-4 py-2 rounded-lg hover:bg-caramel-700 transition-colors shadow-sm flex items-center justify-center gap-2 font-bold border border-black dark:border-white dark:text-white"
        >
          <Plus size={20} />
          <span>Nova Movimentação</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-natural-200 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black dark:text-white">Estoque Total</p>
              <p className="text-2xl font-bold text-black dark:text-white">{formatGrams(totalStock)}</p>
            </div>
            <div className="bg-natural-100 dark:bg-gray-700 p-3 rounded-full text-black dark:text-white">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-natural-200 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black dark:text-white">Alertas de Baixo Estoque</p>
              <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {lowStockCount}
              </p>
            </div>
            <div className={`bg-natural-100 dark:bg-gray-700 p-3 rounded-full ${lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-natural-200 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black dark:text-white">Movimentações Hoje</p>
              <p className="text-2xl font-bold text-black dark:text-white">{movementsToday}</p>
            </div>
            <div className="bg-natural-100 dark:bg-gray-700 p-3 rounded-full text-black dark:text-white">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-natural-200 dark:border-gray-700 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por Café ou PR/Lote..."
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'ok' | 'low')}
              className="w-full sm:w-auto pl-10 pr-8 py-2 rounded-lg border border-natural-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-espresso-500 appearance-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="ok">Estoque OK</option>
              <option value="low">Estoque Baixo</option>
            </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stock List - Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-natural-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-natural-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-black dark:text-white">Estoque por Café</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {filteredCoffees.length} café(s) encontrado(s)
          </span>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-natural-200 dark:divide-gray-700">
            <thead className="bg-natural-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Café</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">PR / Lote</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Data Torra</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-black dark:text-white uppercase tracking-wider">Quantidade</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-white uppercase tracking-wider">Obs</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-black dark:text-white uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-natural-200 dark:divide-gray-700">
              {filteredCoffees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Nenhum café encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredCoffees.map((coffee) => {
                  const totalQuantity = coffee.roasts.reduce((sum, r) => sum + r.quantity, 0);
                  return (
                    <React.Fragment key={coffee.id}>
                      {coffee.roasts.map((roast, index) => (
                        <tr key={`${coffee.id}-${roast.id}`} className="hover:bg-natural-50 dark:hover:bg-gray-700 transition-colors">
                          {index === 0 && (
                            <td rowSpan={coffee.roasts.length} className="px-6 py-4 whitespace-nowrap align-top bg-white dark:bg-gray-800 border-r border-natural-100 dark:border-gray-700">
                              <div className="text-sm font-bold text-black dark:text-white">{coffee.name}</div>
                              <div className="text-xs text-black dark:text-gray-300 mt-1 font-bold">Total: {formatGrams(totalQuantity)}</div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-gray-300 font-bold">{roast.pr}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-gray-300 font-medium">{roast.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white text-right font-bold">{formatGrams(roast.quantity)}</td>
                           <td className="px-6 py-4 text-sm text-black dark:text-gray-300 max-w-xs truncate font-medium">
                            {roast.observations || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {roast.quantity < 500 ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                                Baixo
                              </span>
                            ) : (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {coffee.roasts.length === 0 && (
                        <tr key={coffee.id} className="hover:bg-natural-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap align-top bg-white dark:bg-gray-800 border-r border-natural-100 dark:border-gray-700">
                              <div className="text-sm font-bold text-black dark:text-white">{coffee.name}</div>
                              <div className="text-xs text-black dark:text-gray-300 mt-1 font-bold">Total: 0g</div>
                          </td>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            Sem estoque {filterDate ? 'nesta data' : ''}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          {filteredCoffees.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Nenhum café encontrado.
            </div>
          ) : (
            filteredCoffees.map((coffee) => {
               const totalQuantity = coffee.roasts.reduce((sum, r) => sum + r.quantity, 0);
               return (
                 <div key={coffee.id} className="border-b border-natural-200 dark:border-gray-700 last:border-0">
                    <div className="bg-natural-50 dark:bg-gray-900 px-4 py-3 flex justify-between items-center">
                      <h4 className="font-bold text-black dark:text-white">{coffee.name}</h4>
                      <span className="text-xs font-bold text-black dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-natural-200 dark:border-gray-700">
                        Total: {formatGrams(totalQuantity)}
                      </span>
                    </div>
                    
                    {coffee.roasts.length > 0 ? (
                      <div className="divide-y divide-natural-100 dark:divide-gray-700">
                        {coffee.roasts.map((roast) => (
                          <div key={roast.id} className="p-4 bg-white dark:bg-gray-800">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">PR / Lote</span>
                                <p className="font-bold text-black dark:text-white">{roast.pr}</p>
                              </div>
                               <div className="text-right">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Quantidade</span>
                                <p className="font-bold text-black dark:text-white">{formatGrams(roast.quantity)}</p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mb-2">
                               <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Data Torra</span>
                                <p className="text-sm font-medium text-black dark:text-gray-300">{roast.date}</p>
                              </div>
                               <div>
                                  {roast.quantity < 500 ? (
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                                      Baixo
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
                                      OK
                                    </span>
                                  )}
                               </div>
                            </div>

                            {roast.observations && (
                              <div className="mt-2 p-2 bg-natural-50 dark:bg-gray-700/50 rounded text-sm text-black dark:text-gray-300">
                                <span className="font-bold text-xs block mb-1">Obs:</span>
                                {roast.observations}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Sem estoque {filterDate ? 'nesta data' : 'registrado'}
                      </div>
                    )}
                 </div>
               );
            })
          )}
        </div>
      </div>

      {/* Movement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Movimentação"
      >
        <MovementForm onSuccess={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Dashboard;
