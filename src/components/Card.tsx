import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconBackground?: 'gradient' | 'teal' | 'blue' | 'purple' | 'dark';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  footer?: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconBackground = 'gradient',
  children,
  className = '',
  onClick,
  footer,
  hoverable = false,
}) => {
  // Icon background styles
  const iconBackgroundStyles = {
    gradient: 'bg-solana-gradient',
    teal: 'bg-solana-teal',
    blue: 'bg-solana-blue',
    purple: 'bg-solana-purple',
    dark: 'bg-dark-light'
  };

  return (
    <div 
      className={`
        bg-dark-card border border-dark-light rounded-2xl shadow-card overflow-hidden
        ${hoverable ? 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-1' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Card header */}
      {(title || Icon) && (
        <div className="p-5 border-b border-dark-light">
          <div className="flex items-center">
            {Icon && (
              <div className={`p-2 rounded-lg ${iconBackgroundStyles[iconBackground]} mr-3`}>
                <Icon size={20} className="text-light-text" />
              </div>
            )}
            <div>
              {title && <h3 className="font-semibold text-light-text">{title}</h3>}
              {subtitle && <p className="text-sm text-muted-text">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      
      {/* Card content */}
      <div className="p-5">
        {children}
      </div>
      
      {/* Card footer */}
      {footer && (
        <div className="px-5 py-3 bg-dark-light border-t border-dark-light">
          {footer}
        </div>
      )}
    </div>
  );
};

// Card grid layout
interface CardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  columns = 3,
  gap = 'md',
  className = '',
}) => {
  // Column styles
  const columnStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };
  
  // Gap styles
  const gapStyles = {
    sm: 'gap-3',
    md: 'gap-5',
    lg: 'gap-8'
  };
  
  return (
    <div className={`grid ${columnStyles[columns]} ${gapStyles[gap]} ${className}`}>
      {children}
    </div>
  );
};
