import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Plus, Minus } from 'lucide-react';
import { Movement } from '../types';

interface FormData {
  type: 'entrada' | 'saida';
  coffeeId: string;
  pr: string;
  date: string;
  quantity: number;
  observations: string;
  responsible: string;
}

interface MovementFormProps {
  onSuccess?: () => void;
  initialData?: Movement;
}

const MovementForm: React.FC<MovementFormProps> = ({ onSuccess, initialData }) => {
  const { state, actions } = useApp();
  const { showToast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>();

  const selectedCoffeeId = watch('coffeeId');
  const movementType = watch('type');

  useEffect(() => {
    if (initialData) {
      setValue('type', initialData.type);
      setValue('coffeeId', initialData.coffeeId);
      setValue('pr', initialData.pr);
      // Ensure date is in YYYY-MM-DD format for input
      const dateValue = initialData.timestamp ? new Date(initialData.timestamp).toISOString().split('T')[0] : '';
      setValue('date', dateValue);
      setValue('quantity', initialData.quantity);
      setValue('observations', initialData.observations || '');
      setValue('responsible', initialData.responsible || '');
    }
  }, [initialData, setValue]);

  const selectedCoffee = state.coffees.find(coffee => coffee.id === selectedCoffeeId);

  const onSubmit = (data: FormData) => {
    try {
      const quantityNum = Number(data.quantity);
      
      if (isNaN(quantityNum)) {
        showToast('A quantidade deve ser um número válido.', 'error');
        return;
      }

      if (data.type === 'saida' && selectedCoffee) {
        let availableStock = selectedCoffee.roasts.reduce((sum, roast) => sum + roast.quantity, 0);
        
        if (initialData && initialData.type === 'saida' && initialData.coffeeId === data.coffeeId) {
           availableStock += initialData.quantity; // Add back the original amount for validation
        }

        if (quantityNum > availableStock) {
          showToast(`Quantidade insuficiente! Estoque disponível: ${availableStock}g`, 'error');
          return;
        }
      }

      if (!state.currentUser) {
        showToast('Erro: Usuário não identificado. Por favor, faça login novamente.', 'error');
        return;
      }

      const movementData = {
        type: data.type,
        coffeeId: data.coffeeId,
        coffeeName: selectedCoffee?.name || '',
        pr: data.pr,
        quantity: quantityNum,
        observations: data.observations,
        responsible: state.currentUser.name,
      };

      if (initialData) {
        actions.updateMovement(initialData.id, movementData);
        showToast('Movimentação atualizada com sucesso!', 'success');
      } else {
        actions.addMovement(movementData);
        showToast('Movimentação registrada com sucesso!', 'success');
      }

      reset();
      if (onSuccess) onSuccess();
      
    } catch (error) {
      showToast('Erro ao processar movimentação.', 'error');
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Tipo */}
        <div className="flex gap-4">
          <label className="flex items-center p-3 border border-natural-100 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-natural-50 dark:hover:bg-gray-700 flex-1 justify-center transition-colors">
            <input
              type="radio"
              value="entrada"
              {...register('type', { required: true })}
              className="text-black focus:ring-espresso-500"
            />
            <span className="ml-2 font-bold text-black dark:text-white flex items-center gap-1">
              Entrada
            </span>
          </label>
          <label className="flex items-center p-3 border border-natural-100 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-natural-50 dark:hover:bg-gray-700 flex-1 justify-center transition-colors">
            <input
              type="radio"
              value="saida"
              {...register('type', { required: true })}
              className="text-black focus:ring-espresso-500"
            />
            <span className="ml-2 font-bold text-black dark:text-white flex items-center gap-1">
              Saída
            </span>
          </label>
        </div>
        {errors.type && <p className="text-xs text-red-500">Selecione o tipo.</p>}

        {/* Café */}
        <div>
          <label className="block text-sm font-bold text-black dark:text-white mb-1">Café</label>
          <select
            {...register('coffeeId', { required: 'Selecione um café' })}
            className="w-full rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium"
          >
            <option value="">Selecione...</option>
            {state.coffees.map((coffee) => (
              <option key={coffee.id} value={coffee.id}>{coffee.name}</option>
            ))}
          </select>
          {errors.coffeeId && <p className="text-xs text-red-600 mt-1">{errors.coffeeId.message}</p>}
        </div>

        {/* PR */}
        <div>
          <label className="block text-sm font-bold text-black dark:text-white mb-1">PR / Lote</label>
          <input
            type="text"
            {...register('pr', { required: 'Digite o PR' })}
            className="w-full rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Digite o código do PR"
          />
        </div>

        {/* Data e Quantidade */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-black dark:text-white mb-1">Data</label>
            <input
              type="date"
              {...register('date', { required: true })}
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-black dark:text-white mb-1">Qtd (g)</label>
            <input
              type="number"
              {...register('quantity', { required: true, min: 1, valueAsNumber: true })}
              className="w-full rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="0"
            />
          </div>
        </div>

        {/* Obs */}
        <div>
          <label className="block text-sm font-bold text-black dark:text-white mb-1">Observações</label>
          <textarea
            {...register('observations')}
            rows={2}
            className="w-full rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium"
            placeholder="Opcional"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-white dark:bg-gray-800 text-black dark:text-white py-2 px-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 border border-black dark:border-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white transition-colors font-bold"
        >
          {initialData ? 'Salvar Alterações' : 'Confirmar'}
        </button>
      </form>
    </div>
  );
};

export default MovementForm;
