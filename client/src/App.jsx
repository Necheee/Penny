import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';

// Placeholder for Shop - Real page will be built in Phase 5
const Shop = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
    <h1 className="text-4xl font-serif mb-4 text-brand-charcoal">The Shop</h1>
    <p className="text-brand-taupe">The Product Grid and Shop Filters are coming in Phase 5.</p>
  </div>
);

function App() {
  return (
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
  );
}

export default App;
