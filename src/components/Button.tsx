import React, { ButtonHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none';
  
  // Size styles
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg',
    md: 'text-sm px-4 py-2 rounded-xl',
    lg: 'text-base px-6 py-3 rounded-xl'
  };
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-solana-gradient text-dark hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none',
    secondary: 'bg-dark-light text-light-text hover:bg-dark-card border border-dark-light disabled:opacity-50',
    outline: 'bg-transparent border border-dark-light text-light-text hover:border-solana-teal hover:text-solana-teal disabled:opacity-50 disabled:hover:border-dark-light disabled:hover:text-light-text',
    ghost: 'bg-transparent text-light-text hover:bg-dark-light disabled:opacity-50 disabled:hover:bg-transparent',
    danger: 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50'
  };
  
  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';
  
  // Icon styles
  const iconStyles = {
    left: Icon && 'space-x-2',
    right: Icon && 'flex-row-reverse space-x-2 space-x-reverse'
  };
  
  // Loading styles
  const loadingStyles = loading ? 'relative text-transparent' : '';
  
  return (
    <button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${widthStyles}
        ${iconStyles[iconPosition]}
        ${loadingStyles}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {Icon && <Icon size={size === 'lg' ? 20 : size === 'md' ? 18 : 16} />}
      <span>{children}</span>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  );
};
