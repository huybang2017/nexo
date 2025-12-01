import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AuthLayoutProps {
  children?: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl" />
        </div>

        {/* Logo */}
        <Link to="/" className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-xl">N</span>
            </div>
            <span className="text-white font-semibold text-2xl tracking-tight">NEXO</span>
          </motion.div>
        </Link>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            P2P Lending
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Made Simple
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Connect borrowers and lenders directly. Enjoy competitive rates,
            transparent terms, and a seamless experience.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 space-y-4"
        >
          {[
            { icon: '🔒', text: 'Secure & Verified' },
            { icon: '⚡', text: 'Fast Processing' },
            { icon: '💰', text: 'Competitive Rates' },
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-3 text-slate-300">
              <span className="text-2xl">{feature.icon}</span>
              <span>{feature.text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
                <span className="text-slate-900 font-bold text-lg">N</span>
              </div>
              <span className="text-white font-semibold text-xl tracking-tight">NEXO</span>
            </Link>
          </div>

          {children || <Outlet />}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;

