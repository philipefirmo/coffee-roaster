import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import MovementForm from './MovementForm';
import SkeletonLoader from './SkeletonLoader';
import { Package, AlertTriangle, TrendingUp, Plus, Search, Calendar, X, Filter } from 'lucide-react';
import { formatGrams } from '../lib/utils';


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'low'>('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilterDate, setTempFilterDate] = useState(filterDate);
  const [tempFilterStatus, setTempFilterStatus] = useState<'all' | 'ok' | 'low'>(filterStatus);

  // Função para formatar data no formato DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';

    // Se já está no formato DD/MM/YYYY, retornar
    if (dateStr.includes('/')) return dateStr;

    // Converter de YYYY-MM-DD para DD/MM/YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return dateStr;
  };

  // Early return if loading
  if (state.loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48 mt-2"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        <SkeletonLoader type="table" count={5} />
      </div>
    );
  }

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

        // Quantity Check (Only show available stock)
        const quantityMatch = roast.quantity > 0;

        return dateMatch && textMatch && quantityMatch;
      });

      return { ...coffee, roasts: filteredRoasts };
    })
    .filter(coffee => {
      // Calculate global total for status check
      const originalCoffee = state.coffees.find(c => c.id === coffee.id);
      const globalTotal = originalCoffee ? originalCoffee.roasts.reduce((sum, r) => sum + r.quantity, 0) : 0;

      // Status Check
      if (filterStatus !== 'all') {
        const isLow = globalTotal < 500;
        if (filterStatus === 'low' && !isLow) return false;
        if (filterStatus === 'ok' && isLow) return false;
      }

      // Show coffee ONLY if it has matching roasts (with quantity > 0)
      return coffee.roasts.length > 0;
    });

  const handleOpenNew = () => {
    if (window.innerWidth < 1024) {
      navigate('/movimentacoes/nova');
    } else {
      setIsModalOpen(true);
    }
  };

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
          onClick={handleOpenNew}
          className="hidden sm:flex bg-espresso-600 text-white px-5 py-3 rounded-lg hover:bg-espresso-700 transition-colors shadow-sm items-center justify-center gap-2 font-bold touch-target ripple"
        >
          <Plus size={20} />
          <span>Nova Movimentação</span>
        </button>
      </div>

      {/* FAB Mobile */}
      <button
        onClick={handleOpenNew}
        className="fixed bottom-20 right-4 sm:hidden z-40 bg-espresso-600 text-white p-4 rounded-full shadow-lg hover:bg-espresso-700 touch-target"
        aria-label="Nova Movimentação"
      >
        <Plus size={24} />
      </button>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black dark:text-white">Estoque Total</p>
              <p className="text-2xl font-bold text-black dark:text-white">{formatGrams(totalStock)}</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-3 rounded-full text-black dark:text-white">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black dark:text-white">Alertas de Baixo Estoque</p>
              <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {lowStockCount}
              </p>
            </div>
            <div className={`bg-white dark:bg-gray-700 p-3 rounded-full ${lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        <div
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black dark:text-white">Movimentações Hoje</p>
              <p className="text-2xl font-bold text-black dark:text-white">{movementsToday}</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-3 rounded-full text-black dark:text-white">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Mobile */}
      <div className="md:hidden space-y-3">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-natural-100 dark:border-gray-700 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por Café ou PR/Lote..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-lg border border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-espresso-500"
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
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => { setTempFilterStatus(filterStatus); setTempFilterDate(filterDate); setIsFilterModalOpen(true); }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white font-bold"
            >
              <Filter size={16} />
              Filtros
            </button>
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-natural-50 dark:bg-gray-700 text-sm font-bold border border-natural-100 dark:border-gray-600"
              >
                <Calendar size={14} />
                {filterDate}
                <X size={12} className="ml-1" />
              </button>
            )}
            {filterStatus !== 'all' && (
              <button
                onClick={() => setFilterStatus('all')}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-natural-50 dark:bg-gray-700 text-sm font-bold border border-natural-100 dark:border-gray-600"
              >
                Status: {filterStatus === 'low' ? 'Baixo' : 'OK'}
                <X size={12} className="ml-1" />
              </button>
            )}
            {(filterText || filterDate || filterStatus !== 'all') && (
              <button
                onClick={() => { setFilterText(''); setFilterDate(''); setFilterStatus('all'); }}
                className="ml-auto text-sm font-bold text-gray-600 dark:text-gray-300"
              >
                Limpar tudo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters - Desktop */}
      <div className="hidden md:flex flex-col md:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-natural-100 dark:border-gray-700 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por Café ou PR/Lote..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-espresso-500"
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

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto min-w-0 overflow-hidden rounded-lg">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full sm:w-auto h-10 pl-10 pr-4 py-2 rounded-lg border border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-espresso-500 min-w-0 max-w-full block appearance-none"
              style={{ minWidth: 0, width: '100%' }}
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

          <div className="relative w-full sm:w-auto min-w-0">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'ok' | 'low')}
              className="w-full sm:w-auto pl-10 pr-8 py-2 rounded-lg border border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-espresso-500 appearance-none cursor-pointer max-w-full"
            >
              <option value="all">Todos os Status</option>
              <option value="ok">Estoque OK</option>
              <option value="low">Estoque Baixo</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stock List - Responsive */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-natural-100 dark:border-gray-700 flex justify-between items-center">
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
                  const filteredTotalQuantity = coffee.roasts.reduce((sum, r) => sum + r.quantity, 0);
                  const originalCoffee = state.coffees.find(c => c.id === coffee.id);
                  const globalTotal = originalCoffee ? originalCoffee.roasts.reduce((sum, r) => sum + r.quantity, 0) : 0;

                  return (
                    <React.Fragment key={coffee.id}>
                      {coffee.roasts.map((roast, index) => (
                        <tr key={`${coffee.id}-${roast.id}`} className="hover:bg-natural-50 dark:hover:bg-gray-700 transition-colors">
                          {index === 0 && (
                            <td rowSpan={coffee.roasts.length} className="px-6 py-4 whitespace-nowrap align-top bg-white dark:bg-gray-800 border-r border-natural-100 dark:border-gray-700">
                              <div className="text-sm font-bold text-black dark:text-white">{coffee.name}</div>
                              <div className="text-xs text-black dark:text-gray-300 mt-1 font-bold">Total: {formatGrams(filteredTotalQuantity)}</div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-gray-300 font-bold">{roast.pr}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-gray-300 font-medium">{formatDate(roast.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white text-right font-bold">{formatGrams(roast.quantity)}</td>
                          <td className="px-6 py-4 text-sm text-black dark:text-gray-300 max-w-xs truncate font-medium">
                            {roast.observations || '-'}
                          </td>
                          {index === 0 && (
                            <td rowSpan={coffee.roasts.length} className="px-6 py-4 whitespace-nowrap text-center align-middle border-l border-natural-100 dark:border-gray-700">
                              {globalTotal < 500 ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                                  Baixo
                                </span>
                              ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800">
                                  OK
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                      {coffee.roasts.length === 0 && (
                        <tr key={coffee.id} className="hover:bg-natural-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap align-top bg-white dark:bg-gray-800 border-r border-natural-100 dark:border-gray-700">
                            <div className="text-sm font-bold text-black dark:text-white">{coffee.name}</div>
                            <div className="text-xs text-black dark:text-gray-300 mt-1 font-bold">Total: 0g</div>
                          </td>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            Sem estoque {filterDate ? 'nesta data' : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center align-middle border-l border-natural-100 dark:border-gray-700">
                            {globalTotal < 500 ? (
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
              const filteredTotalQuantity = coffee.roasts.reduce((sum, r) => sum + r.quantity, 0);
              const originalCoffee = state.coffees.find(c => c.id === coffee.id);
              const globalTotal = originalCoffee ? originalCoffee.roasts.reduce((sum, r) => sum + r.quantity, 0) : 0;

              return (
                <div key={coffee.id} className="border-b border-natural-100 dark:border-gray-700 last:border-0">
                  <div className="bg-natural-50 dark:bg-gray-900 px-4 py-3 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-black dark:text-white">{coffee.name}</h4>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs font-bold text-black dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-natural-100 dark:border-gray-700">
                          Total: {formatGrams(filteredTotalQuantity)}
                        </span>
                        {globalTotal < 500 ? (
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
                              <p className="text-sm font-medium text-black dark:text-gray-300">{formatDate(roast.date)}</p>
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
        onClose={() => {
          // Verificar se MovementForm tem handler de confirmação
          const handler = (window as any).__movementFormCloseHandler;
          if (handler) {
            handler();
          } else {
            setIsModalOpen(false);
          }
        }}
        title="Nova Movimentação"
      >
        <MovementForm
          onSuccess={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          onRequestClose={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Filters Modal (Mobile) */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filtros"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-black dark:text-white mb-1">Data da Torra</label>
            <input
              type="date"
              value={tempFilterDate}
              onChange={(e) => setTempFilterDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-espresso-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-black dark:text-white mb-1">Status de Estoque</label>
            <select
              value={tempFilterStatus}
              onChange={(e) => setTempFilterStatus(e.target.value as 'all' | 'ok' | 'low')}
              className="w-full h-10 px-3 rounded-lg border border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-espresso-500"
            >
              <option value="all">Todos os Status</option>
              <option value="ok">Estoque OK</option>
              <option value="low">Estoque Baixo</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setTempFilterDate(''); setTempFilterStatus('all'); }}
              className="flex-1 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso-500"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => { setFilterDate(tempFilterDate); setFilterStatus(tempFilterStatus); setIsFilterModalOpen(false); }}
              className="flex-1 py-2 text-sm font-bold text-white bg-espresso-600 border border-transparent rounded-lg shadow-sm hover:bg-espresso-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso-500"
            >
              Aplicar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
