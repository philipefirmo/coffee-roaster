import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '☕ Dashboard', icon: '📊' },
    { path: '/movimentacao', label: '➕ Registro', icon: '📝' },
    { path: '/historico', label: '📋 Histórico', icon: '📈' },
  ];

  return (
    <nav className="bg-white shadow-card rounded-xl p-4 mb-6">
      <div className="flex space-x-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;