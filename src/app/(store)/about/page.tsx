import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Scissors, Shirt, Sparkles, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "About Us | Freedom Shirt Co.",
  description: "Learn about Freedom Shirt Co., our heritage, bespoke tailoring craftsmanship, and commitment to luxury fabrics.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-stone-50/50">
      {/* Hero Banner Section */}
      <section className="relative h-[460px] md:h-[540px] w-full flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <Image
          src="/images/about-hero-banner.jpg"
          alt="Freedom Shirt Co. Tailoring Atelier"
          fill
          priority
          className="object-cover object-center scale-105 transition-transform duration-1000"
        />
        
        {/* Luxury Vignette & Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/75 to-stone-950/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-widest uppercase mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Bespoke Tailoring & Heritage
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-md">
            Crafting Confidence
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-stone-200/90 max-w-2xl font-light leading-relaxed drop-shadow">
            Welcome to <span className="font-semibold text-amber-300">Freedom Shirt Co.</span> We believe in premium tailoring, unmatched comfort, and style that speaks for itself.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/products">
              <Button size="lg" className="rounded-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-8 shadow-lg shadow-amber-500/20 cursor-pointer">
                Explore Collection
              </Button>
            </Link>
            <a href="#story">
              <Button variant="outline" size="lg" className="rounded-full bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm cursor-pointer">
                Our Story
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Story & Showcase Section */}
      <section id="story" className="py-20 md:py-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-md border border-amber-200/60 dark:border-amber-800/40">
              The Journey
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
              Our Story of True Craftsmanship
            </h2>
            
            <div className="w-16 h-1 bg-amber-500 rounded-full"></div>

            <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
              Founded on the principles of classic menswear with a modern twist, <strong className="text-stone-900 font-semibold">Freedom Shirt Co.</strong> began as a passionate pursuit dedicated to finding the perfect fit.
            </p>
            
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
              We sourced the finest natural cotton and breathable linens, partnered with master tailors, and created a signature collection that honors tradition while embracing modern everyday freedom.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-6 border-t border-stone-200">
              <div>
                <div className="text-3xl font-extrabold text-stone-900">100%</div>
                <div className="text-xs text-stone-500 uppercase tracking-wider mt-1">Pure Fine Fabrics</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-stone-900">25+</div>
                <div className="text-xs text-stone-500 uppercase tracking-wider mt-1">Quality Checkpoints</div>
              </div>
            </div>
          </div>

          {/* Right: 3-Grid Showcase */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-[560px]">
              
              {/* Tall Box (Left in Grid): Model Wearing Company Tailored Shirt */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl group border border-stone-200/80 sm:row-span-2 h-full min-h-[300px] sm:min-h-[560px]">
                <Image
                  src="/images/about-model-shirt.jpg"
                  alt="Model wearing Freedom Shirt Co. Tailored Navy Shirt"
                  fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/20" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/80 text-[11px] font-bold uppercase tracking-wider text-stone-950 mb-1.5 backdrop-blur-sm">
                    Signature Fit
                  </span>
                  <p className="text-sm font-semibold text-white">FSC Tailored Navy Linen Shirt</p>
                  <p className="text-xs text-stone-300">Worn by our community worldwide</p>
                </div>
              </div>

              {/* Top Right Box: Company Logo Emblem Card */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg p-6 bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 border border-amber-500/30 flex flex-col items-center justify-center text-center group h-[270px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative w-24 h-24 mb-3 transition-transform duration-300 group-hover:scale-110">
                    <Image
                      src="/images/freedom%201.png"
                      alt="Freedom Shirt Co. Official Logo"
                      fill
                      className="object-contain drop-shadow-md"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-wide">Freedom Shirt Co.</h3>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 mt-1">Premium Tailoring</p>
                  <p className="text-[11px] text-stone-400 mt-2 max-w-[200px]">The hallmark of excellence in tailored elegance.</p>
                </div>
              </div>

              {/* Bottom Right Box: Best Shirt Close-up Detail */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg group border border-stone-200/80 h-[270px]">
                <Image
                  src="/images/about-shirt-detail.jpg"
                  alt="Freedom Shirt Co. Shirt Stitching & Mother of Pearl Detail"
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-black/20 to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold text-white mb-1">
                    Craftsmanship Detail
                  </span>
                  <p className="text-sm font-semibold text-white">Natural Weave & Mother-of-Pearl Buttons</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-stone-100/70 border-y border-stone-200/80 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-100/80 px-3 py-1 rounded-md">
              Why Choose FSC
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mt-3 mb-4">Our Core Values</h2>
            <p className="text-stone-600 text-base sm:text-lg">What drives us every single day to deliver unparalleled luxury to your doorstep.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200/70 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-amber-200/50">
                <Scissors className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-stone-900">Bespoke Tailoring</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Expert artisans sculpt every collar, cuff, and seam with surgical precision for a drape that feels custom-made for you.
              </p>
            </div>
            
            {/* Value 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200/70 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-amber-200/50">
                <Shirt className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-stone-900">Finest Pure Fabrics</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                We hand-select breathable Egyptian cottons, European linens, and wrinkle-resistant weaves that soften gracefully with age.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200/70 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-amber-200/50">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-stone-900">Ethical & Lasting</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Committed to fair craftsmanship, sustainable sourcing, and garments engineered to stay in your wardrobe for years.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 md:px-8 text-center max-w-4xl mx-auto">
        <div className="bg-stone-900 text-white rounded-3xl p-10 sm:p-14 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Experience True Freedom</h2>
            <p className="text-base sm:text-lg text-stone-300 font-light leading-relaxed">
              Elevate your daily presence with shirts that embody comfort, confidence, and bespoke luxury.
            </p>
            <div className="pt-2">
              <Link href="/products">
                <Button size="lg" className="rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-10 py-6 text-base cursor-pointer shadow-lg shadow-amber-500/30">
                  Shop All Shirts
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
