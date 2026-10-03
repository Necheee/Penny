import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout
// import Layout from './components/layout/Layout';

// Pages (placeholders for now)
const Home = () => <div className="p-8">Home Page Content</div>;
const Shop = () => <div className="p-8">Shop Page Content</div>;

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* We will add Layout later containing Header and Footer */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            {/* Add more routes in the future */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
