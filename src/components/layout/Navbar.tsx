import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Upload, Menu, X, Settings, LogOut, User, LayoutDashboard, Rss, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center glow-primary">
            <span className="text-primary-foreground font-black text-base">V</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight hidden sm:block">VSTREAM</span>
        </Link>

        <div className="hidden md:flex items-center flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search videos, creators..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            />
          </div>
        </div>

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
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input placeholder="Search..." className="w-full pl-10 pr-4 py-2 rounded-full bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none" />
          </div>
          <Link to="/" onClick={() => setMobileOpen(false)} className="block py-2 text-foreground">Home</Link>
          <Link to="/feed" onClick={() => setMobileOpen(false)} className="block py-2 text-foreground">Feed</Link>
          {user ? (
            <>
              <Link to="/upload" onClick={() => setMobileOpen(false)} className="block py-2 text-foreground">Upload</Link>
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
