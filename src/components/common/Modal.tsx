import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
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
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidthStyles[maxWidth]} bg-white dark:bg-[#15161f] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-elevated dark:shadow-dark-elevated overflow-hidden z-10 transition-all`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-850">
            <div>
              {title && (
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 -mr-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};
