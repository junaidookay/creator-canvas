import { useState } from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, LayoutDashboard, Users, Film, FileText, Flag, BarChart3, DollarSign, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminVideos from './AdminVideos';
import AdminCommunity from './AdminCommunity';
import AdminReports from './AdminReports';
import AdminAnalytics from './AdminAnalytics';
import AdminMonetization from './AdminMonetization';
import AdminSettings from './AdminSettings';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'videos', label: 'Videos', icon: Film },
  { id: 'community', label: 'Community', icon: FileText },
  { id: 'reports', label: 'Reports', icon: Flag },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'monetization', label: 'Monetization', icon: DollarSign },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: roleLoading, role } = useAdminRole();
  const [tab, setTab] = useState<TabId>('overview');
  const [collapsed, setCollapsed] = useState(false);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen pt-20 px-4">
        <div className="container mx-auto max-w-7xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!hasAccess) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have admin or moderator privileges. Access is controlled via the <code className="text-primary">user_roles</code> table.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (tab) {
      case 'overview': return <AdminOverview />;
      case 'users': return <AdminUsers />;
      case 'videos': return <AdminVideos />;
      case 'community': return <AdminCommunity />;
      case 'reports': return <AdminReports />;
      case 'analytics': return <AdminAnalytics />;
      case 'monetization': return <AdminMonetization />;
      case 'settings': return <AdminSettings />;
    }
  };

  return (
    <div className="min-h-screen pt-16 flex">
      {/* Sidebar */}
      <aside className={cn(
        "sticky top-16 h-[calc(100vh-4rem)] border-r border-border bg-sidebar transition-all duration-300 flex flex-col shrink-0",
        collapsed ? "w-16" : "w-56"
      )}>
        <div className="p-3 border-b border-sidebar-border flex items-center gap-2">
          <Shield className="w-5 h-5 text-sidebar-primary shrink-0" />
          {!collapsed && (
            <span className="text-sm font-bold text-sidebar-foreground truncate">
              Admin Panel
            </span>
          )}
        </div>

        <nav className="flex-1 py-2 space-y-0.5 px-2 overflow-y-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                tab === t.id
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <t.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{t.label}</span>}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-primary transition-colors flex items-center justify-center"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-6">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
