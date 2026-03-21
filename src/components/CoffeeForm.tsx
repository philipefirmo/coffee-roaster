import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export interface CoffeeFormData {
  name: string;
  observations?: string;
  minStockThreshold?: number;
}

interface CoffeeFormProps {
  initialData?: CoffeeFormData;
  onSubmit: (data: CoffeeFormData) => void;
  onCancel: () => void;
  isEditing: boolean;
  submitLabel?: string;
  onDirtyChange?: (isDirty: boolean) => void;
}

const CoffeeForm: React.FC<CoffeeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing,
  submitLabel,
  onDirtyChange
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CoffeeFormData>();

  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (initialData) {
      setValue('name', initialData.name);
      setValue('observations', initialData.observations || '');
      setValue('minStockThreshold', initialData.minStockThreshold);
    } else {
      reset({ name: '', observations: '', minStockThreshold: undefined });
    }
  }, [initialData, setValue, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-black dark:text-white mb-1">Nome do Café</label>
        <input
          type="text"
          autoComplete="off"
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

      <div>
        <label className="block text-sm font-bold text-black dark:text-white mb-1">Alerta de Estoque Mínimo (g)</label>
        <input
          type="number"
          {...register('minStockThreshold', { min: 0 })}
          onWheel={(e) => e.currentTarget.blur()}
          className="w-full rounded-md border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-2 px-3 border text-black dark:text-white font-medium"
          placeholder="Padrão: 500g"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Defina a quantidade mínima para o alerta "Baixo". Se vazio, será 500g.</p>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-espresso-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-espresso-600 text-white py-2 px-4 rounded-lg hover:bg-espresso-700 transition-colors font-bold"
        >
          {submitLabel || (isEditing ? 'Salvar' : 'Cadastrar')}
        </button>
      </div>
    </form>
  );
};

export default CoffeeForm;
