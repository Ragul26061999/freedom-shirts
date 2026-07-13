import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TanStackQueryProvider } from "@/lib/providers/query-provider";
import { Toaster } from "sonner";
import { MainLayout } from "@/components/MainLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Innova e-Commerce – Discover Your Style",
    template: "%s | Innova e-Commerce",
  },
  description: "Premium quality fashion for modern lifestyles. Shop women, men, kids, shoes, bags, accessories and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <title>My App</title>
        <meta name="description" content="My App is a..." />
      </head>
      <body className="bg-background min-h-screen flex flex-col">
        <ErrorBoundary>
          <TanStackQueryProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <Navbar />
                  <MainLayout>{children}</MainLayout>
                  <Footer />
                </ThemeProvider>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </TanStackQueryProvider>
        </ErrorBoundary>
        <Toaster
          theme="light" // or "dark" or "system"
          toastOptions={{
            unstyled: false,
            classNames: {
              error: "bg-red-500 text-white border-red-600",
              success: "bg-green-500 text-white border-green-600",
              warning: "bg-yellow-500 text-black border-yellow-600",
              info: "bg-blue-500 text-white border-blue-600",
            },
          }}
        />
        
      </body>
    </html>
  );
}
