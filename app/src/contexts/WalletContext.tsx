import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';
import type { Wallet } from '@/types';

interface WalletContextType {
  wallet: Wallet | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { data: wallet, isLoading, error, refetch } = useWallet();

  return (
    <WalletContext.Provider
      value={{
        wallet: wallet ?? null,
        isLoading,
        error: error as Error | null,
        refetch,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};

export default WalletContext;

