import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, Coffee, Sun, Moon, Menu, X, Bean, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { state, actions, toggleTheme } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/historico', label: 'Histórico', icon: <History size={20} /> },
    { path: '/cafes', label: 'Cafés', icon: <Bean size={20} /> },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="h-screen bg-natural-100 dark:bg-gray-900 font-sans text-black dark:text-white transition-colors duration-200 flex overflow-hidden">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-black dark:border-white flex items-center justify-between px-4 z-30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-lg">
            <Coffee size={24} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-black dark:text-white truncate">Studio Grão</h1>
        </div>
        <button onClick={toggleSidebar} className="p-2 text-black dark:text-white">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white dark:bg-gray-800 border-r border-black dark:border-white
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-full
      `}>
        <div className="h-16 flex items-center px-6 border-b border-natural-200 dark:border-gray-700 shrink-0">
           <div className="flex items-center gap-3">
              <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-lg">
                <Coffee size={24} />
              </div>
              <div className="leading-tight">
                <h1 className="text-base font-bold text-black dark:text-white">Studio Grão</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Coffee Roaster</p>
              </div>
            </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-natural-200 dark:border-gray-700 shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Usuário</p>
          <p className="text-sm font-bold text-black dark:text-white truncate">{state.currentUser?.name}</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md'
                    : 'text-black dark:text-gray-300 hover:bg-natural-100 dark:hover:bg-gray-700'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-natural-200 dark:border-gray-700 space-y-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-natural-200 dark:border-gray-600 hover:bg-natural-50 dark:hover:bg-gray-700 transition-colors text-black dark:text-white font-bold text-sm"
          >
            {state.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{state.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
          
          <button
            onClick={() => actions.logout()}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-bold text-sm"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 overflow-y-auto h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
