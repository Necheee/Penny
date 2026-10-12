import { useLocation } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <main className="w-full">{children}</main>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-offwhite text-brand-charcoal font-sans selection:bg-brand-taupe selection:text-white">
      <AnnouncementBar />
      <Header />
      <main className="flex-grow w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
