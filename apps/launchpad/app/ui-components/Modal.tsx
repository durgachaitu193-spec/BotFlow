"use client";

import React, { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onCancel?: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode | null;
  children: React.ReactNode;
  closable?: boolean;
  centered?: boolean;
  className?: string;
  destroyOnClose?: boolean;
  afterClose?: () => void;
}

const Modal: React.FC<ModalProps> = ({
  open,
  onCancel,
  title,
  footer,
  children,
  closable = true,
  centered = false,
  className = "",
  destroyOnClose = false,
  afterClose,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      if (afterClose) {
        afterClose();
      }
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open, afterClose]);

  if (!open && destroyOnClose) return null;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-[#1a1a1a] rounded-lg shadow-xl max-h-[90vh] overflow-auto ${
          centered ? "mx-auto" : ""
        } ${className}`}
        style={{ maxWidth: "90vw" }}
      >
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {title && (
              <div className="text-white font-semibold text-lg">{title}</div>
            )}
            {closable && (
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-white transition-colors ml-auto"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-4">{children}</div>

        {/* Footer */}
        {footer !== null && footer !== undefined && (
          <div className="p-4 border-t border-gray-700">{footer}</div>
        )}
      </div>
    </div>
  );
};

export default Modal;
