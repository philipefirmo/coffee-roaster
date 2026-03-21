import React, { useState, useEffect } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';

import { Plus, Search, Edit2, Trash2, Coffee as CoffeeIcon, X, ChevronDown, ListChecks, MoreVertical, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
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
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  const handleToggleSelection = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  const handleSelectCoffee = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // ... inside CoffeeList component ...

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Bloqueador de navegação quando em modo de seleção
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isSelectionMode && selectedIds.size > 0 && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowExitConfirmation(true);
    }
  }, [blocker.state]);

  const cancelNavigation = () => {
    setShowExitConfirmation(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const confirmNavigation = () => {
    setShowExitConfirmation(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDeleteId('MULTIPLE');
  };

  const editingCoffee = editingId ? state.coffees.find(c => c.id === editingId) : undefined;

  const handleOpenNew = () => {
    if (window.innerWidth < 1024) {
      navigate('/cafes/novo');
    } else {
      setEditingId(null);
      setIsFormDirty(false);
      setIsModalOpen(true);
    }
  };

  const [showDesktopFab, setShowDesktopFab] = useState(false);

  // Scroll Listener para FAB Desktop
  useEffect(() => {
    const handleScroll = () => {
      // Mostrar FAB se rolar mais de 200px (quando os botões superiores somem)
      // O scroll pode ser na window ou no main dependendo do layout
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      const mainElement = document.querySelector('main');
      const mainScroll = mainElement ? mainElement.scrollTop : 0;

      // Ajuste o valor conforme necessário
      setShowDesktopFab((scrollY > 200) || (mainScroll > 200));
    };

    window.addEventListener('scroll', handleScroll);
    const mainElement = document.querySelector('main');
    if (mainElement) mainElement.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainElement) mainElement.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleOpenEdit = (coffee: { id: string; name: string; observations?: string }) => {
    if (window.innerWidth < 1024) {
      navigate(`/cafes/editar/${coffee.id}`);
    } else {
      setEditingId(coffee.id);
      setIsFormDirty(false);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    if (isFormDirty) {
      setShowConfirmClose(true);
    } else {
      setIsModalOpen(false);
    }
  };

  const confirmClose = () => {
    setIsFormDirty(false);
    setShowConfirmClose(false);
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      if (deleteId === 'MULTIPLE') {
        await actions.deleteCoffees(Array.from(selectedIds));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
      } else {
        await actions.deleteCoffee(deleteId);
      }
      setDeleteId(null);
    } catch (error) {
      console.error(error);
      // Toast já é mostrado na action
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
        <div className="flex gap-2">
          {filteredCoffees.length > 0 && (
            <button
              onClick={handleToggleSelection}
              className={`hidden sm:flex px-4 py-2 rounded-lg transition-colors shadow-sm items-center justify-center gap-2 font-bold border ${isSelectionMode
                ? 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                : 'bg-white text-espresso-600 border-espresso-200 hover:bg-espresso-50 dark:bg-gray-800 dark:text-espresso-400 dark:border-gray-700'}`}
            >
              {isSelectionMode ? <X size={20} /> : <ListChecks size={20} />}
              <span>{isSelectionMode ? 'Cancelar Seleção' : 'Selecionar'}</span>
            </button>
          )}
          <button
            onClick={handleOpenNew}
            className="hidden sm:flex bg-espresso-600 text-white px-4 py-2 rounded-lg hover:bg-espresso-700 transition-colors shadow-sm items-center justify-center gap-2 font-bold"
          >
            <Plus size={20} />
            <span>Novo Café</span>
          </button>
        </div>
      </div>

      {/* Floating Action for Bulk Delete */}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-20 inset-x-0 flex justify-center z-50 pointer-events-none animate-fade-in">
          <button
            onClick={handleDeleteSelected}
            className="pointer-events-auto bg-red-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-red-700 transition-colors flex items-center gap-3 font-bold whitespace-nowrap"
          >
            <Trash2 size={20} />
            <span>Excluir {selectedIds.size} Selecionados</span>
          </button>
        </div>
      )}

      {/* Desktop Scroll FAB */}
      <button
        onClick={handleOpenNew}
        className={`hidden sm:flex fixed bottom-10 right-10 z-30 bg-espresso-600 text-white p-4 rounded-full shadow-lg hover:bg-espresso-700 active:scale-95 transition-all duration-300 touch-target ${showDesktopFab ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
          }`}
        aria-label="Novo Café"
      >
        <Plus size={24} />
      </button>

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

      {/* FAB Mobile Menu - Hidden in Selection Mode */}
      {!isSelectionMode && (
        <div className="fixed bottom-20 right-4 sm:hidden z-40 flex flex-col items-end gap-3">
          {isFabMenuOpen && (
            <>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onClick={() => {
                  setIsFabMenuOpen(false);
                  handleToggleSelection();
                }}
                className="bg-white dark:bg-gray-800 text-espresso-600 dark:text-espresso-400 border border-espresso-200 dark:border-gray-600 p-3 rounded-full shadow-lg hover:bg-espresso-50 dark:hover:bg-gray-700 flex items-center gap-2 font-bold whitespace-nowrap"
              >
                <span className="text-sm">Selecionar</span>
                <ListChecks size={20} />
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.05 }}
                onClick={() => {
                  setIsFabMenuOpen(false);
                  handleOpenNew();
                }}
                className="bg-white dark:bg-gray-800 text-espresso-600 dark:text-espresso-400 border border-espresso-200 dark:border-gray-600 p-3 rounded-full shadow-lg hover:bg-espresso-50 dark:hover:bg-gray-700 flex items-center gap-2 font-bold whitespace-nowrap"
              >
                <span className="text-sm">Novo Café</span>
                <Plus size={20} />
              </motion.button>
            </>
          )}
          <button
            onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
            className={`p-4 rounded-full shadow-lg transition-all ripple touch-target ${isFabMenuOpen
              ? 'bg-white dark:bg-gray-800 text-espresso-600 dark:text-espresso-400 border border-espresso-200 dark:border-gray-600 rotate-45'
              : 'bg-espresso-600 text-white'
              }`}
            aria-label={isFabMenuOpen ? 'Fechar menu' : 'Opções'}
          >
            <Plus size={24} />
          </button>
        </div>
      )}

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
              className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border relative cursor-pointer hover:shadow-md hover:bg-espresso-50 dark:hover:bg-gray-700/50 hover:border-espresso-200 dark:hover:border-gray-600 transition-all ${selectedIds.has(coffee.id) ? 'ring-2 ring-espresso-600 border-espresso-600 dark:border-espresso-500 bg-espresso-50 dark:bg-gray-700/80' : 'border-natural-100 dark:border-gray-700'
                } ${openMenuId === coffee.id ? 'z-30' : 'z-auto'}`}
              initial={isMobile ? { opacity: 0, y: 20 } : undefined}
              animate={isMobile ? { opacity: 1, y: 0 } : undefined}
              transition={isMobile ? { duration: 0.15, delay: index * 0.05 } : undefined}
              whileTap={isMobile ? { scale: 0.98 } : undefined}
              onClick={() => {
                if (isSelectionMode) {
                  handleSelectCoffee(coffee.id);
                } else {
                  handleOpenEdit(coffee);
                }
              }}
            >
              {isSelectionMode && (
                <div className="absolute top-4 right-4 z-10">
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selectedIds.has(coffee.id)
                    ? 'bg-espresso-600 border-espresso-600 text-white'
                    : 'border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-500'
                    }`}>
                    {selectedIds.has(coffee.id) && <CheckCircle size={16} />}
                  </div>
                </div>
              )}

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

                {!isSelectionMode && (
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
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-natural-100 dark:border-gray-700 z-20 overflow-hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              handleToggleSelection();
                              handleSelectCoffee(coffee.id);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-bold text-espresso-600 dark:text-espresso-400 hover:bg-espresso-50 dark:hover:bg-espresso-900/20 transition-colors"
                          >
                            <ListChecks size={16} />
                            Selecionar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              handleOpenEdit(coffee);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirmar Exclusão"
      // Removido className pois Modal não aceita. O estilo deve ser no conteúdo ou fixed no Modal component.
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-full w-16 h-16 mx-auto">
            <Trash2 size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <p className="text-center text-gray-600 dark:text-gray-300">
            {deleteId === 'MULTIPLE'
              ? `Tem certeza que deseja excluir ${selectedIds.size} café(s)? Esta ação não pode ser desfeita.`
              : 'Tem certeza que deseja excluir este café? Todo o histórico e dados associados serão perdidos permanentemente.'}
          </p>
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
        onClose={handleCloseModal}
        title={editingId ? 'Editar Café' : 'Novo Café'}
      >
        <CoffeeForm
          initialData={editingCoffee}
          onSubmit={onSubmit}
          onCancel={handleCloseModal}
          isEditing={!!editingId}
          onDirtyChange={setIsFormDirty}
        />
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={confirmClose}
        title="Descartar alterações?"
        message="Existem alterações não salvas. Tem certeza que deseja fechar?"
        confirmLabel="Descartar"
        isDestructive={true}
      />
    </div >
  );
};

export default CoffeeList;
