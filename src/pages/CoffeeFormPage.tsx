import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import CoffeeForm, { CoffeeFormData } from '../components/CoffeeForm';
import { ArrowLeft } from 'lucide-react';

const CoffeeFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const { showToast } = useToast();
  
  const isEditing = !!id;
  const coffeeToEdit = id ? state.coffees.find(c => c.id === id) : undefined;

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
      navigate('/cafes');
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar café.', 'error');
    }
  };

  return (
    <div className="space-y-6">
        <div className="hidden lg:flex items-center gap-4">
            <button onClick={() => navigate('/cafes')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-black dark:text-white transition-colors">
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
                onCancel={() => navigate('/cafes')}
                isEditing={isEditing}
            />
        </div>
    </div>
  );
};

export default CoffeeFormPage;
