import React from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import CoffeeForm, { CoffeeFormData } from '../components/CoffeeForm';
import ConfirmModal from '../components/ConfirmModal';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

const CoffeeFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const { showToast } = useToast();

  const isEditing = !!id;
  const coffeeToEdit = id ? state.coffees.find(c => c.id === id) : undefined;

  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showConfirmBack, setShowConfirmBack] = useState(false);

  // Bloquear navegação se o formulário estiver sujo
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isFormDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowConfirmBack(true);
    }
  }, [blocker.state]);

  const handleBack = () => {
    navigate('/cafes');
  };

  const confirmBack = () => {
    setIsFormDirty(false);
    setShowConfirmBack(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    } else {
      navigate('/cafes');
    }
  };

  const cancelBack = () => {
    setShowConfirmBack(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const handleSubmit = (data: CoffeeFormData) => {
    try {
      // Validação de nome duplicado
      const nameExists = state.coffees.some(coffee =>
        coffee.name.trim().toLowerCase() === data.name.trim().toLowerCase() &&
        coffee.id !== id
      );

      if (nameExists) {
        showToast('Já existe um café cadastrado com esse nome.', 'error');
        return;
      }

      if (isEditing && id) {
        actions.updateCoffee(id, data);
      } else {
        actions.addCoffee(data);
      }
      setIsFormDirty(false);
      navigate('/cafes');
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar café.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="hidden lg:flex items-center gap-4">
        <button onClick={handleBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-black dark:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-black dark:text-white">
          {isEditing ? 'Editar Café' : 'Novo Café'}
        </h2>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl">
        <CoffeeForm
          initialData={coffeeToEdit}
          onSubmit={handleSubmit}
          onCancel={handleBack}
          isEditing={isEditing}
          onDirtyChange={setIsFormDirty}
        />
      </div>

      <ConfirmModal
        isOpen={showConfirmBack}
        onClose={cancelBack}
        onConfirm={confirmBack}
        title="Descartar alterações?"
        message="Existem alterações não salvas. Tem certeza que deseja voltar?"
        confirmLabel="Descartar"
        isDestructive={true}
      />
    </div>
  );
};

export default CoffeeFormPage;
