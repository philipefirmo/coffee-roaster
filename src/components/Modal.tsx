import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (mainElement) mainElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      if (mainElement) mainElement.style.overflow = 'auto'; // Restaurar para auto/unset conforme original
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (mainElement) mainElement.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-natural-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-natural-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-black dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-black dark:text-white hover:text-espresso-700 dark:hover:text-gray-300 transition-colors font-bold"
          >
            ✕
          </button>
        </div>
        <div className="p-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
