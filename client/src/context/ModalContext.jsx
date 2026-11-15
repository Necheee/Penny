import React, { Component, createContext, useContext, useState } from 'react';
import ProductModal from '../components/shop/ProductModal';

class ModalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Modal error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white p-6 max-w-sm w-full text-center shadow-2xl rounded-xs">
            <p className="text-sm font-sans mb-4 text-brand-charcoal">Unable to preview piece details.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onClose();
              }}
              className="px-4 py-2 border border-brand-charcoal text-xs uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
            >
              Close
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [activeProductId, setActiveProductId] = useState(null);

  const openModal = (id) => {
    setActiveProductId(id);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeModal = () => {
    setActiveProductId(null);
    document.body.style.overflow = 'auto'; // Restore scrolling
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {activeProductId && (
        <ModalErrorBoundary onClose={closeModal}>
          <ProductModal productId={activeProductId} closeModal={closeModal} />
        </ModalErrorBoundary>
      )}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
