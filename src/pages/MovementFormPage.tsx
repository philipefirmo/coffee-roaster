import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import MovementForm from '../components/MovementForm';
import { ArrowLeft } from 'lucide-react';

const MovementFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();

  const isEditing = !!id;
  const movementToEdit = id ? state.movements.find(m => m.id === id) : undefined;

  const handleSuccess = () => {
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="space-y-6">
      <div className="hidden lg:flex items-center gap-4">
        <h2 className="text-2xl font-bold text-black dark:text-white">
          {isEditing ? 'Editar Movimentação' : 'Nova Movimentação'}
        </h2>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl">
        <MovementForm
          initialData={movementToEdit}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default MovementFormPage;
