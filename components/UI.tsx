
import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; className?: string }> = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-2xl shadow-card border border-slate-100/50 p-6 transition-all hover:shadow-lg ${className}`} {...props}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  ...props 
}) => {
  const baseStyle = "rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-4 active:scale-95 flex items-center justify-center";
  
  const sizeStyles = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };
  
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 hover:shadow-soft focus:ring-brand-200 border border-transparent",
    secondary: "bg-white text-brand-600 border border-brand-100 hover:bg-brand-50 hover:border-brand-200 focus:ring-brand-100",
    outline: "bg-transparent border-2 border-slate-200 text-slate-600 hover:border-brand-600 hover:text-brand-600 focus:ring-slate-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 focus:ring-red-100",
    ghost: "bg-transparent text-slate-500 hover:text-brand-600 hover:bg-brand-50"
  };

  return (
    <button className={`${baseStyle} ${sizeStyles[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color }) => {
  // Default to brand style if no color provided
  const finalColor = color || 'bg-brand-50 text-brand-700 border border-brand-100';
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${finalColor}`}>
      {children}
    </span>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const maxWidthClass = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl'
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidthClass} flex flex-col max-h-[90vh] animate-scale-up border border-white/20`}>
        {/* Header - Fixed */}
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-brand-600 to-brand-500 shrink-0 rounded-t-3xl">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors">&times;</button>
        </div>
        
        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
