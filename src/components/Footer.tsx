"use client";

import Link from "next/link";
import { Globe, MessageCircle, Share2, Play } from "lucide-react";

const footerLinks = {
  "Customer Service": [
    { label: "Contact Us", href: "/contact" },
    { label: "Shipping & Delivery", href: "/" },
    { label: "Returns & Refunds", href: "/" },
    { label: "FAQ", href: "/" },
    { label: "Size Guide", href: "/" },
    { label: "Track Order", href: "/" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      {/* Trust Badges */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: "🚚", title: "Free Shipping", sub: "On orders over ₹50" },
              { icon: "↩️", title: "30-Day Returns", sub: "Hassle-free returns" },
              { icon: "🔒", title: "Secure Payment", sub: "100% secure checkout" },
              { icon: "💬", title: "24/7 Support", sub: "We're here to help" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-2">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="from-primary to-primary/80 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-md">
                <span className="text-primary-foreground text-sm font-bold">in</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Innova</span>
              <span className="text-xs font-medium text-muted-foreground mt-1 tracking-widest uppercase">e-Commerce</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Premium quality fashion for modern lifestyles. Discover the latest trends and timeless classics.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Globe, href: "#" },
                { icon: MessageCircle, href: "#" },
                { icon: Share2, href: "#" },
                { icon: Play, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm text-foreground mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4">Contact Us</h4>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <p>📞 +1 (800) 123-4567</p>
              <p>✉️ support@innova.com</p>
              <p>📍 123 Fashion Street<br />New York, NY 10001, USA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2024 Innova e-Commerce. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>VISA</span>
            <span className="text-border">|</span>
            <span>Mastercard</span>
            <span className="text-border">|</span>
            <span>PayPal</span>
            <span className="text-border">|</span>
            <span>Apple Pay</span>
            <span className="text-border">|</span>
            <span>G Pay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
