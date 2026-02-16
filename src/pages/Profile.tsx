import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { User, Save, LogOut, Sun, Moon } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { state, actions, toggleTheme } = useApp();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    showToast('Sessão encerrada com sucesso!', 'success');
  };

  const toggleThemeHandler = () => {
    toggleTheme();
  };

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: name }
      });

      if (error) throw error;

      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      showToast('Erro ao atualizar perfil.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-espresso-600 rounded-lg text-white">
          <User size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Meu Perfil</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Gerencie suas informações pessoais</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700 p-6 max-w-2xl">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-black dark:text-white mb-2">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed font-medium"
              />
              <p className="text-xs text-gray-400 mt-1">O email não pode ser alterado.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-black dark:text-white mb-2">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-natural-100 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-espresso-600 dark:focus:ring-white focus:border-transparent outline-none transition-all font-medium"
                placeholder="Seu nome"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-natural-100 dark:border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-espresso-600 hover:bg-espresso-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700 p-6 max-w-2xl">
        <h3 className="text-lg font-bold text-black dark:text-white mb-4 lg:hidden">Configurações do App</h3>
        <div className="space-y-2 lg:hidden">
          <button
            onClick={toggleThemeHandler}
            className="w-full flex items-center gap-2 p-3 rounded-lg border border-natural-100 dark:border-gray-600 hover:bg-natural-50 dark:hover:bg-gray-700 transition-colors text-black dark:text-white font-bold text-sm touch-target justify-center"
          >
            {state.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{state.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2 p-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-bold text-sm touch-target justify-center text-center"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 border border-natural-100 dark:border-gray-700">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white">Sair da conta?</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Tem certeza que deseja sair do sistema?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
