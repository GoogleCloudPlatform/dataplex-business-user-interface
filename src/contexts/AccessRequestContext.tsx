import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

interface AccessRequestContextType {
  isAccessPanelOpen: boolean;
  setAccessPanelOpen: (isOpen: boolean) => void;
}

const AccessRequestContext = createContext<AccessRequestContextType | undefined>(undefined);

export const useAccessRequest = (): AccessRequestContextType => {
  const context = useContext(AccessRequestContext);
  if (!context) {
    throw new Error('useAccessRequest must be used within an AccessRequestProvider');
  }
  return context;
};

interface AccessRequestProviderProps {
  children: ReactNode;
}

export const AccessRequestProvider: React.FC<AccessRequestProviderProps> = ({ children }) => {
  const [isAccessPanelOpen, setIsAccessPanelOpen] = useState(false);

  const setAccessPanelOpen = useCallback((isOpen: boolean) => {
    setIsAccessPanelOpen(isOpen);
  }, []);

  const value: AccessRequestContextType = useMemo(() => ({
    isAccessPanelOpen,
    setAccessPanelOpen
  }), [isAccessPanelOpen, setAccessPanelOpen]);

  return (
    <AccessRequestContext.Provider value={value}>
      {children}
    </AccessRequestContext.Provider>
  );
};
