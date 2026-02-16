import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Coffee } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Cadastro
        if (!name.trim()) {
          showToast('Por favor, informe seu nome.', 'error');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });
        
        if (error) throw error;
        
        showToast('Cadastro realizado! Verifique seu email para confirmar.', 'success');
        setIsSignUp(false); // Volta para login
        setName(''); // Limpa o nome
        setPassword(''); // Limpa a senha
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        showToast('Login realizado com sucesso!', 'success');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      
      // Tratamento específico para email não confirmado
      if (error.message.includes('Email not confirmed')) {
        showToast('Seu email ainda não foi confirmado. Verifique sua caixa de entrada.', 'warning');
      } else if (error.message.includes('Invalid login credentials')) {
        showToast('Email ou senha incorretos.', 'error');
      } else {
        showToast(error.message || 'Erro ao realizar operação', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-natural-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-natural-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-espresso-600 p-6 flex flex-col items-center justify-center text-white">
          <div className="p-3 bg-white/10 rounded-full mb-3">
            <Coffee size={40} />
          </div>
          <h1 className="text-2xl font-bold">Studio Grão</h1>
          <p className="text-gray-300 text-sm mt-1">Gestão de Estoque</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-center mb-6 text-black dark:text-white">
            {isSignUp ? 'Criar nova conta' : 'Acesse sua conta'}
          </h2>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-espresso-600 dark:focus:ring-white focus:border-transparent outline-none transition-all"
                  placeholder="Seu nome"
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-espresso-600 hover:bg-espresso-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isSignUp ? 'Cadastrar' : 'Entrar'
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 text-center border-t border-natural-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem acesso?'}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail('');
                setPassword('');
                setName('');
              }}
              className="ml-2 font-bold text-espresso-600 dark:text-white hover:underline focus:outline-none"
            >
              {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
