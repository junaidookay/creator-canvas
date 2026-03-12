import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Upload, Menu, X, Settings, LogOut, User, LayoutDashboard, Rss, Sun, Moon, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useUnreadCount } from '@/hooks/useNotifications';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { count: unreadCount } = useUnreadCount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
      setMobileOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-lg">
            <span className="text-slate-900 font-black text-base">J</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Joulecorp</span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search videos, creators..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
        </form>

        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Sun className="w-5 h-5 hidden dark:block" />
            <Moon className="w-5 h-5 block dark:hidden" />
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/feed')} className="text-muted-foreground hover:text-foreground">
                <Rss className="w-4 h-4 mr-1.5" /> Feed
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/upload')} className="text-muted-foreground hover:text-primary">
                <Upload className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} className="text-muted-foreground hover:text-foreground relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-semibold text-sm hover:bg-primary/30 transition-colors">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <LayoutDashboard className="w-4 h-4 mr-2" /> Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Log in</Button>
              <Button size="sm" onClick={() => navigate('/signup')}>Sign up</Button>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border p-4 space-y-2 animate-fade-in">
          <form onSubmit={handleSearch} className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </form>
          <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2 text-foreground">Home</Link>
          <Link to="/feed" onClick={() => setMobileOpen(false)} className="block py-2 text-foreground">Feed</Link>
          {user ? (
            <>
              <Link to="/upload" onClick={() => setMobileOpen(false)} className="block py-2 text-foreground">Upload</Link>
              <Link to="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-2 text-foreground">
                Notifications {unreadCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">{unreadCount}</span>}
              </Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="block py-2 text-foreground">Profile</Link>
              <Link to="/settings" onClick={() => setMobileOpen(false)} className="block py-2 text-foreground">Settings</Link>
              <Link to="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-foreground">Admin</Link>
              <button onClick={() => { signOut(); setMobileOpen(false); }} className="block py-2 text-destructive">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block py-2 text-foreground">Log in</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="block py-2 text-primary font-semibold">Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
