import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface NoAccessOptions {
  message?: string;
}

interface NoAccessContextType {
  isNoAccessOpen: boolean;
  noAccessMessage: string | null;
  triggerNoAccess: (options?: NoAccessOptions) => void;
  dismissNoAccess: () => void;
}

const NoAccessContext = createContext<NoAccessContextType | undefined>(undefined);

export const NoAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNoAccessOpen, setIsNoAccessOpen] = useState(false);
  const [noAccessMessage, setNoAccessMessage] = useState<string | null>(null);

  const triggerNoAccess = useCallback((options?: NoAccessOptions) => {
    setNoAccessMessage(options?.message ?? null);
    setIsNoAccessOpen(true);
  }, []);

  const dismissNoAccess = useCallback(() => {
    setIsNoAccessOpen(false);
    setNoAccessMessage(null);
  }, []);

  // Expose on window for console-level testing
  useEffect(() => {
    (window as any).__triggerNoAccess = (msg?: string) => triggerNoAccess({ message: msg });
    (window as any).__dismissNoAccess = () => dismissNoAccess();
    return () => {
      delete (window as any).__triggerNoAccess;
      delete (window as any).__dismissNoAccess;
    };
  }, [triggerNoAccess, dismissNoAccess]);

  return (
    <NoAccessContext.Provider value={{ isNoAccessOpen, noAccessMessage, triggerNoAccess, dismissNoAccess }}>
      {children}
    </NoAccessContext.Provider>
  );
};

export const useNoAccess = (): NoAccessContextType => {
  const context = useContext(NoAccessContext);
  if (!context) {
    throw new Error('useNoAccess must be used within a NoAccessProvider');
  }
  return context;
};
