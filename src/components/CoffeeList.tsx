import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Plus, Edit2, Trash2, Coffee as CoffeeIcon } from 'lucide-react';
import Modal from './Modal';

interface CoffeeFormData {
  name: string;
  observations: string;
}

const CoffeeList: React.FC = () => {
  const { state, actions } = useApp();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CoffeeFormData>();

  const openNew = () => {
    setEditingId(null);
    reset({ name: '', observations: '' });
    setIsModalOpen(true);
  };

  const openEdit = (coffee: { id: string; name: string; observations?: string }) => {
    setEditingId(coffee.id);
    setValue('name', coffee.name);
    setValue('observations', coffee.observations || '');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este café? Todo o histórico e estoque serão perdidos.')) {
      actions.deleteCoffee(id);
      showToast('Café excluído com sucesso!', 'success');
    }
  };

  const onSubmit = (data: CoffeeFormData) => {
    try {
      if (editingId) {
        actions.updateCoffee(editingId, data);
        showToast('Café atualizado com sucesso!', 'success');
      } else {
        actions.addCoffee(data);
        showToast('Café cadastrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      reset();
    } catch (error) {
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
          onClick={openNew}
          className="bg-white-600 text-black px-4 py-2 rounded-lg hover:bg-white-700 transition-colors shadow-sm flex items-center justify-center gap-2 font-bold border border-black dark:border-white dark:text-white"
        >
          <Plus size={20} />
          <span>Novo Café</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.coffees.map((coffee) => (
          <div key={coffee.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700 transition-colors relative group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-natural-50 dark:bg-gray-700 p-3 rounded-full text-black dark:text-white">
                  <CoffeeIcon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black dark:text-white">{coffee.name}</h3>
                  {coffee.observations && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{coffee.observations}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono">ID: {coffee.id}</p>
                </div>
              </div>
            </div>
            
            <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEdit(coffee)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                title="Editar"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleDelete(coffee.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Café' : 'Novo Café'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-black dark:text-white mb-1">Nome do Café</label>
            <input
              type="text"
              {...register('name', { required: 'Nome é obrigatório' })}
              className="w-full rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium"
              placeholder="Ex: Colombia Huila"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-black dark:text-white mb-1">Observações (Opcional)</label>
            <textarea
              {...register('observations')}
              rows={3}
              className="w-full rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium"
              placeholder="Ex: Notas sensoriais, fornecedor..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black dark:bg-white text-white dark:text-black py-2 px-4 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-bold mt-4"
          >
            {editingId ? 'Salvar Alterações' : 'Cadastrar Café'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default CoffeeList;
