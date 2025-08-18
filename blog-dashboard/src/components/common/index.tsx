// src/components/common/index.tsx - 完全版
'use client';

import React, { ButtonHTMLAttributes, ReactNode, useState, useEffect } from 'react';
import { LucideIcon, Sun, Moon, MoreVertical } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

// ==========================================
// Card Component
// ==========================================
interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  noPadding = false 
}) => {
  const { isDark } = useTheme();
  
  return (
    <div 
      className={`
        ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        rounded-lg shadow-md border
        ${!noPadding ? 'p-6' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ==========================================
// Button Component
// ==========================================
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon, 
  className = '', 
  ...props 
}) => {
  const { isDark } = useTheme();
  
  const getVariantClasses = (): string => {
    switch (variant) {
      case 'primary':
        return isDark 
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'secondary':
        return isDark
          ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300';
      case 'success':
        return isDark
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-green-500 hover:bg-green-600 text-white';
      case 'danger':
        return isDark
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-red-500 hover:bg-red-600 text-white';
      case 'ghost':
        return isDark
          ? 'hover:bg-gray-700 text-gray-200'
          : 'hover:bg-gray-100 text-gray-700';
      default:
        return '';
    }
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`
        ${getVariantClasses()} 
        ${sizes[size]} 
        rounded-lg font-medium 
        inline-flex items-center justify-center gap-2
        transition-all duration-200 
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

// ==========================================
// Badge Component
// ==========================================
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'purple';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default' 
}) => {
  const { isDark } = useTheme();
  
  const getVariantClasses = (): string => {
    if (isDark) {
      switch (variant) {
        case 'default': return 'bg-gray-700 text-gray-300';
        case 'success': return 'bg-green-900/50 text-green-400 border border-green-800';
        case 'warning': return 'bg-yellow-900/50 text-yellow-400 border border-yellow-800';
        case 'danger': return 'bg-red-900/50 text-red-400 border border-red-800';
        case 'primary': return 'bg-blue-900/50 text-blue-400 border border-blue-800';
        case 'purple': return 'bg-purple-900/50 text-purple-400 border border-purple-800';
        default: return '';
      }
    } else {
      switch (variant) {
        case 'default': return 'bg-gray-100 text-gray-700';
        case 'success': return 'bg-green-100 text-green-700';
        case 'warning': return 'bg-yellow-100 text-yellow-700';
        case 'danger': return 'bg-red-100 text-red-700';
        case 'primary': return 'bg-blue-100 text-blue-700';
        case 'purple': return 'bg-purple-100 text-purple-700';
        default: return '';
      }
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVariantClasses()}`}>
      {children}
    </span>
  );
};

// ==========================================
// QuickActionButton Component
// ==========================================
interface QuickActionButtonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  onClick?: () => void;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  color, 
  onClick 
}) => {
  const { isDark } = useTheme();
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-start p-4 rounded-lg border-2 transition-all duration-200 group
        ${isDark 
          ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
          : 'bg-white border-gray-200 hover:border-blue-400'
        }
        hover:shadow-lg
      `}
    >
      <div className={`p-3 ${color} rounded-lg mr-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-left">
        <h3 className={`font-semibold text-base ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {title}
        </h3>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {description}
        </p>
      </div>
    </button>
  );
};

// ==========================================
// StatCard Component
// ==========================================
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color 
}) => {
  const { isDark } = useTheme();
  
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} ${isDark ? 'bg-opacity-20' : 'bg-opacity-10'} rounded-lg`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <MoreVertical 
          className={`w-5 h-5 cursor-pointer transition-colors ${
            isDark 
              ? 'text-gray-500 hover:text-gray-300' 
              : 'text-gray-400 hover:text-gray-600'
          }`} 
        />
      </div>
      <div>
        <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {title}
        </p>
        <p className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {value}
        </p>
        {change !== undefined && (
          <p className={`text-sm mt-2 ${
            change > 0 
              ? isDark ? 'text-green-400' : 'text-green-600'
              : isDark ? 'text-red-400' : 'text-red-600'
          }`}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
          </p>
        )}
      </div>
    </Card>
  );
};

// ==========================================
// ThemeToggle Component
// ==========================================
export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label="Toggle theme"
        disabled
      >
        <Moon className="w-5 h-5 text-gray-700" />
      </button>
    );
  }
  
  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-colors
        ${isDark 
          ? 'bg-gray-700 hover:bg-gray-600' 
          : 'bg-gray-100 hover:bg-gray-200'
        }
      `}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
};
