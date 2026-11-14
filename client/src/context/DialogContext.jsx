import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, HelpCircle, X } from 'lucide-react';

const DialogContext = createContext();

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback(({
    title = 'Please Confirm',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
  }) => {
    return new Promise((resolve) => {
      setDialog({
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        isDestructive,
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setDialog(null);
          resolve(false);
        },
      });
    });
  }, []);

  const alert = useCallback(({
    title = 'Notice',
    message = '',
    confirmText = 'Understood',
    type = 'info', // 'info' | 'success' | 'warning' | 'error'
  }) => {
    return new Promise((resolve) => {
      setDialog({
        type: 'alert',
        title,
        message,
        confirmText,
        alertType: type,
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setDialog(null);
          resolve(true);
        },
      });
    });
  }, []);

  // Keyboard accessibility: Escape to cancel, Enter to confirm
  useEffect(() => {
    if (!dialog) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dialog.onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        dialog.onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog]);

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}

      <AnimatePresence>
        {dialog && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dialog.onCancel}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />

            {/* Modal Card */}
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-[#FAF9F6] border border-brand-charcoal/20 rounded-xs shadow-2xl p-6 sm:p-7 overflow-hidden text-brand-charcoal z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Subtle Luxury Accent Bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  dialog.isDestructive
                    ? 'bg-red-600'
                    : dialog.alertType === 'success'
                    ? 'bg-emerald-600'
                    : dialog.alertType === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-brand-charcoal'
                }`}
              />

              <div className="flex items-start gap-4 mt-1">
                {/* Icon Badge */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                    dialog.isDestructive
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : dialog.alertType === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : dialog.alertType === 'warning'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-brand-charcoal/5 text-brand-charcoal border-brand-charcoal/15'
                  }`}
                >
                  {dialog.isDestructive ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : dialog.alertType === 'success' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : dialog.alertType === 'warning' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : dialog.type === 'confirm' ? (
                    <HelpCircle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-serif text-lg font-normal text-brand-charcoal tracking-wide leading-snug">
                    {dialog.title}
                  </h3>
                  <div className="mt-2 text-xs sm:text-[13px] text-brand-charcoal/75 leading-relaxed font-sans whitespace-pre-line">
                    {dialog.message}
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  type="button"
                  onClick={dialog.onCancel}
                  className="text-brand-charcoal/40 hover:text-brand-charcoal p-1 transition-colors rounded-xs cursor-pointer -mt-1 -mr-2"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-brand-charcoal/10 flex items-center justify-end gap-3">
                {dialog.type === 'confirm' && (
                  <button
                    type="button"
                    onClick={dialog.onCancel}
                    className="px-4 py-2 border border-brand-charcoal/25 text-brand-charcoal hover:bg-brand-charcoal/5 text-[11px] font-bold uppercase tracking-[0.15em] rounded-xs transition-colors cursor-pointer"
                  >
                    {dialog.cancelText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={dialog.onConfirm}
                  autoFocus
                  className={`px-5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] rounded-xs transition-colors cursor-pointer shadow-xs ${
                    dialog.isDestructive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-brand-charcoal hover:bg-black text-white'
                  }`}
                >
                  {dialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      confirm: ({ title, message }) => Promise.resolve(window.confirm(`${title}\n\n${message}`)),
      alert: ({ title, message }) => {
        window.alert(`${title}\n\n${message}`);
        return Promise.resolve(true);
      },
    };
  }
  return context;
}
