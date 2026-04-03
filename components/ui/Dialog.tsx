'use client';

import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void | Promise<void>;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  isDangerous?: boolean;
  showFooter?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

/**
 * Dialog/Modal Component
 * Centered modal with backdrop, header, content, and footer
 *
 * Usage:
 * const [isOpen, setIsOpen] = useState(false);
 * <Dialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSubmit={() => handleSubmit()}
 *   title="Confirm Action"
 *   submitLabel="Confirm"
 * >
 *   <p>Are you sure?</p>
 * </Dialog>
 */
export function Dialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  children,
  size = 'md',
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isLoading = false,
  isDangerous = false,
  showFooter = true,
}: DialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit();
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [onSubmit]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`bg-white rounded-lg shadow-xl max-w-full ${sizeClasses[size]} w-full max-h-[90vh] overflow-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">{children}</div>

          {/* Footer */}
          {showFooter && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                disabled={isSubmitting || isLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition"
              >
                {cancelLabel}
              </button>
              {onSubmit && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isLoading}
                  className={`px-4 py-2 text-white rounded-md transition disabled:opacity-50 ${
                    isDangerous
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting || isLoading ? 'Processing...' : submitLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Custom hook for managing dialog state
 */
export function useDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
