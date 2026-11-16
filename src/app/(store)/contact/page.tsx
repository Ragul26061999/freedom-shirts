import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Globe,
  Share2,
  ArrowRight,
  Scissors,
  Truck,
  RotateCcw,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactForm } from "./_components/ContactForm";

export const metadata = {
  title: "Contact Us | Freedom Shirt Co.",
  description:
    "Get in touch with Freedom Shirt Co. for order support, custom tailoring, bulk enquiries, and general questions.",
};

const contactDetails = [
  {
    icon: Phone,
    title: "Call us",
    lines: ["+91 98765 43210"],
    href: "tel:+919876543210",
    note: "Mon–Sat, 10:00 AM – 7:00 PM IST",
  },
  {
    icon: Mail,
    title: "Email us",
    lines: ["hello@freedomshirtco.com"],
    href: "mailto:hello@freedomshirtco.com",
    note: "We reply within one business day",
  },
  {
    icon: MapPin,
    title: "Visit us",
    lines: ["Freedom Shirt Co.", "Tamil Nadu, India"],
    href: "https://maps.google.com/?q=Tamil+Nadu+India",
    note: "Studio visits by appointment",
  },
  {
    icon: Clock,
    title: "Working hours",
    lines: ["Monday – Saturday", "10:00 AM – 7:00 PM IST"],
    href: undefined,
    note: "Closed on Sundays & public holidays",
  },
];

const quickHelp = [
  {
    icon: Truck,
    title: "Shipping & delivery",
    description: "Track an order or ask about delivery timelines.",
    href: "/dashboard",
  },
  {
    icon: RotateCcw,
    title: "Returns & refunds",
    description: "Start a return within the 7-day window.",
    href: "/dashboard",
  },
  {
    icon: Scissors,
    title: "Custom & bulk orders",
    description: "Corporate uniforms, events, and bespoke tailoring.",
    href: "/products",
  },
  {
    icon: HelpCircle,
    title: "Product & sizing",
    description: "Need help choosing the right fit or fabric?",
    href: "/products",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-stone-50/60">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 pt-28 pb-16 sm:pt-36 sm:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-300 backdrop-blur-sm">
            <MessageCircle className="h-3.5 w-3.5" />
            We&apos;re here to help
          </span>

          <h1
            className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Contact Freedom Shirt Co.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base font-light leading-relaxed text-stone-300 sm:text-lg">
            Questions about an order, a custom fit, or a bulk requirement? Reach
            out and our tailoring team will get back to you.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="container mx-auto -mt-10 px-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactDetails.map((detail) => {
            const Icon = detail.icon;
            const content = (
              <div className="group h-full rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-md">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200/70 bg-amber-50 text-amber-700 transition-colors group-hover:bg-amber-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-stone-900">
                  {detail.title}
                </h2>
                <div className="mt-2 space-y-0.5 text-sm font-medium text-stone-700">
                  {detail.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <p className="mt-2 text-xs text-stone-500">{detail.note}</p>
              </div>
            );

            return detail.href ? (
              <a
                key={detail.title}
                href={detail.href}
                target={detail.href.startsWith("http") ? "_blank" : undefined}
                rel={detail.href.startsWith("http") ? "noreferrer" : undefined}
              >
                {content}
              </a>
            ) : (
              <div key={detail.title}>{content}</div>
            );
          })}
        </div>
      </section>

      {/* Form + info */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
              <h2 className="text-2xl font-bold text-stone-900">
                Send us a message
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                Fill in the form and we&apos;ll get back to you within one
                business day.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>
          </div>

          {/* Side info */}
          <div className="space-y-6 lg:col-span-5">
            <div className="overflow-hidden rounded-3xl bg-stone-900 p-8 text-white shadow-lg">
              <h2 className="text-xl font-bold">Need a faster response?</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-300">
                For urgent order issues, call us directly during business hours
                and keep your order number handy.
              </p>
              <a href="tel:+919876543210" className="mt-6 block">
                <Button className="w-full gap-2 rounded-full bg-amber-500 font-bold text-stone-950 hover:bg-amber-400">
                  <Phone className="h-4 w-4" /> +91 98765 43210
                </Button>
              </a>
              <a
                href="mailto:hello@freedomshirtco.com"
                className="mt-3 block"
              >
                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Mail className="h-4 w-4" /> hello@freedomshirtco.com
                </Button>
              </a>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-bold text-stone-900">Follow us</h2>
              <p className="mt-1 text-sm text-stone-600">
                Stay updated with new collections and offers.
              </p>
              <div className="mt-5 flex gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-stone-700 transition-colors hover:bg-amber-500 hover:text-stone-950"
                >
                  <Globe className="h-5 w-5" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-stone-700 transition-colors hover:bg-amber-500 hover:text-stone-950"
                >
                  <Share2 className="h-5 w-5" />
                </a>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-stone-700 transition-colors hover:bg-amber-500 hover:text-stone-950"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick help */}
      <section className="border-t border-stone-200 bg-white px-4 py-16">
        <div className="container mx-auto">
          <div className="mb-10 text-center">
            <span className="rounded-md bg-amber-100/80 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-700">
              Quick help
            </span>
            <h2 className="mt-3 text-2xl font-bold text-stone-900 sm:text-3xl">
              Looking for something specific?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickHelp.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-stone-50/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:bg-white hover:shadow-md"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-stone-900">{item.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-stone-600">
                    {item.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-700">
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
