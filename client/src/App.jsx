import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';

import Shop from './pages/Shop';
import { ModalProvider } from './context/ModalContext';

function App() {
  return (
    <ModalProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            {/* Temporary catch-all to prevent 404s while clicking header links */}
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
      </Router>
    </ModalProvider>
  );
}

export default App;
