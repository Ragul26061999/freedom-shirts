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
  Search,
  X,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useCategories } from "@/hooks/queries";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsCategoriesOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsCategoriesOpen(false);
    }, 200); // 200ms grace period prevents accidental closing
  };

  const { totalItems } = useCart();
  const { totalItems: wishlistItems } = useWishlist();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  const { data: categories } = useCategories();

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!mounted) return null;

  if (pathname === "/login" || pathname === "/signin" || pathname === "/signup") {
    return null;
  }

  const dynamicCategories = (categories || []).map((c) => ({
    name: c.name,
    href: `/${c.name.toLowerCase()}`,
  }));

  const mobileItems = [
    { name: "Home", href: "/" },
    ...dynamicCategories
  ];

  return (
    <header className="sticky top-0 z-50 w-full">


      {/* Main Navbar */}
      <div className="bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="from-primary to-primary/80 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-md">
              <span className="text-primary-foreground text-sm font-bold">in</span>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-lg font-extrabold tracking-tight text-foreground">Innova</span>
              <span className="text-[9px] font-medium text-muted-foreground tracking-widest uppercase">e-Commerce</span>
            </div>
          </Link>

          {/* Desktop Category Nav */}
          <nav className="hidden lg:flex items-center gap-1 h-full">
            <Link
              href="/"
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                pathname === "/"
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Home
            </Link>

            {dynamicCategories.length > 0 && (
              <div 
                className="flex items-center h-full"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <Button 
                  variant="ghost" 
                  className={`px-3 py-1.5 text-sm font-medium cursor-pointer h-auto transition-colors ${
                    isCategoriesOpen ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                >
                  Categories
                </Button>
                
                {/* Mega Menu Dropdown */}
                <div 
                  className={`absolute top-full left-0 w-full bg-card border-b border-border shadow-2xl z-50 transition-all duration-300 origin-top ${
                    isCategoriesOpen 
                      ? "opacity-100 visible translate-y-0" 
                      : "opacity-0 invisible -translate-y-2 pointer-events-none"
                  }`}
                >
                  <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Column 1: Dynamic Categories */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-4 text-sm flex items-center justify-between group/link cursor-pointer">
                          <span className="group-hover/link:text-primary transition-colors">Our Collection</span>
                          <span className="text-primary text-xs opacity-0 group-hover/link:opacity-100 transition-opacity">&gt;</span>
                        </h4>
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

                      {/* Column 4: Trending */}
                      <div className="border-r border-border/50 pr-8 hidden md:block">
                        <h4 className="font-semibold text-foreground mb-4 text-sm flex items-center justify-between group/link cursor-pointer">
                          <span className="group-hover/link:text-primary transition-colors">Now Trending</span>
                          <span className="text-primary text-xs opacity-0 group-hover/link:opacity-100 transition-opacity">&gt;</span>
                        </h4>
                        <ul className="space-y-3 mb-8">
                          {['Throwback Fashion', 'Western Revival', 'Pretty In Pink', 'View All Trends'].map((item) => (
                            <li key={item}>
                              <Link href="#" className="text-sm text-muted-foreground hover:text-primary hover:underline transition-all">{item}</Link>
                            </li>
                          ))}
                        </ul>
                        
                        <h4 className="font-semibold text-foreground mb-4 text-sm flex items-center justify-between group/link cursor-pointer">
                          <span className="group-hover/link:text-primary transition-colors">Featured Shops</span>
                          <span className="text-primary text-xs opacity-0 group-hover/link:opacity-100 transition-opacity">&gt;</span>
                        </h4>
                        <ul className="space-y-3">
                          {['Best Sellers', 'Perfect Pairings'].map((item) => (
                            <li key={item}>
                              <Link href="#" className="text-sm text-muted-foreground hover:text-primary hover:underline transition-all">{item}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Column 5: Featured Image */}
                      <div className="pl-4 hidden md:block">
                        <div className="rounded-md overflow-hidden bg-muted aspect-square mb-4 relative group/img cursor-pointer">
                          <div className="absolute inset-0 bg-black/5 group-hover/img:bg-transparent transition-colors z-10" />
                          <img 
                            src="https://images.unsplash.com/photo-1518002171953-a080ee817e1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                            alt="Valentine's Day Collection" 
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <h4 className="text-lg font-medium text-foreground mb-1">Valentine's Day, Your Way</h4>
                        <p className="text-sm text-muted-foreground mb-4">Self-love is just self-care in a cuter outfit.</p>
                        <Button variant="outline" className="w-full rounded-none border-foreground hover:bg-foreground hover:text-background transition-colors">
                          Shop the collection
                        </Button>
                        <Link href="#" className="block mt-4 text-sm text-muted-foreground hover:text-primary hover:underline">
                          Read our blog
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            {searchOpen ? (
              <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchTerm.trim()) {
                      router.push(`/?search=${encodeURIComponent(searchTerm.trim())}`);
                      setSearchOpen(false);
                    }
                  }}
                  placeholder="Search products..."
                  className="bg-transparent text-sm outline-none w-36 sm:w-56 placeholder:text-muted-foreground"
                />
                <button onClick={() => { setSearchOpen(false); setSearchTerm(""); }}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 cursor-pointer"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Wishlist */}
            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 cursor-pointer hidden sm:flex hover:bg-primary/10 hover:text-primary transition-colors">
                <Heart className="h-5 w-5" />
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
              className="h-9 w-9 cursor-pointer"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full cursor-pointer">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold text-sm">
                        {user.email?.charAt(0).toUpperCase() || "U"}
                      </div>
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
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex cursor-pointer gap-2"
                onClick={() => router.push("/signup")}
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Button>
            )}

            {/* Cart */}
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
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

        {/* Mobile Category Row */}
        <div className="lg:hidden border-t border-border overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 px-4 py-2">
            {mobileItems.slice(0, 8).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
