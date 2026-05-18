import { Link } from "react-router-dom";
import { Instagram, Twitter, Mail, Settings } from "lucide-react";
import logoImage from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={logoImage} 
                alt="AIPrintVerse Logo" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="font-display text-xl font-semibold text-foreground">
                AIPrintVerse
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-curated print-on-demand designs for t-shirts, mugs, stickers, and more.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/designs" className="text-muted-foreground hover:text-primary transition-colors">
                  All Designs
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">
              Categories
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/designs?category=T-Shirts" className="text-muted-foreground hover:text-primary transition-colors">
                  T-Shirts
                </Link>
              </li>
              <li>
                <Link to="/designs?category=Hoodies" className="text-muted-foreground hover:text-primary transition-colors">
                  Hoodies
                </Link>
              </li>
              <li>
                <Link to="/designs?category=Mugs" className="text-muted-foreground hover:text-primary transition-colors">
                  Mugs
                </Link>
              </li>
              <li>
                <Link to="/designs?category=Stickers" className="text-muted-foreground hover:text-primary transition-colors">
                  Stickers
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">
              Connect
            </h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-border pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <p>© 2025 AIPrintVerse. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <p className="text-xs">
                Affiliate Disclosure: We earn commissions from qualifying purchases through our affiliate links.
              </p>
              <Link 
                to="/admin" 
                className="opacity-30 hover:opacity-100 transition-opacity"
                aria-label="Admin"
              >
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
