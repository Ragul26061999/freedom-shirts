"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingCart,
  Moon,
  Sun,
  User,
  LogIn,
  LogOut,
  Settings,
  Package,
  LayoutDashboard,
  Truck,
  Heart,
  Home,
  LayoutGrid,
  Menu,
  X,
  ChevronDown,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useCategories, useCurrentProfile } from "@/hooks/queries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);

  const { totalItems } = useCart();
  const { totalItems: wishlistItems } = useWishlist();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  const { data: categories } = useCategories();
  const { data: profile } = useCurrentProfile();

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close categories dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setIsCategoriesOpen(false);
      }
    };
    if (isCategoriesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCategoriesOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileCategoriesOpen(false);
    setIsCategoriesOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  if (!mounted) return null;

  if (pathname === "/login" || pathname === "/signin" || pathname === "/signup") {
    return null;
  }

  const isHome = pathname === "/";
  const navBackgroundClass = isHome && !isScrolled
    ? "bg-primary/5 backdrop-blur-md border-transparent"
    : "bg-primary/10 backdrop-blur supports-[backdrop-filter]:bg-primary/5 border-b border-primary/20 shadow-sm";

  const dynamicCategories = (categories || []).map((c) => ({
    name: c.name,
    href: `/?category=${c.id}`,
    image: c.description && c.description.startsWith('http') ? c.description : null,
    emoji: c.description && c.description.startsWith('http') ? null : "🛍️",
  }));

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "My Orders", href: "/dashboard" },
    { name: "About", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  return (
    <>
      <header className="fixed top-0 z-50 w-full transition-all duration-300">

      {/* Main Navbar */}
      <div className={`transition-colors duration-300 ${navBackgroundClass}`}>
        <div className="container mx-auto px-4 h-20 sm:h-24 flex items-center justify-between gap-2 sm:gap-4 relative">

          {/* Left: Hamburger Menu Button */}
          <div className="flex items-center gap-2 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Center: Logo */}
          <div className="flex items-center justify-center">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">
              <img
                src="/images/freedom%201.png"
                alt="FSC – Freedom Shirt Company"
                className="h-14 sm:h-20 md:h-24 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
              />
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Freedom Shirt Co.</span>
                <span className="text-[10px] sm:text-xs font-bold text-primary tracking-[0.25em] uppercase mt-0.5">Premium Tailoring</span>
              </div>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center flex-1 justify-end">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white/85 dark:bg-card/85 backdrop-blur-md border border-amber-200/60 dark:border-border shadow-sm rounded-full p-1 transition-all">

              {/* Wishlist */}
              <Link href="/wishlist" className="hidden md:block">
                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full cursor-pointer flex hover:bg-primary/10 hover:text-primary transition-colors">
                  <Heart className="h-4 w-4" />
                  {wishlistItems > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm">
                      {wishlistItems}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Theme */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* User */}
              {user ? (
                <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full cursor-pointer overflow-hidden border border-primary/20">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-semibold text-xs">
                            {user.email?.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.email?.split("@")[0] || "User"}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/admin/products")}>
                          <Package className="mr-2 h-4 w-4" />
                          <span>Products</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/admin/orders")}>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span>Orders</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/admin/shipping")}>
                          <Truck className="mr-2 h-4 w-4" />
                          <span>Shipping</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/admin")}>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex cursor-pointer gap-2 h-8 rounded-full px-3 text-xs"
                  onClick={() => router.push("/signup")}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Login</span>
                </Button>
              )}

              {/* Cart */}
              <Link href="/cart" className="hidden md:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 rounded-full cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                      {totalItems}
                    </span>
                  )}
                  <span className="sr-only">Shopping cart</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>

      {/* Slide-in Menu Panel (works on ALL screen sizes) */}
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Menu panel */}
      <div
        className={`fixed top-0 left-0 z-[70] h-full w-[300px] sm:w-[340px] bg-white dark:bg-card shadow-2xl transition-transform duration-300 ease-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
            <img
              src="/images/freedom%201.png"
              alt="FSC"
              className="h-10 w-auto object-contain"
            />
            <span className="text-base font-extrabold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>FSC</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-primary/10 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Menu Links */}
        <div className="overflow-y-auto h-[calc(100%-65px)] pb-20">
          <nav className="px-3 py-4">
            {/* Main Nav Links */}
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all duration-200 mb-1 ${
                  pathname === link.href
                    ? "text-primary bg-primary/10 font-semibold"
                    : "text-foreground hover:bg-muted hover:text-primary"
                }`}
              >
                {link.name === "Home" && <Home className="h-[18px] w-[18px]" />}
                {link.name === "My Orders" && <Package className="h-[18px] w-[18px]" />}
                {link.name === "About" && <User className="h-[18px] w-[18px]" />}
                {link.name === "Contact Us" && <Mail className="h-[18px] w-[18px]" />}
                {link.name}
              </Link>
            ))}

            {/* Categories Accordion */}
            {dynamicCategories.length > 0 && (
              <div className="mb-1">
                <button
                  onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all duration-200 ${
                    isMobileCategoriesOpen
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-foreground hover:bg-muted hover:text-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="h-[18px] w-[18px]" />
                    Categories
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMobileCategoriesOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Sub-categories */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isMobileCategoriesOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 py-3 grid grid-cols-3 gap-3 bg-muted/30 rounded-xl mx-2 mb-2">
                    {dynamicCategories.map((cat) => (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div className="w-full aspect-[3/4] bg-white dark:bg-black rounded-lg overflow-hidden flex items-center justify-center border border-border group-hover:border-primary/50 shadow-sm transition-all duration-300">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{cat.emoji}</span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-center text-muted-foreground group-hover:text-primary leading-tight line-clamp-2">
                          {cat.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </nav>

          {/* Divider */}
          <div className="mx-5 border-t border-border my-2" />

          {/* Account Actions for mobile */}
          <div className="px-3 py-3 md:hidden">
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Account</p>
            <Link
              href="/wishlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-foreground hover:bg-muted hover:text-primary transition-all"
            >
              <Heart className="h-[18px] w-[18px]" />
              Wishlist
              {wishlistItems > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {wishlistItems}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-foreground hover:bg-muted hover:text-primary transition-all"
            >
              <ShoppingCart className="h-[18px] w-[18px]" />
              Cart
              {totalItems > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-foreground hover:bg-muted hover:text-primary transition-all"
                >
                  <User className="h-[18px] w-[18px]" />
                  Profile
                </Link>
                <button
                  onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-foreground hover:bg-muted hover:text-primary transition-all"
              >
                <LogIn className="h-[18px] w-[18px]" />
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Categories Mega Menu (click-only, no hover) */}
      {isCategoriesOpen && (
        <div ref={categoriesRef} className="fixed top-20 sm:top-24 left-0 w-full z-[55] bg-card border-b border-border shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Column 1: Dynamic Categories */}
              <div>
                <h4 className="font-semibold text-foreground mb-4 text-sm">Our Collection</h4>
                <ul className="space-y-3">
                  {dynamicCategories.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground hover:text-primary hover:underline transition-all"
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 2: Trending */}
              <div className="border-r border-border/50 pr-8 hidden md:block">
                <h4 className="font-semibold text-foreground mb-4 text-sm">Now Trending</h4>
                <ul className="space-y-3 mb-8">
                  {['Throwback Fashion', 'Western Revival', 'Pretty In Pink', 'View All Trends'].map((item) => (
                    <li key={item}>
                      <Link href="#" className="text-sm text-muted-foreground hover:text-primary hover:underline transition-all">{item}</Link>
                    </li>
                  ))}
                </ul>

                <h4 className="font-semibold text-foreground mb-4 text-sm">Featured Shops</h4>
                <ul className="space-y-3">
                  {['Best Sellers', 'Perfect Pairings'].map((item) => (
                    <li key={item}>
                      <Link href="#" className="text-sm text-muted-foreground hover:text-primary hover:underline transition-all">{item}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Featured Image */}
              <div className="pl-4 hidden md:block">
                <div className="rounded-md overflow-hidden bg-muted aspect-square mb-4 relative group/img cursor-pointer">
                  <div className="absolute inset-0 bg-black/5 group-hover/img:bg-transparent transition-colors z-10" />
                  <img
                    src="https://images.unsplash.com/photo-1518002171953-a080ee817e1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    alt="Featured Collection"
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                  />
                </div>
                <h4 className="text-lg font-medium text-foreground mb-1">Valentine's Day, Your Way</h4>
                <p className="text-sm text-muted-foreground mb-4">Self-love is just self-care in a cuter outfit.</p>
                <Button variant="outline" className="w-full rounded-none border-foreground hover:bg-foreground hover:text-background transition-colors">
                  Shop the collection
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/" className={`flex flex-col items-center gap-1 w-16 py-2 ${pathname === "/" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}>
            <Home className={`h-5 w-5 ${pathname === "/" ? "fill-primary/20" : ""}`} />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>

          <Link href="/?category=all" className={`flex flex-col items-center gap-1 w-16 py-2 ${pathname.includes("category") ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}>
            <LayoutGrid className={`h-5 w-5 ${pathname.includes("category") ? "fill-primary/20" : ""}`} />
            <span className="text-[10px] font-semibold">Products</span>
          </Link>

          <Link href="/wishlist" className={`flex flex-col items-center gap-1 w-16 py-2 relative ${pathname === "/wishlist" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}>
            <div className="relative">
              <Heart className={`h-5 w-5 ${pathname === "/wishlist" ? "fill-primary/20" : ""}`} />
              {wishlistItems > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                  {wishlistItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Wishlist</span>
          </Link>

          <Link href="/cart" className={`flex flex-col items-center gap-1 w-16 py-2 relative ${pathname === "/cart" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}>
            <div className="relative">
              <ShoppingCart className={`h-5 w-5 ${pathname === "/cart" ? "fill-primary/20" : ""}`} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Cart</span>
          </Link>

          <Link href={user ? "/profile" : "/login"} className={`flex flex-col items-center gap-1 w-16 py-2 ${pathname === "/profile" ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}>
            {profile?.avatar_url ? (
              <div className={`h-6 w-6 rounded-full overflow-hidden border-2 ${pathname === "/profile" ? "border-primary" : "border-gray-200"}`}>
                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${pathname === "/profile" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 bg-gray-50 text-gray-500"}`}>
                {user ? user.email?.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </div>
            )}
            <span className="text-[10px] font-semibold">{user ? "Profile" : "Login"}</span>
          </Link>
        </div>
      </div>
    </>
  );
}
