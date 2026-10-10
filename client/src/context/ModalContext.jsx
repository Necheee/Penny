import { createContext, useContext, useState } from 'react';
import ProductModal from '../components/shop/ProductModal';

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
      {activeProductId && <ProductModal productId={activeProductId} closeModal={closeModal} />}
    </ModalContext.Provider>
  );
}

export const useModal = () => useContext(ModalContext);
