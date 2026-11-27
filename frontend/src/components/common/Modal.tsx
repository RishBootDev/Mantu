import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {              }
      <div
        className="fixed inset-0 bg-slate-900/50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {                   }
      <div
        className={`relative w-full ${widthStyles[maxWidth]} bg-white rounded-lg shadow-modal border border-mantu-border z-10 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200`}
      >
        <div className="px-6 py-4 border-b border-mantu-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-mantu-text">{title}</h3>
            {description && (
              <p className="text-xs text-mantu-muted mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-mantu-muted hover:text-mantu-text p-1 rounded hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[82vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
