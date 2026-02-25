import { LayoutDashboard, Scissors, Library, Settings, Palette, Code, LogIn } from 'lucide-react';

export const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, module: 'Dashboard' },
    { path: '/tool-maker', label: 'AI Tool Maker', icon: Scissors, module: 'AI_Tool_Maker' },
    { path: '/catalog', label: 'Catalogo', icon: Library, module: 'AI_Tool_Catalog' },
    { path: '/outputs-maker', label: 'Outputs Maker', icon: Palette, module: 'Outputs_Maker' },
    { path: '/json-schemas', label: 'JSON Schemas', icon: Code, module: 'Json_Schemas' },
    { path: '/config', label: 'Configuración', icon: Settings, module: 'Config' },
];

export const getVisibleNavItems = (canRead, isAdmin) => {
    return NAV_ITEMS.filter(item => {
        // Dashboard is usually public for auth users
        if (item.path === '/') return true;
        return canRead(item.module) || isAdmin;
    });
};
