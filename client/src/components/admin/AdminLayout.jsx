import { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Ruler, 
  ShoppingBag, 
  Landmark,
  ExternalLink, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminLayout({ children, activeTab, setActiveTab }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'size-guide', label: 'Size Guide', icon: Ruler },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'bank-settings', label: 'Bank & Payments', icon: Landmark },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-brand-charcoal flex font-sans antialiased">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-50
        w-64 bg-white border-r border-neutral-200 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand / Logo */}
        <div className="h-16 border-b border-neutral-200 px-6 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PENNY" className="h-6 w-auto" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-brand-charcoal text-white px-2 py-0.5 rounded-xs">
              ADMIN
            </span>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 text-neutral-500 hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400">
            Store Management
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-medium tracking-wide transition-colors
                  ${isActive 
                    ? 'bg-brand-charcoal text-white shadow-xs font-semibold' 
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer shortcuts */}
        <div className="p-4 border-t border-neutral-200 space-y-1 bg-neutral-50/50">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 text-xs text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-sm transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Live Store</span>
            </span>
            <span className="text-[10px] text-neutral-400">↗</span>
          </Link>

          <button
            onClick={() => {
              localStorage.removeItem('penny_admin_token');
              localStorage.removeItem('penny_admin_user');
              navigate('/admin/login');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-sm transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Dashboard (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-neutral-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-sm"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm md:text-base font-bold uppercase tracking-wider text-brand-charcoal">
              {navigationItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>

          {/* Right Header Icons */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center text-xs text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              <span>Catalog In Sync</span>
            </div>

            <div className="h-4 w-px bg-neutral-200 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-charcoal text-white flex items-center justify-center text-xs font-bold tracking-wider">
                AD
              </div>
              <div className="hidden md:block text-left text-xs leading-tight">
                <p className="font-bold text-brand-charcoal">Store Admin</p>
                <p className="text-[10px] text-neutral-500">PENNY</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Dynamic Page Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

