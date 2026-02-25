import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS, getVisibleNavItems } from '../config/navigation';
import {
    LayoutDashboard,
    Library,
    Settings,
    LogOut,
    ShieldCheck,
    User,
    FileText,
    ClipboardCheck,
    Search,
    AlertTriangle,
    FileBarChart,
    Grid
} from 'lucide-react';

const Layout = () => {
    const { user, logout, canRead, isAdmin } = useAuth();
    const location = useLocation();

    const navItems = getVisibleNavItems(canRead, isAdmin);

    const secondaryNav = [
        { label: 'Documentos', icon: FileText },
        { label: 'Controles', icon: ShieldCheck },
        { label: 'Auditorías', icon: ClipboardCheck },
        { label: 'No Conformidades', icon: AlertTriangle },
        { label: 'Reportes', icon: FileBarChart },
    ];

    const isLinkActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Top Header */}
            <header className="guardian-header">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <ShieldCheck size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">Inntek Ai Tools</h1>
                        <p className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Inntek AI Tools Manager</p>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs font-bold">{user?.nombre || 'User'}</span>
                        <span className="text-[10px] opacity-70 uppercase font-black">{user?.Role?.nombre}</span>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                        <User size={20} />
                    </div>
                    <button
                        onClick={logout}
                        className="text-white/70 hover:text-white transition-colors"
                        title="Disconnect"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Navigation Bar */}
            <nav className="guardian-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`guardian-nav-item ${isLinkActive(item.path) ? 'guardian-nav-item--active' : ''}`}
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </Link>
                ))}

                {/* Placeholder for visual consistency with image */}
                {secondaryNav.map((item, i) => (
                    <div key={i} className="guardian-nav-item opacity-50 cursor-not-allowed hidden lg:flex">
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>

            {/* Main Content Area */}
            <main className="guardian-main-container flex-1">
                <div className="animate-in fade-in duration-500">
                    <Outlet />
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-guardian-border py-6 bg-white/50">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold text-guardian-muted uppercase tracking-[0.2em]">
                    <span>© 2026 INNTEK AI API AGENT</span>
                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                        <span className="flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span>System Online</span>
                        </span>
                        <span>Ver: 4.0.5-Guardian</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
