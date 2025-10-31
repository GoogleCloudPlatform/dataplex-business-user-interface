import { useState, useEffect } from 'react';
import { isFavorite, setFavorite, toggleFavorite } from '../utils/favoriteUtils';

export const useFavorite = (entryName: string) => {
  const [favoriteStatus, setFavoriteStatus] = useState<boolean>(() => isFavorite(entryName));

  useEffect(() => {
    // Set initial state from localStorage
    setFavoriteStatus(isFavorite(entryName));

    // Listen for changes from other components
    const handleFavoritesChanged = (event: CustomEvent) => {
      const { entryName: changedEntryName, isFavorite: newStatus } = event.detail;
      if (changedEntryName === entryName) {
        setFavoriteStatus(newStatus);
      }
    };

    window.addEventListener('favoritesChanged', handleFavoritesChanged as EventListener);

    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChanged as EventListener);
    };
  }, [entryName]);

  const toggleFavoriteStatus = () => {
    const newStatus = toggleFavorite(entryName);
    setFavoriteStatus(newStatus);
    return newStatus;
  };

  const setFavoriteStatusDirect = (status: boolean) => {
    setFavorite(entryName, status);
    setFavoriteStatus(status);
  };

  return {
    isFavorite: favoriteStatus,
    toggleFavorite: toggleFavoriteStatus,
    setFavorite: setFavoriteStatusDirect
  };
};
