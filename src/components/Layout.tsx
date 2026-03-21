import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { LayoutDashboard, History, Coffee, Sun, Moon, Menu, X, Bean, LogOut, User, Edit2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { CoffeeBeansVector } from './icons/CoffeeBeans';
import roasterIcon from '../assets/roaster-Icon.png';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ScrollToTop from './ScrollToTop';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleTheme } = useApp();
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Estado para sidebar colapsada (desktop) com persistência
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sidebarCollapsed', String(newValue));
      return newValue;
    });
  };

  const getHeaderConfig = () => {
    const isCoffeeNew = location.pathname === '/cafes/novo';
    const isCoffeeEdit = location.pathname.startsWith('/cafes/editar/');
    const isMovementNew = location.pathname === '/movimentacoes/nova';
    const isMovementEdit = location.pathname.startsWith('/movimentacoes/editar/');

    if (isCoffeeNew) return { title: 'Novo Café', showBack: true };
    if (isCoffeeEdit) return { title: 'Editar Café', showBack: true };
    if (isMovementNew) return { title: 'Nova Movimentação', showBack: true };
    if (isMovementEdit) return { title: 'Editar Movimentação', showBack: true };

    return { title: 'Studio Grão', showBack: false };
  };

  const headerConfig = getHeaderConfig();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/historico', label: 'Histórico', icon: <History size={20} /> },
    { path: '/cafes', label: 'Cafés', icon: <CoffeeBeansVector size={20} /> },
  ];

  const bottomNavItems = [
    ...navItems,
    { path: '/perfil', label: 'Perfil', icon: <User size={20} /> },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    if (window.matchMedia("(max-width: 1024px)").matches) {
      setIsSidebarOpen(false);
    }
  };

  const confirmLogout = async () => {
    try {
      await signOut();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <div className="h-screen bg-natural-50 dark:bg-gray-900 font-sans text-black dark:text-white transition-colors duration-200 flex overflow-hidden">
      <ScrollToTop />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-30 transition-colors">
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          {headerConfig.showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          ) : (
            <div className="bg-espresso-600 text-white p-1 rounded-lg shrink-0">
              <img src={roasterIcon} alt="Studio Grão" className="w-9 h-9 object-contain invert" />
            </div>
          )}
          <h1 className="text-lg font-bold tracking-tight text-black dark:text-white truncate">
            {headerConfig.title}
          </h1>
        </div>
      </div>



      {/* Sidebar Navigation - Oculta em mobile, visível em desktop */}
      <aside className={`
        hidden lg:flex
        fixed lg:static inset-y-0 left-0 z-50
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
        flex-col h-full
        relative
      `} style={{
          width: sidebarCollapsed ? '5rem' : '16rem'
        }}>
        {/* Botão Toggle (Desktop only) */}
        <button
          onClick={toggleSidebarCollapse}
          className="hidden lg:block fixed top-20 bg-espresso-600 text-white rounded-full p-1.5 shadow-lg hover:bg-espresso-700 transition-all z-10"
          style={{
            left: sidebarCollapsed ? 'calc(5rem - 0.75rem)' : 'calc(16rem - 0.75rem)'
          }}
          title={sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <div className={`h-16 flex items-center border-b border-natural-100 dark:border-gray-700 shrink-0 ${sidebarCollapsed ? 'justify-center px-2' : 'px-6'}`}>
          <div
            className="flex items-center gap-3 cursor-pointer transition-all"
            onClick={() => navigate('/')}
          >
            <div className="bg-espresso-600 text-white p-1.5 rounded-lg shrink-0">
              <img src={roasterIcon} alt="Studio Grão" className="w-9 h-9 object-contain invert" />
            </div>
            {!sidebarCollapsed && (
              <div className={`leading-tight overflow-hidden transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <h1 className="text-base font-bold text-black dark:text-white whitespace-nowrap">Studio Grão</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">Coffee Roaster</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-natural-100 dark:border-gray-700 shrink-0">
          {!sidebarCollapsed ? (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Usuário</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-black dark:text-white truncate flex-1" title={user?.user_metadata?.name || user?.email}>
                  {user?.user_metadata?.name || user?.email}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/perfil');
                    setIsSidebarOpen(false);
                  }}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0 cursor-pointer z-10"
                  title="Editar Perfil"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-center">
              <div className="bg-espresso-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                {(user?.user_metadata?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              title={sidebarCollapsed ? item.label : ''}
              className={({ isActive }) =>
                `flex items-center px-4 py-4 rounded-lg text-sm font-bold transition-all touch-target ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3'} ${isActive
                  ? 'bg-espresso-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-espresso-50 dark:hover:bg-gray-700/50 hover:text-espresso-700 dark:hover:text-white'
                }`
              }
            >
              <div className="shrink-0 flex items-center justify-center">
                {item.icon}
              </div>
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100'}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-natural-100 dark:border-gray-700 space-y-2 shrink-0">
          <button
            onClick={toggleTheme}
            title={sidebarCollapsed ? (state.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro') : ''}
            className={`w-full flex items-center p-3 rounded-lg border border-natural-100 dark:border-gray-600 hover:bg-natural-50 dark:hover:bg-gray-700 transition-colors text-black dark:text-white font-bold text-sm touch-target ${sidebarCollapsed ? 'justify-center' : 'gap-2'}`}
          >
            <div className="shrink-0">
              {state.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100'}`}>
              {state.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </button>

          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Sair' : ''}
            className={`w-full flex items-center p-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-bold text-sm touch-target ${sidebarCollapsed ? 'justify-center' : 'gap-2'}`}
          >
            <div className="shrink-0">
              <LogOut size={18} />
            </div>
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-0 opacity-0 absolute' : 'w-auto opacity-100'}`}>
              Sair
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 pb-16 lg:pb-0 overflow-y-auto h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-16 z-30 px-2 pb-safe">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-lg w-full transition-all ${isActive
                ? 'text-espresso-600 dark:text-espresso-400'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-full ${isActive ? 'bg-espresso-50 dark:bg-espresso-900/30' : ''}`}>
                  {item.icon}
                </div>
                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-espresso-600 dark:text-espresso-400' : ''}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

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

export default Layout;
