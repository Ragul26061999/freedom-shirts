# Ecommerce Supabase Next.js

A modern e-commerce application built with Next.js 15, React 19, TypeScript, and Supabase. This project features a beautiful UI using shadcn/ui components, Tailwind CSS v4, and includes comprehensive features like authentication, product management, cart functionality, and order processing.

## Features

- 🛍️ **Complete E-commerce Solution**: Product browsing, cart management, checkout process
- 🔐 **Authentication System**: Sign up, sign in, password reset with Supabase Auth
- 👨‍💼 **Admin Panel**: Complete admin interface for managing products, orders, and users
- 📱 **Responsive Design**: Mobile-first approach with Tailwind CSS v4
- 🎨 **Modern UI**: shadcn/ui components with Radix UI primitives
- 🔍 **Product Categories**: Electronics, Clothing, Accessories with dedicated pages
- 👤 **User Dashboard**: Profile management and order history
- 🛒 **Shopping Cart**: Persistent cart with real-time updates
- 💳 **Checkout Process**: Multi-step checkout with shipping and payment forms
- 📝 **Review System**: Product reviews and ratings functionality
- 📍 **Address Management**: Multiple shipping addresses support
- 📊 **Data Management**: TanStack Query for efficient data fetching and caching
- 🌙 **Dark Mode**: Theme switching with next-themes
- 📈 **Analytics**: Chart.js integration for dashboard analytics
- 🛡️ **Row Level Security**: Comprehensive RLS policies for data protection

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- Node.js (version 18 or higher)
- npm (version 9 or higher)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/ecommerce-supabase-next.git
   cd ecommerce-supabase-next
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   POLAR_ACCESS_TOKEN="your-polar-access-token"
   POLAR_WEBHOOK_SECRET="your-polar-webhook-secret"
   ```
   
   Note: `POLAR_ACCESS_TOKEN` and `POLAR_WEBHOOK_SECRET` are server-side only and should not be exposed to the client.

## Development

To start the development server:

```bash
npm run dev
```

This will start the Next.js development server with Turbo mode enabled. Open your browser and navigate to `http://localhost:3000` to view the application.

## Available Scripts

- `npm run dev`: Start the development server with Turbo mode
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint with Next.js configuration
- `npm run version:patch`: Increment patch version
- `npm run version:minor`: Increment minor version
- `npm run version:major`: Increment major version
- `npm run version:check`: Check current version
- `npm run precommit`: Run lint and build before commit

## Project Structure

```
src/
├── app/                          # Next.js App Router pages and layouts
│   ├── (auth)/                  # Authentication routes group
│   │   ├── reset-password/      # Password reset flow
│   │   │   ├── confirmation/    # Reset confirmation page
│   │   │   ├── update/          # Password update page
│   │   │   └── page.tsx         # Reset request page
│   │   ├── signin/              # Sign in page
│   │   └── signup/              # Sign up page
│   ├── accessories/             # Accessories category page
│   ├── admin/                   # Admin panel (protected routes)
│   │   ├── orders/              # Order management
│   │   ├── products/            # Product management
│   │   ├── users/               # User management
│   │   └── layout.tsx           # Admin layout with protection
│   ├── cart/                    # Shopping cart page
│   ├── checkout/                # Multi-step checkout process
│   │   ├── confirmation/        # Order confirmation page
│   │   └── layout.tsx           # Checkout layout
│   ├── clothing/                # Clothing category page
│   ├── dashboard/               # User dashboard with analytics
│   ├── electronics/             # Electronics category page
│   ├── products/                # Product pages
│   │   └── [productId]/         # Dynamic product detail pages
│   ├── profile/                 # User profile management
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   ├── error.tsx                # Global error boundary
│   └── not-found.tsx            # 404 page
├── components/                   # Reusable React components
│   ├── admin/                   # Admin-specific components
│   │   ├── DeleteConfirmModal.tsx
│   │   ├── OrderDetailsModal.tsx
│   │   ├── ProductFormModal.tsx
│   │   └── UserDetailsModal.tsx
│   ├── checkout/                # Checkout flow components
│   ├── dashboard/               # Dashboard components
│   │   ├── DashboardCharts.tsx
│   │   ├── OrderHistoryChart.tsx
│   │   ├── OrderStatusChart.tsx
│   │   └── PaymentDistributionChart.tsx
│   ├── ui/                      # shadcn/ui components
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...                  # Additional UI components
│   ├── CategoryPage.tsx         # Category page template
│   ├── ClientProducts.tsx       # Client-side products component
│   ├── ErrorBoundary.tsx        # Error boundary component
│   ├── LoadingSpinner.tsx       # Loading states
│   ├── MainLayout.tsx           # Main application layout
│   ├── Navbar.tsx               # Navigation component
│   ├── ProductCard.tsx          # Product display card
│   ├── ProductComments.tsx      # Review system component
│   ├── Sidebar.tsx              # Application sidebar
│   └── theme-provider.tsx       # Dark mode provider
├── context/                     # React context providers
│   ├── AuthContext.tsx          # Authentication state
│   ├── CartContext.tsx          # Shopping cart state
│   └── SidebarContext.tsx       # Sidebar state
├── hooks/                       # Custom React hooks
│   ├── queries/                 # TanStack Query hooks
│   │   ├── use-cart.ts          # Cart queries
│   │   ├── use-orders.ts        # Order queries
│   │   ├── use-products.ts      # Product queries
│   │   ├── use-profile.ts       # Profile queries
│   │   └── use-reviews.ts       # Review queries
│   ├── useAdmin.ts              # Admin functionality
│   ├── useAuthForm.ts           # Authentication forms
│   ├── useCart.ts               # Cart operations
│   ├── useProducts.ts           # Product operations
│   ├── useProfile.ts            # Profile management
│   └── useSupabaseAuth.tsx      # Supabase auth integration
├── lib/                         # Library configurations
│   ├── providers/               # Provider components
│   │   └── query-provider.tsx   # TanStack Query provider
│   ├── supabase/                # Supabase client setup
│   │   ├── client.ts            # Client-side client
│   │   ├── server.ts            # Server-side client
│   │   └── clientUtils.ts       # Utility functions
│   └── utils.ts                 # General utilities
├── services/                    # Service layer for API interactions
│   ├── address/                 # Address management services
│   ├── admin/                   # Admin-specific services
│   ├── auth/                    # Authentication services
│   ├── cart/                    # Shopping cart operations
│   ├── category/                # Category management
│   ├── order/                   # Order processing
│   ├── product/                 # Product operations
│   ├── profile/                 # Profile management
│   └── review/                  # Review system
├── types/                       # TypeScript type definitions
│   ├── supabase.ts              # Supabase generated types
│   └── types.ts                 # Application types
├── utils/                       # Utility functions
│   ├── supabase/                # Supabase utilities
│   ├── adminUtils.ts            # Admin helper functions
│   ├── errorHandling.ts         # Error handling utilities
│   ├── formatCurrency.ts        # Currency formatting
│   └── testSupabase.ts          # Supabase testing utilities
└── middleware.ts                # Next.js auth middleware
```

## Technologies Used

### Core Framework

- **Next.js 15** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe JavaScript

### Styling & UI

- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **Radix UI** - Headless UI primitives
- **next-themes** - Theme switching support
- **Lucide React** - Beautiful icon library

### Backend & Data

- **Supabase** - Backend-as-a-Service (Auth, Database, Storage)
- **@supabase/ssr** - Server-side rendering support
- **TanStack Query** - Data fetching and caching
- **TanStack Table** - Powerful table component
- **Zod** - Schema validation

### Developer Experience

- **TanStack Form** - Type-safe form handling
- **Sonner** - Toast notifications
- **Chart.js & React Chart.js 2** - Data visualization
- **ESLint** - Code linting with Next.js config
- **Prettier** - Code formatting with Tailwind plugin
- **TypeScript** - Static type checking
- **Framer Motion** - Animation library
- **date-fns** - Date utility library
- **Stagewise Toolbar** - Development toolbar for debugging

## Supabase Integration

This project uses Supabase for:

- **Authentication**: User sign up, sign in, password reset
- **Database**: Products, orders, user profiles, reviews
- **Row Level Security**: Data access control
- **Real-time subscriptions**: Live data updates

For detailed Supabase setup instructions, refer to the [SUPABASE_GUIDE.md](./SUPABASE_GUIDE.md) file.

## Documentation

Additional documentation is available in the `docs/` directory:

- [API Documentation](./docs/api.md) - API endpoints and usage
- [Architecture Overview](./docs/architecture.md) - System architecture and design decisions
- [Database Schema](./docs/schema.md) - Database structure and relationships
- [README](./docs/README.md) - Additional project information

## Key Features Implementation

### Authentication Flow

- Protected routes with middleware
- Email/password authentication
- Password reset with email confirmation
- Session management with SSR
- Role-based access control (user/admin)

### E-commerce Features

- Product catalog with categories (Electronics, Clothing, Accessories)
- Shopping cart with persistence and real-time updates
- Multi-step checkout process with shipping and payment forms
- Order management with status tracking
- Product reviews and ratings system
- Address management for multiple shipping locations
- User dashboard with order history and analytics

### Admin Panel

- Comprehensive admin interface with protected routes
- Product management (create, update, delete)
- Order management and status updates
- User management with role assignments
- Data analytics with Chart.js visualizations
- Secure server actions for sensitive operations

### Performance Optimizations

- Next.js App Router for optimal loading
- TanStack Query for efficient data caching
- Image optimization with Next.js Image
- Code splitting with dynamic imports
- Server-side rendering for SEO
- Optimistic updates for better UX

### Security Features

- Row Level Security (RLS) policies in Supabase
- Middleware protection for authenticated routes
- Admin route protection
- Data sanitization and validation
- Secure server actions for admin operations

## Configuration Files

- `next.config.mjs`: Next.js configuration with image optimization
- `tsconfig.json`: TypeScript configuration with strict mode
- `postcss.config.js`: PostCSS configuration for Tailwind CSS v4
- `components.json`: shadcn/ui component configuration
- `eslint.config.js`: ESLint configuration with Next.js and TypeScript rules
- `package.json`: Dependencies and scripts configuration
- `.env.local`: Environment variables (not tracked in git)
- `middleware.ts`: Next.js middleware for authentication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
# e-commerce_sample
