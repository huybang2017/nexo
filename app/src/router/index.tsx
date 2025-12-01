import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Layouts
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';

// Guards
import { AuthGuard } from '@/components/guards/AuthGuard';
import { GuestGuard } from '@/components/guards/GuestGuard';
import { RoleGuard } from '@/components/guards/RoleGuard';

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

// Lazy load pages
// Landing Pages
const HomePage = lazy(() => import('@/pages/landing/HomePage'));
const AboutPage = lazy(() => import('@/pages/landing/AboutPage'));
const HowItWorksPage = lazy(() => import('@/pages/landing/HowItWorksPage'));
const FAQPage = lazy(() => import('@/pages/landing/FAQPage'));
const ContactPage = lazy(() => import('@/pages/landing/ContactPage'));

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { OAuth2RedirectPage } from '@/pages/auth/OAuth2RedirectPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';

// Borrower Pages
import { BorrowerDashboard } from '@/pages/borrower/BorrowerDashboard';
import { CreateLoanPage } from '@/pages/borrower/CreateLoanPage';
const MyLoansPage = lazy(() => import('@/pages/borrower/MyLoansPage'));
const BorrowerLoanDetailPage = lazy(() => import('@/pages/borrower/LoanDetailPage'));
const BorrowerKYCPage = lazy(() => import('@/pages/borrower/KYCPage'));

// Lender Pages
import { MarketplacePage } from '@/pages/lender/MarketplacePage';
import { LoanDetailPage as LenderLoanDetailPage } from '@/pages/lender/LoanDetailPage';
const PortfolioPage = lazy(() => import('@/pages/lender/PortfolioPage'));

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { UsersPage } from '@/pages/admin/UsersPage';
const LoansManagementPage = lazy(() => import('@/pages/admin/LoansManagementPage'));
const KYCManagementPage = lazy(() => import('@/pages/admin/KYCManagementPage'));
const KYCDetailPage = lazy(() => import('@/pages/admin/KYCDetailPage'));
const WithdrawalsPage = lazy(() => import('@/pages/admin/WithdrawalsPage'));
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'));
const SystemSettingsPage = lazy(() => import('@/pages/admin/SystemSettingsPage'));

// Shared Pages
import { WalletPage } from '@/pages/shared/WalletPage';
import { PaymentResultPage } from '@/pages/shared/PaymentResultPage';
const ProfilePage = lazy(() => import('@/pages/shared/ProfilePage'));
const NotificationsPage = lazy(() => import('@/pages/shared/NotificationsPage'));

// Error Pages
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'));
const ForbiddenPage = lazy(() => import('@/pages/errors/ForbiddenPage'));

// Wrap lazy components
const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Main landing layout
const LandingLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<PageLoader />}>
        <HomePage />
      </Suspense>
    </div>
  );
};

export const router = createBrowserRouter([
  // Public/Landing routes
  {
    path: '/',
    element: <LandingLayout />,
  },
  {
    path: '/about',
    element: withSuspense(AboutPage),
  },
  {
    path: '/how-it-works',
    element: withSuspense(HowItWorksPage),
  },
  {
    path: '/faq',
    element: withSuspense(FAQPage),
  },
  {
    path: '/contact',
    element: withSuspense(ContactPage),
  },

  // Auth routes (Guest only)
  {
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },

  // OAuth2 callback (public)
  {
    path: 'oauth2/redirect',
    element: <OAuth2RedirectPage />,
  },

  // Email verification (public - can be accessed with or without login)
  {
    path: 'verify-email',
    element: (
      <AuthLayout>
        <VerifyEmailPage />
      </AuthLayout>
    ),
  },

  // Payment result callback (protected)
  {
    element: <AuthGuard />,
    children: [
      {
        path: 'wallet/deposit/result',
        element: <PaymentResultPage />,
      },
    ],
  },

  // Protected routes
  {
    element: <AuthGuard />,
    children: [
      // User routes (BORROWER and LENDER combined)
      {
        element: <RoleGuard allowedRoles={['BORROWER', 'LENDER']} redirectTo="/login" />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardLayout />,
            children: [
              { index: true, element: <BorrowerDashboard /> },
              // Borrower features
              { path: 'loans', element: withSuspense(MyLoansPage) },
              { path: 'loans/new', element: <CreateLoanPage /> },
              { path: 'loans/:id', element: withSuspense(BorrowerLoanDetailPage) },
              { path: 'repayments', element: withSuspense(lazy(() => import('@/pages/shared/RepaymentsPage'))) },
              // Lender features
              { path: 'marketplace', element: <MarketplacePage /> },
              { path: 'marketplace/:id', element: <LenderLoanDetailPage /> },
              { path: 'portfolio', element: withSuspense(PortfolioPage) },
              // Shared features
              { path: 'wallet', element: <WalletPage /> },
              { path: 'kyc', element: withSuspense(BorrowerKYCPage) },
              { path: 'credit-score', element: withSuspense(lazy(() => import('@/pages/borrower/CreditScorePage'))) },
              { path: 'profile', element: withSuspense(ProfilePage) },
              { path: 'notifications', element: withSuspense(NotificationsPage) },
              { path: 'support', element: withSuspense(lazy(() => import('@/pages/shared/SupportPage'))) },
              { path: 'support/new', element: withSuspense(lazy(() => import('@/pages/shared/CreateTicketPage'))) },
              { path: 'support/:id', element: withSuspense(lazy(() => import('@/pages/shared/TicketDetailPage'))) },
              { path: 'settings', element: withSuspense(lazy(() => import('@/pages/shared/SettingsPage'))) },
            ],
          },
          // Keep old routes for backward compatibility (redirect to dashboard)
          {
            path: 'borrower',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'lender',
            element: <Navigate to="/dashboard" replace />,
          },
        ],
      },

      // Admin routes
      {
        element: <RoleGuard allowedRoles={['ADMIN']} redirectTo="/login" />,
        children: [
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: 'users', element: <UsersPage /> },
              { path: 'users/:id', element: withSuspense(lazy(() => import('@/pages/admin/UserDetailPage'))) },
                { path: 'kyc', element: withSuspense(KYCManagementPage) },
                { path: 'kyc/:id', element: withSuspense(KYCDetailPage) },
                { path: 'loans', element: withSuspense(LoansManagementPage) },
                { path: 'loans/:id', element: withSuspense(lazy(() => import('@/pages/admin/AdminLoanDetailPage'))) },
              { path: 'withdrawals', element: withSuspense(WithdrawalsPage) },
              { path: 'audit-logs', element: withSuspense(AuditLogsPage) },
              { path: 'settings', element: withSuspense(SystemSettingsPage) },
              { path: 'tickets', element: withSuspense(lazy(() => import('@/pages/admin/AdminTicketsPage'))) },
              { path: 'profile', element: withSuspense(ProfilePage) },
              { path: 'notifications', element: withSuspense(NotificationsPage) },
            ],
          },
        ],
      },
    ],
  },

  // Error pages
  {
    path: '/forbidden',
    element: withSuspense(ForbiddenPage),
  },
  {
    path: '*',
    element: withSuspense(NotFoundPage),
  },
]);

export default router;
