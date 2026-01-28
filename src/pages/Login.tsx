import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Coffee } from 'lucide-react';

const Login: React.FC = () => {
  const { actions } = useApp();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      actions.login(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-natural-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md border border-natural-200 dark:border-gray-700">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-black dark:bg-white text-white dark:text-black p-4 rounded-xl mb-4">
            <Coffee size={48} />
          </div>
          <h1 className="text-2xl font-bold text-black dark:text-white text-center">Studio Grão</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Coffee Roaster</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-black dark:text-white mb-2">
              Quem é você?
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border-natural-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:border-espresso-500 focus:ring-espresso-500 py-3 px-4 border text-black dark:text-white font-medium placeholder-gray-400"
              placeholder="Digite seu nome"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 px-4 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-bold text-lg"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
