import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import SignIn from './pages/SignIn';
import CreateAccount from './pages/CreateAccount';
import ForgotPassword from './pages/ForgotPassword';
import Account from './pages/Account';
import Wishlist from './pages/Wishlist';
import About from './pages/About';
import Contact from './pages/Contact';
import CareGuide from './pages/CareGuide';
import Shipping from './pages/Shipping';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import { ModalProvider } from './context/ModalContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import CartDrawer from './components/cart/CartDrawer';

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <ModalProvider>
            <Router>
              <CartDrawer />
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/checkout" element={<Checkout />} />
                  
                  {/* Account & Auth Routes */}
                  <Route path="/account/login" element={<SignIn />} />
                  <Route path="/account/register" element={<CreateAccount />} />
                  <Route path="/account/forgot-password" element={<ForgotPassword />} />
                  <Route path="/account" element={<Account />} />
                  
                  {/* Wishlist Route */}
                  <Route path="/wishlist" element={<Wishlist />} />

                  {/* Informational / Supporting Pages */}
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/care-guide" element={<CareGuide />} />
                  <Route path="/shipping" element={<Shipping />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />

                  {/* Temporary catch-all to prevent 404s while clicking header links */}
                  <Route path="*" element={<Home />} />
                </Routes>
              </Layout>
            </Router>
          </ModalProvider>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
