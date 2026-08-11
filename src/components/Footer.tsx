"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, MessageCircle, Share2, Play, Truck, RefreshCw, ShieldCheck, Headset, Phone, Mail, MapPin } from "lucide-react";

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
  const pathname = usePathname();
  if (pathname === "/signup" || pathname === "/signin") {
    return null;
  }

  return (
    <footer className="bg-white border-t border-amber-100/50 mt-16 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      {/* Trust Badges Marquee */}
      <div className="bg-[#0f1016] overflow-hidden relative flex items-center h-16 border-y border-primary/20">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: flex;
            width: fit-content;
            animation: marquee 25s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}} />
        <div className="animate-marquee flex items-center">
          {/* Duplicate the list twice to create a seamless infinite loop */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center shrink-0">
              {[
                { icon: Truck, title: "Free Shipping", sub: "On orders over ₹999" },
                { icon: RefreshCw, title: "Easy Returns", sub: "15-day easy returns" },
                { icon: ShieldCheck, title: "Premium Quality", sub: "Handcrafted excellence" },
                { icon: Headset, title: "Expert Support", sub: "Tailoring guidance" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 mx-8">
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm text-primary tracking-wider uppercase">{item.title}</span>
                  <span className="text-sm font-medium text-primary/70">— {item.sub}</span>
                  <span className="text-primary/40 ml-8 text-lg">•</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2 pr-0 lg:pr-12">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <img 
                src="/images/freedom%201.png" 
                alt="FSC – Freedom Shirt Company" 
                className="h-16 w-auto object-contain"
              />
              <div className="flex flex-col leading-none">
                <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-primary" style={{ fontFamily: 'var(--font-heading)' }}>Freedom Shirt Co.</span>
                <span className="text-xs font-semibold text-primary tracking-[0.2em] uppercase mt-1">Premium Tailoring Since 2024</span>
              </div>
            </Link>
            <p className="text-gray-500 dark:text-primary/80 font-medium text-sm leading-relaxed mb-8 max-w-sm">
              Every stitch tells a story. We craft premium shirts with the finest fabrics and meticulous attention to detail, because you deserve nothing less.
            </p>
            <div className="flex gap-4">
              {[
                { icon: Globe, href: "#" },
                { icon: MessageCircle, href: "#" },
                { icon: Share2, href: "#" },
                { icon: Play, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-gray-600 hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-1 transition-all duration-300 shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-extrabold text-base text-gray-900 dark:text-primary mb-6 tracking-wide uppercase">{title}</h4>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-gray-500 dark:text-primary/80 hover:text-primary dark:hover:text-primary hover:translate-x-1 inline-block transition-all"
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
            <h4 className="font-extrabold text-base text-gray-900 dark:text-primary mb-6 tracking-wide uppercase">Contact Us</h4>
            <div className="space-y-5 text-sm text-gray-500 dark:text-primary/80 font-medium">
              <div className="flex items-center gap-4 hover:text-primary transition-colors cursor-pointer group">
                <div className="bg-amber-50 dark:bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-4 h-4 text-gray-600 dark:text-primary group-hover:text-primary dark:group-hover:text-primary" />
                </div>
                <p>+91 98765 43210</p>
              </div>
              <div className="flex items-center gap-4 hover:text-primary transition-colors cursor-pointer group">
                <div className="bg-amber-50 dark:bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-gray-600 dark:text-primary group-hover:text-primary dark:group-hover:text-primary" />
                </div>
                <p>hello@freedomshirtco.com</p>
              </div>
              <div className="flex items-start gap-4 hover:text-primary transition-colors cursor-pointer group">
                <div className="bg-amber-50 dark:bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <MapPin className="w-4 h-4 text-gray-600 dark:text-primary group-hover:text-primary dark:group-hover:text-primary" />
                </div>
                <p className="leading-relaxed">Freedom Shirt Co.<br />Tamil Nadu, India</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-amber-100/50 dark:border-primary/20 bg-gradient-to-r from-amber-50/20 via-white to-amber-50/20 dark:from-[#0f1016] dark:via-[#0f1016] dark:to-[#0f1016]">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-gray-400 dark:text-primary/70">
            © {new Date().getFullYear()} Freedom Shirt Company (FSC). All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-gray-400 dark:text-primary/70 uppercase tracking-wider">
            <span className="hover:text-primary transition-colors cursor-pointer">VISA</span>
            <span className="text-gray-200 dark:text-primary/30">•</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Mastercard</span>
            <span className="text-gray-200 dark:text-primary/30">•</span>
            <span className="hover:text-primary transition-colors cursor-pointer">UPI</span>
            <span className="text-gray-200 dark:text-primary/30">•</span>
            <span className="hover:text-primary transition-colors cursor-pointer">G Pay</span>
            <span className="text-gray-200 dark:text-primary/30">•</span>
            <span className="hover:text-primary transition-colors cursor-pointer">PhonePe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
