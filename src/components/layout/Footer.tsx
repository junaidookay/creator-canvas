import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-border py-10 mt-16">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md bg-muted border border-border flex items-center justify-center">
              <span className="text-foreground font-black text-xs">J</span>
            </div>
            <span className="font-bold text-foreground">Joulecorp</span>
          </div>
          <p className="text-sm text-muted-foreground">Next-generation creator streaming platform.</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-sm">Platform</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <Link to="/" className="block hover:text-foreground transition-colors">Home</Link>
            <Link to="/feed" className="block hover:text-foreground transition-colors">Feed</Link>
            <Link to="/upload" className="block hover:text-foreground transition-colors">Upload</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-sm">Account</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <Link to="/login" className="block hover:text-foreground transition-colors">Log in</Link>
            <Link to="/signup" className="block hover:text-foreground transition-colors">Sign up</Link>
            <Link to="/settings" className="block hover:text-foreground transition-colors">Settings</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-sm">Legal</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <span className="block">Terms of Service</span>
            <span className="block">Privacy Policy</span>
            <span className="block">DMCA</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Joulecorp. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
