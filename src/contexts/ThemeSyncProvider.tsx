import { useEffect } from 'react';
import { useAppSelector } from '../app/store';

const ThemeSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mode = useAppSelector((state) => state.user.mode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return <>{children}</>;
};

export default ThemeSyncProvider;
