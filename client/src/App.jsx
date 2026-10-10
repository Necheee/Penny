import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import { ModalProvider } from './context/ModalContext';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/cart/CartDrawer';

function App() {
  return (
    <CartProvider>
      <ModalProvider>
        <Router>
          <CartDrawer />
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/checkout" element={<Checkout />} />
              {/* Temporary catch-all to prevent 404s while clicking header links */}
              <Route path="*" element={<Home />} />
            </Routes>
          </Layout>
        </Router>
      </ModalProvider>
    </CartProvider>
  );
}

export default App;
