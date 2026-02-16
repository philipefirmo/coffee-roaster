import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

import { Plus, Search, Edit2, Trash2, Coffee as CoffeeIcon, X, ChevronDown, AlertCircle, MoreVertical, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import CoffeeForm, { CoffeeFormData } from './CoffeeForm';
import { CoffeeBeanVector } from './icons/CoffeeBean';

const CoffeeList: React.FC = () => {
  const { state, actions } = useApp();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const editingCoffee = editingId ? state.coffees.find(c => c.id === editingId) : undefined;

  const handleOpenNew = () => {
    if (window.innerWidth < 1024) {
      navigate('/cafes/novo');
    } else {
      setEditingId(null);
      setIsModalOpen(true);
    }
  };

  const handleOpenEdit = (coffee: { id: string; name: string; observations?: string }) => {
    if (window.innerWidth < 1024) {
      navigate(`/cafes/editar/${coffee.id}`);
    } else {
      setEditingId(coffee.id);
      setIsModalOpen(true);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await actions.deleteCoffee(deleteId);
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCoffees = state.coffees
    .sort((a, b) => a.name.localeCompare(b.name)) // Ordenar alfabeticamente
    .filter(coffee =>
      coffee.name.toLowerCase().includes(filterText.toLowerCase()) ||
      (coffee.observations && coffee.observations.toLowerCase().includes(filterText.toLowerCase()))
    );

  const onSubmit = (data: CoffeeFormData) => {
    try {
      // Validação de nome duplicado
      const nameExists = state.coffees.some(coffee =>
        coffee.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
        coffee.id !== editingId
      );

      if (nameExists) {
        showToast('Já existe um café cadastrado com esse nome.', 'error');
        return;
      }

      if (editingId) {
        actions.updateCoffee(editingId, data);
      } else {
        actions.addCoffee(data);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar café.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Gerenciar Cafés</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cadastre, edite ou remova os cafés disponíveis.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="hidden sm:flex bg-espresso-600 text-white px-4 py-2 rounded-lg hover:bg-espresso-700 transition-colors shadow-sm items-center justify-center gap-2 font-bold"
        >
          <Plus size={20} />
          <span>Novo Café</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar café..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-espresso-500 shadow-sm"
        />
      </div>

      {/* FAB Mobile */}
      <button
        onClick={handleOpenNew}
        className="fixed bottom-20 right-4 sm:hidden z-40 bg-espresso-600 text-white p-4 rounded-full shadow-lg hover:bg-espresso-700 active:scale-95 transition-all ripple touch-target"
        aria-label="Novo Café"
      >
        <Plus size={24} />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoffees.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <Search size={48} className="text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">Nenhum café encontrado</p>
              <p className="text-sm">Tente buscar por outro termo</p>
            </div>
          </div>
        ) : (
          filteredCoffees.map((coffee, index) => (
            <motion.div
              key={coffee.id}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700 relative cursor-pointer hover:shadow-md transition-shadow"
              initial={isMobile ? { opacity: 0, y: 20 } : undefined}
              animate={isMobile ? { opacity: 1, y: 0 } : undefined}
              transition={isMobile ? { duration: 0.15, delay: index * 0.05 } : undefined}
              whileTap={isMobile ? { scale: 0.98 } : undefined}
              onClick={() => handleOpenEdit(coffee)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="bg-white dark:bg-gray-700 p-3 rounded-full flex-shrink-0 text-black dark:text-white">
                    <CoffeeBeanVector size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-black dark:text-white truncate">{coffee.name}</h3>
                    {coffee.observations && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{coffee.observations}</p>
                    )}
                  </div>
                </div>

                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === coffee.id ? null : coffee.id);
                    }}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors p-2"
                    title="Opções"
                  >
                    <MoreVertical size={20} />
                  </button>

                  {openMenuId === coffee.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                        }}
                      />
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-natural-100 dark:border-gray-700 z-20 overflow-hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            handleOpenEdit(coffee);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-bold text-espresso-600 dark:text-espresso-400 hover:bg-espresso-50 dark:hover:bg-espresso-900/20 transition-colors"
                        >
                          <Edit2 size={16} />
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            handleDeleteClick(coffee.id);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 size={16} />
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-full w-16 h-16 mx-auto">
            <Trash2 size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-black dark:text-white font-medium">
              Tem certeza que deseja excluir este café?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta ação não pode ser desfeita. Todo o histórico e estoque vinculados a este café serão perdidos permanentemente.
            </p>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 py-2 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso-500"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 py-2 px-4 text-sm font-bold text-white bg-red-600 border border-transparent rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Café' : 'Novo Café'}
      >
        <CoffeeForm
          initialData={editingCoffee}
          onSubmit={onSubmit}
          onCancel={() => setIsModalOpen(false)}
          isEditing={!!editingId}
        />
      </Modal>
    </div >
  );
};

export default CoffeeList;
