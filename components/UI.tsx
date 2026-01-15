import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  ...props 
}) => {
  const baseStyle = "rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-slate-300",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
  };

  return (
    <button className={`${baseStyle} ${sizeStyles[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'bg-slate-100 text-slate-600' }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
    {children}
  </span>
);

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};