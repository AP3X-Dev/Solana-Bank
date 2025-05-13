import React from 'react';

interface BankLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BankLogo: React.FC<BankLogoProps> = ({
  className = '',
  showText = true,
  size = 'md'
}) => {
  // Size mappings
  const sizeMap = {
    sm: {
      container: 'h-6',
      logo: 'h-6',
      text: 'text-lg ml-2'
    },
    md: {
      container: 'h-8',
      logo: 'h-8',
      text: 'text-xl ml-3'
    },
    lg: {
      container: 'h-12',
      logo: 'h-12',
      text: 'text-3xl ml-4 font-bold'
    }
  };

  return (
    <div className={`flex items-center ${sizeMap[size].container} ${className}`}>
      {/* Logo image */}
      <img
        src="/logo.png"
        alt="Bank of Solana"
        className={`${sizeMap[size].logo} object-contain`}
      />

      {/* Logo text */}
      {showText && (
        <div className={`font-bold ${sizeMap[size].text} text-light-text`}>
          <span className="block">BANK OF</span>
          <span className="block -mt-1">SOLANA</span>
        </div>
      )}
    </div>
  );
};
