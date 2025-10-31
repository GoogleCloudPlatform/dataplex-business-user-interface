// Utility for managing favorite state with localStorage
export interface FavoriteEntry {
  name: string;
  isFavorite: boolean;
}

const FAVORITES_STORAGE_KEY = 'dataplex_favorites';

// Get all favorites from localStorage
export const getFavorites = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading favorites from localStorage:', error);
    return {};
  }
};

// Set a favorite entry
export const setFavorite = (entryName: string, isFavorite: boolean): void => {
  try {
    const favorites = getFavorites();
    favorites[entryName] = isFavorite;
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('favoritesChanged', { 
      detail: { entryName, isFavorite } 
    }));
  } catch (error) {
    console.error('Error saving favorite to localStorage:', error);
  }
};

// Get favorite status for a specific entry
export const isFavorite = (entryName: string): boolean => {
  const favorites = getFavorites();
  return favorites[entryName] || false;
};

// Toggle favorite status for an entry
export const toggleFavorite = (entryName: string): boolean => {
  const currentStatus = isFavorite(entryName);
  const newStatus = !currentStatus;
  setFavorite(entryName, newStatus);
  return newStatus;
};

// Remove a favorite entry
export const removeFavorite = (entryName: string): void => {
  try {
    const favorites = getFavorites();
    delete favorites[entryName];
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('favoritesChanged', { 
      detail: { entryName, isFavorite: false } 
    }));
  } catch (error) {
    console.error('Error removing favorite from localStorage:', error);
  }
};

// Clear all favorites
export const clearAllFavorites = (): void => {
  try {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('favoritesChanged', { 
      detail: { entryName: null, isFavorite: false } 
    }));
  } catch (error) {
    console.error('Error clearing favorites from localStorage:', error);
  }
};
