import React, { useEffect, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Autocomplete, TextField } from '@mui/material';
import './SearchBar.css'
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { useAuth } from '../../auth/AuthProvider';
import { useLocation } from 'react-router-dom';

/**
 * @file SearchBar.tsx
 * @description
 * This component renders a sophisticated search bar, which is a composite of an
 * `Autocomplete` text input and a `Select` dropdown for search types
 * (e.g., "All Assets", "BigQuery").
 *
 * It is deeply integrated with the Redux `search` slice, both reading and
 * writing the global `searchTerm` and `searchType`.
 *
 * Key functionalities include:
 * 1.  **Suggestions**: The `Autocomplete` input provides two modes:
 * - When focused and empty, it displays recent searches.
 * - When the user types (>= 3 chars), it displays suggestions from `dataSearch`.
 * 2.  **Recent Searches**: It persists recent searches to `localStorage`, scoped
 * by the logged-in user's email. Users can delete individual recent searches.
 * 3.  **Submission**: When a search is submitted (via Enter or selection), it
 * calls the `handleSearchSubmit` prop and adds the term to recent searches.
 * 4.  **Variants**: It supports two visual `variant` styles: 'default' (for
 * the home page) and 'navbar' (a more compact version for the main header).
 * 5.  **Route Awareness**: It uses `useLocation` to automatically clear the
 * `searchTerm` in Redux when the user navigates back to the '/home' page.
 *
 * @param {SearchProps} props - The props for the component.
 * @param {function} props.handleSearchSubmit - The callback function to
 * execute when a search is submitted. It receives the search term as an
L * argument.
 * @param {any[]} props.dataSearch - An array of data (e.g., `[{ name: 'BigQuery' }]`)
 * used to populate the search suggestions when the user types.
 * @param {'default' | 'navbar'} [props.variant='default'] - (Optional) The
 * visual variant, which controls layout and styling. Defaults to 'default'.
 *
 * @returns {React.ReactElement} A React element rendering the complete
 * search bar UI with its suggestion and type-selection dropdowns.
 */

interface SearchProps {
  handleSearchSubmit: any | (() => void); // Function to handle search, can be any function type
  dataSearch: any[]; // Optional data prop for search suggestions
  variant?: 'default' | 'navbar'; // Variant prop to handle different layouts
}

const SearchBar: React.FC<SearchProps> = ({handleSearchSubmit, dataSearch, variant = 'default' }) => {
  const dispatch = useDispatch<AppDispatch>();
  const searchTerm = useSelector((state:any) => state.search.searchTerm);
  const semanticSearch = useSelector((state:any) => state.search.semanticSearch);
  const { user } = useAuth();
  const location = useLocation();
  const [searchData, setSearchData] = useState([
    { name: 'BigQuery' }, { name: 'Data Warehouse' }, { name: 'Data Lake' }, { name: 'Data Pipeline' }
  ]);
  const [recentSearches, setRecentSearches] = useState<Array<{ id: number, term: string, timestamp: number }>>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [blurTimeoutId, setBlurTimeoutId] = useState<(ReturnType<typeof setTimeout>) | null>(null);
  const [hoveredSearchId, setHoveredSearchId] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  // Local storage key for recent searches
  const getStorageKey = (userId: string) => `recentSearches_${userId}`;
  
  const handleSemanticSearchToggle = () => {
    dispatch({ type: 'search/setSemanticSearch', payload: { semanticSearch: !semanticSearch } });
  };

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    if (user?.email) {
      const storageKey = getStorageKey(user.email);
      const storedSearches = localStorage.getItem(storageKey);
      if (storedSearches) {
        try {
          const parsedSearches = JSON.parse(storedSearches);
          setRecentSearches(parsedSearches);
        } catch (error) {
          console.error('Error parsing stored searches:', error);
          setRecentSearches([]);
        }
      }
    }
  }, [user?.email]);

  // Reset search term to default state when on /home route
  useEffect(() => {
    if (location.pathname === '/home') {
      dispatch({ type: 'search/setSearchTerm', payload: { searchTerm: '' } });
    }
  }, [location.pathname, dispatch]);

  // Save recent searches to localStorage whenever they change
  useEffect(() => {
    if (user?.email && recentSearches.length > 0) {
      try {
        const storageKey = getStorageKey(user.email);
        const dataToStore = JSON.stringify(recentSearches);
        
        // Security: Limit storage size to prevent abuse
        if (dataToStore.length > 10000) { // ~10KB limit
          console.warn('Recent searches data too large, skipping save');
          return;
        }
        
        localStorage.setItem(storageKey, dataToStore);
      } catch (error) {
        console.error('Error saving recent searches to localStorage:', error);
        // Optionally clear corrupted data
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          try {
            const storageKey = getStorageKey(user.email);
            localStorage.removeItem(storageKey);
          } catch (cleanupError) {
            console.error('Error cleaning up localStorage:', cleanupError);
          }
        }
      }
    }
  }, [recentSearches, user?.email]);

  useEffect(() => {
    setSearchData(dataSearch);
    // This effect updates the searchData state whenever the data prop changes.
  }, [dataSearch]);


  // Add search term to recent searches
  const addToRecentSearches = (searchTerm: string) => {
    if (!searchTerm || !searchTerm.trim() || !user?.email) return;
    
    // Sanitize and validate input
    const trimmedTerm = searchTerm.toString().trim();
    
    // Security: Limit length to prevent abuse
    if (trimmedTerm.length > 100) return;
    
    // Security: Basic sanitization to prevent XSS
    const sanitizedTerm = trimmedTerm.replace(/[<>]/g, '');
    if (sanitizedTerm !== trimmedTerm) return; // Reject if contains HTML tags
    
    const now = Date.now();
    
    setRecentSearches(prev => {
      // Remove existing entry with same term
      const filtered = prev.filter(search => search.term !== sanitizedTerm);
      
      // Add new entry at the beginning
      const newSearch = { id: now, term: sanitizedTerm, timestamp: now };
      const updated = [newSearch, ...filtered];
      
      // Keep only the last 10 searches
      return updated.slice(0, 10);
    });
  };

  // const handleSearchChange = (event : any) => {
  //   // Dispatch the setSearchTerm action with the new value
  //   const trimmedValue = event.target.value.trim();
  //   dispatch({ type: 'search/setSearchTerm', payload: {searchTerm : trimmedValue }});
  //   console.log("Search Term:", trimmedValue);
    
    
  //   if (event.key === 'Enter') {
  //       // Check if search term meets minimum requirements
  //       if (trimmedValue && trimmedValue.length >= 3) {
  //           // Call the search submit function with the current search term
  //           handleSearchSubmit(trimmedValue);
  //           // Add to recent searches
  //           addToRecentSearches(trimmedValue);
  //       } else if (trimmedValue && trimmedValue.length > 0 && trimmedValue.length < 3) {
  //           alert('Please type at least 3 characters to search');
  //       }
  //   }   
  // };

  const handleSelectOption = (option: string) => {
    // Sanitize input to prevent XSS
    const sanitizedOption = option?.toString().trim() || '';
    if (sanitizedOption !== '') {
      dispatch({ type: 'search/setSearchTerm', payload: {searchTerm : sanitizedOption}});
      // Ignore blank searches and only search if minimum 3 characters
      if (sanitizedOption && sanitizedOption.length >= 3) {
        handleSearchSubmit(sanitizedOption);
        // Add to recent searches
        addToRecentSearches(sanitizedOption);
      }
    }
    setIsDropdownOpen(false);
  };

  const handleDeleteRecentSearch = (searchId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    
    // Validate searchId to prevent malicious deletion
    if (typeof searchId !== 'number' || searchId <= 0) {
      console.warn('Invalid search ID for deletion:', searchId);
      return;
    }
    
    setRecentSearches(prev => prev.filter(search => search.id !== searchId));
  };

  // const clearAllRecentSearches = () => {
  //   setRecentSearches([]);
  //   if (user?.email) {
  //     const storageKey = getStorageKey(user.email);
  //     localStorage.removeItem(storageKey);
  //   }
  // };

  const handleRecentSearchSelect = (searchTerm: string) => {
    // Sanitize input to prevent XSS
    const sanitizedTerm = searchTerm?.toString().trim() || '';
    if (!sanitizedTerm) return;
    
    dispatch({ type: 'search/setSearchTerm', payload: {searchTerm: sanitizedTerm}});
    // Ignore blank searches and only search if minimum 3 characters
    if (sanitizedTerm.length >= 3) {
      handleSearchSubmit(sanitizedTerm);
      // Move selected search to top of recent searches
      addToRecentSearches(sanitizedTerm);
    }
    setIsDropdownOpen(false);
  };

  const handleInputChange = (_event: React.SyntheticEvent, newInputValue: string) => {
        dispatch({ type: 'search/setSearchTerm', payload: { searchTerm: newInputValue } });
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            const trimmedValue = searchTerm?.toString().trim();
            if (trimmedValue && trimmedValue.length >= 3) {
                handleSearchSubmit(trimmedValue);
                addToRecentSearches(trimmedValue);
            } else if (trimmedValue && trimmedValue.length > 0 && trimmedValue.length < 3) {
                alert('Please type at least 3 characters to search');
            }
        }
  };
  const handleInputFocus = () => {
    // Clear any pending blur timeout
    if (blurTimeoutId) {
      clearTimeout(blurTimeoutId);
      setBlurTimeoutId(null);
    }
    // Only open if we have valid conditions
    const shouldOpen = (searchTerm && searchTerm.length >= 3) || recentSearches.length > 0;
    if (shouldOpen) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Clear any existing timeout to prevent memory leaks
    if (blurTimeoutId) {
      clearTimeout(blurTimeoutId);
    }
    
    // Delay closing to allow for clicks on dropdown items
    const timeoutId = setTimeout(() => {
      setIsDropdownOpen(false);
      setBlurTimeoutId(null);
    }, 200);
    
    setBlurTimeoutId(timeoutId);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutId) {
        clearTimeout(blurTimeoutId);
      }
    };
  }, [blurTimeoutId]);

  // Determine if any dropdown is open
  const isAnyDropdownOpen = isDropdownOpen;

  return (
        <div 
            id="search-bar" 
            className={`${variant === 'navbar' ? 'navbar-variant' : ''} ${isAnimating ? 'google-glow-animation' : ''}`}
            data-route={location.pathname === '/browse-by-annotation' ? 'browse-by-annotation' : ''}
            style={{ 
                height:  '3.09rem',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderRadius: isAnyDropdownOpen ? '24px 24px 0 0' : '24px', 
                background: isAnyDropdownOpen ? '#ffffff' : '#E9EEF6', 
                padding: '0rem 0.5rem 0rem 1.125rem',
                width: variant === 'navbar' ? 'calc(100%)' : 'calc(100% - 0.9375rem)',
                maxWidth: '820px',
                marginLeft: variant === 'navbar' ? (location.pathname === '/browse-by-annotation' ? '2rem' : '1rem') : (location.pathname === '/browse-by-annotation' ? '1rem' : '0'),
                marginRight: variant === 'navbar' ? '0.5rem' : '0',
                position: 'relative',
                zIndex: 150,
                transition: 'all 0.2s ease',
                boxShadow: isAnyDropdownOpen ? '0 1px 6px rgba(32,33,36,.28)' : 'none',
                 border: '1px solid transparent',
                 boxSizing: 'border-box'
            }}>
            <SearchIcon style={{
                color: '#5F6368', 
                marginRight: variant === 'navbar' ? '0.5rem' : '0px',
                transition: 'color 0.2s ease',
                height:"1.25rem",
                width:"1.25rem",
                marginLeft: variant === 'navbar' ? '0px' : "5px",
                flexShrink: 0
            }}/>
            <Autocomplete
                freeSolo
                disablePortal
                inputValue={searchTerm || ''}
                disableClearable
                onInputChange={handleInputChange}
                open={isDropdownOpen && ((searchTerm && searchTerm.length >= 3) || recentSearches.length > 0)}
                onOpen={() => {
                    // Clear any pending blur timeout when opening
                    if (blurTimeoutId) {
                        clearTimeout(blurTimeoutId);
                        setBlurTimeoutId(null);
                    }
                    const shouldOpen = (searchTerm && searchTerm.length >= 3) || recentSearches.length > 0;
                    if (shouldOpen) {
                        setIsDropdownOpen(true);
                    }
                }}
                onClose={() => {
                    setIsDropdownOpen(false);
                }}
                options={searchTerm ? searchData.map((option) => option.name) : recentSearches.map(search => search.term)}
                renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    
                    if (!searchTerm) {
                        // Render recent search item
                        const searchItem = recentSearches.find(search => search.term === option);
                        if (searchItem) {
                            return (
                                <li 
                                    key={key}
                                    {...otherProps} 
                                    className="recent-search-item" 
                                    onClick={() => handleRecentSearchSelect(option)}
                                    onMouseEnter={() => setHoveredSearchId(searchItem.id)}
                                    onMouseLeave={() => setHoveredSearchId(null)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 11px',
                                        gap: '11px',
                                        width: '100%',
                                        fontFamily: 'Google Sans Text, sans-serif',
                                        fontWeight: 400,
                                        fontSize: '14px',
                                        lineHeight: '1.4285714285714286em',
                                        color: '#1F1F1F',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <AccessTimeIcon style={{ 
                                            color: '#575757', 
                                            fontSize: '20px',
                                            width: '20px',
                                            height: '20px',
                                            opacity: 0.8
                                        }} />
                                        <span>{option}</span>
                                    </div>
                                    {hoveredSearchId === searchItem.id && (
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteRecentSearch(searchItem.id, e);
                                            }}
                                            style={{
                                                color: '#575757',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                fontFamily: 'Google Sans Text, sans-serif',
                                                fontWeight: 400,
                                                lineHeight: '1.4285714285714286em'
                                            }}
                                        >
                                            Delete
                                        </span>
                                    )}
                                </li>
                            );
                        }
                    }
                    // Render regular search option
                    return (
                        <li
                            key={key}
                            {...otherProps} 
                            onClick={() => handleSelectOption(option)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '11px',
                                padding: '8px 11px',
                                fontFamily: 'Google Sans Text, sans-serif',
                                fontWeight: 400,
                                fontSize: '14px',
                                lineHeight: '1.4285714285714286em',
                                color: '#1F1F1F',
                                cursor: 'pointer'
                            }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                              <AccessTimeIcon style={{ 
                                  color: '#575757', 
                                  fontSize: '20px',
                                  width: '20px',
                                  height: '20px',
                                  opacity: 0.8
                              }} />
                              <span>{option}</span>
                          </div>
                        </li>
                    );
                }}

                renderInput={(params) => (
                    <div style={{ position: 'relative', width: '100%' }}>
                        {!searchTerm && (
                            <span 
                                key={semanticSearch ? 'semantic-mode' : 'keyword-mode'} 
                                className="animated-placeholder"
                                style={{ 
                                    left: variant === 'navbar' ? '7px' : '16px' 
                                }}
                            >
                                {semanticSearch ? "Ask anything" : "Search for assets"}
                            </span>
                        )}

                        <TextField
                            {...params}
                            onKeyDown={handleKeyDown}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            placeholder=""
                            slotProps={{
                                input: {
                                    ...params.InputProps,
                                    type: 'search',
                                },
                            }}
                            style={{
                                fontFamily: '"Google Sans Text", sans-serif',
                                color: '#1F1F1F',
                                width: "100%",
                                flex: 1,
                                background: isAnyDropdownOpen ? "#ffffff" : "#E9EEF6",
                                fontWeight: "500",
                                fontSize: "0.875rem",
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& input': {
                                        fontFamily: '"Google Sans Text", sans-serif',
                                        fontSize: "0.875rem",
                                        fontWeight: "500",
                                        opacity: "0.8",
                                        color: '#1F1F1F',
                                        fontStyle: "normal",
                                        padding: "0rem 0.5625rem"
                                    },
                                },
                            }}
                        />
                    </div>
                )}
                PaperComponent={(props) => (
                    <div
                        {...props}
                        className={`autocomplete-dropdown ${variant === 'navbar' ? 'navbar-dropdown' : ''}`}
                        style={{
                        ...props.style,
                        borderRadius: '0 0 24px 24px', 
                        border: 'none',
                        borderTop: '1px solid transparent', 
                        boxShadow: '0 4px 6px rgba(32,33,36,.28)', 
                        padding: '10px 0px',
                        backgroundColor: '#ffffff',
                        position: 'absolute',
                        marginLeft: '-47.2px',
                        ...((variant === 'navbar' || location.pathname === '/browse-by-annotation') ? {
                            width: 'calc(100% + 198px)',
                            
                        } : {
                            right: '-151px',
                            width: 'calc(100% + 194.4px)', 
                        }),
                        
                        top: '100%',        
                        marginTop: '7px',   
                        zIndex: 2000,
                        overflow: "hidden",
                    }}
                    />
                )}
                sx={variant === 'navbar' ? {
                    flex: '1 1 auto',
                    minWidth: 0,
                    position: 'static',
                    '& .MuiAutocomplete-listbox': {
                        padding: '0px'
                    }
                } : {
                  flex: 1,
                  minWidth: 0,
                    position: 'static',
                    '& .MuiAutocomplete-listbox': {
                        padding: '0px'
                    }
                }}
                noOptionsText={!searchTerm && recentSearches.length === 0 ? "No recent searches" : "No options"}
            />
          <div style={{ paddingRight: '8px', flexShrink: 0 }}>
                <button
                    className={!semanticSearch ? "natural-language-btn-hover-effect" : ""}
                    onClick={(e) => {
                        if (!semanticSearch) {
                            setIsAnimating(true);
                            setTimeout(() => setIsAnimating(false), 2500);
                        }
                        handleSemanticSearchToggle();
                        e.currentTarget.blur();
                    }}
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: semanticSearch ? '#d2e3fc' : '#E9EEF6',
                        color: semanticSearch ? '#174ea6' : '#5F6368',
                        border: '2px solid transparent', 
                        padding: '2px 8px 2px 4px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.1)',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontFamily: '"Google Sans", sans-serif',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box', 
                    }}
                >
                    <AutoAwesomeIcon style={{ fontSize: '16px' }} />
                    <span>Natural Language</span>
                </button>
            </div>
        </div>
  );
}

export default SearchBar;