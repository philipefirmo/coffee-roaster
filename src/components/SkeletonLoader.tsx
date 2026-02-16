import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'table' | 'form';
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'card', 
  count = 3, 
  className = '' 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700 ${className}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700 overflow-hidden ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="px-6 py-4 border-b border-natural-100 dark:border-gray-700 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'table':
        return (
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700 overflow-hidden ${className}`}>
            <div className="px-6 py-4 border-b border-natural-100 dark:border-gray-700">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
            </div>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="px-6 py-4 border-b border-natural-100 dark:border-gray-700 last:border-b-0">
                <div className="grid grid-cols-4 gap-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'form':
        return (
          <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-natural-100 dark:border-gray-700 ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20 mb-2"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
            <div className="flex gap-3 mt-6">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {type === 'list' || type === 'table' ? renderSkeleton() : (
        <div className="space-y-4">
          {[...Array(count)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: i * 0.05 }}
            >
              {renderSkeleton()}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SkeletonLoader;