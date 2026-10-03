import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
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
