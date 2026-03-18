import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import './Navbar.css'
import { Menu as MenuIcon } from '@mui/icons-material';
import SearchBar from '../SearchBar/SearchBar';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { searchResourcesByTerm } from '../../features/resources/resourcesSlice';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import SendFeedback from './SendFeedback';
import NotificationBar from '../SearchPage/NotificationBar';
import UserAccountDropdown from './UserAccountDropdown';

/**
 * @file Navbar.tsx
 * @description
 * This component renders the primary application navigation bar (`AppBar`).
 *
 * It features:
 * 1.  **Logo**: The application logo, which links back to the '/home' page.
 * 2.  **Search Bar**: An optional, centrally-located `SearchBar`. Its
 * visibility is controlled by the `searchBar` prop and its presence is
 * also dependent on the current route (e.g., hidden on '/admin-panel').
 * 3.  **Navigation**: Desktop icons (and a mobile menu) for "Guide" and "Help"
 * that navigate to their respective pages.
 * 4.  **User Menu**: A user avatar that, when clicked, opens a dropdown menu
 * with navigation links (e.g., "Home") and a "SignOut" option (which
 * calls the `logout` function from the `useAuth` context).
 *
 * When a search is submitted via the `SearchBar` (triggering `handleNavSearch`),
 * the component dispatches a Redux action (`searchResourcesByTerm`) to fetch
 * results. It will also navigate to the '/search' page if the
 * `searchNavigate` prop is true.
 *
 * @param {NavBarProps} props - The props for the component.
 * @param {boolean} [props.searchBar=false] - (Optional) If true, the
 * central `SearchBar` is displayed. Defaults to `false`.
 * @param {boolean} [props.searchNavigate=true] - (Optional) If true,
 * submitting a search will navigate to the '/search' page.
 * Defaults to `true`.
 *
 * @returns {React.ReactElement} A React element rendering the `AppBar` component.
 */

//const pages = ['Guide', 'Notification', 'Help'];

interface NavBarProps {
  searchBar?: boolean; // Optional prop to control the visibility of the search bar
  searchNavigate?: boolean; // Optional prop to control the navigation on search
}

const Navbar: React.FC<NavBarProps> = ({ searchBar = false, searchNavigate = true }) => {
  const { user, updateUser } = useAuth();
  const { name, picture, email } = user ?? {name: '', picture:'', email: ''};
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const mode = useSelector((state: any) => state.user.mode);
  const isSearchFiltersOpen = useSelector((state: any) => state.search.isSearchFiltersOpen);
  const isOnSearchPage = location.pathname === '/search';
  const shouldShiftNavbar = isOnSearchPage && isSearchFiltersOpen;
  const iconColor = mode === 'dark' ? '#9aa0a6' : '#5F6367';
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  //const [anchorElHelp, setAnchorElHelp] = React.useState<null | HTMLElement>(null);
  const [openFeedback, setOpenFeedback] = React.useState<boolean>(false);
  const searchFilters = useSelector((state:any) => state.search.searchFilters);
  const semanticSearch = useSelector((state:any) => state.search.semanticSearch);
  const id_token = user?.token || '';
  const [isNotificationVisible, setIsNotificationVisible] = React.useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = React.useState<string>('');
  const handleLogoClick = () => {
    if (user) {
      const userData = {
        name: user.name,
        email: user.email,
        picture: user.picture,
        token: user.token,
        tokenExpiry: user.tokenExpiry,
        tokenIssuedAt: user.tokenIssuedAt,
        hasRole: user.hasRole,
        roles: user.roles,
        permissions: user.permissions,
        iamDisplayRole: user.iamDisplayRole,
        appConfig: {}
      };
      updateUser(user.token, userData);
    }
    navigate('/home');
  };
  
  const dataSearch = useMemo(() => [
    { name: 'BigQuery' },
    { name: 'Data Warehouse' },
    { name: 'Data Lake' },
    { name: 'Data Pipeline' },
    { name: 'GCS' }
  ], []);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // const handleOpenHelpMenu = (event: React.MouseEvent<HTMLElement>) => {
  //   setAnchorElHelp(event.currentTarget);
  // };
  const handleOpenFeedback = () => {
    setOpenFeedback(true);
  };

  // const handleCloseHelpMenu = () => {
  //   setAnchorElHelp(null);
  // };

  // This handler closes the new help menu, the main mobile menu (if open),
  // and navigates if a path is provided.
  // const handleHelpMenuAction = (path: string | null) => {
  //   if (path) {
  //     navigate(path);
  //   }
  //   handleCloseHelpMenu();
  //   if (anchorElNav) { // Check if the mobile nav menu is open
  //     handleCloseNavMenu();
  //   }
  // };

  const handleCloseFeedback = () => {
    setOpenFeedback(false);
  };

  const handleCloseNotification = () => {
    setIsNotificationVisible(false);
  };

  const handleUndoNotification = () => {
    setIsNotificationVisible(false);
  };

  const handleSendFeedbackSuccess = () => {
    setOpenFeedback(false);
    setNotificationMessage(`Feedback sent`);
    setIsNotificationVisible(true);
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setIsNotificationVisible(false);
    }, 5000);
  };


  const handleNavSearch = (text: string) => {
    dispatch({ type: 'resources/setItemsStoreData', payload: [] });
    dispatch(searchResourcesByTerm({term : text, id_token: id_token, filters: searchFilters, semanticSearch: semanticSearch}));
    searchNavigate && navigate('/search');
  }

  return (<>
    <AppBar position="static" sx={{
      background: mode === 'dark' ? '#131314' : '#FFFFFF',
      boxShadow: "none",
      height: "4.5rem", // 72px
      flex: "0 0 auto",
      marginLeft: shouldShiftNavbar ? '252px' : '0px',
      width: shouldShiftNavbar ? 'calc(100% - 252px)' : '100%',
      transition: 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out',
    }}>
      <Container maxWidth="xl" sx={{
        padding: 0, 
        margin: 0, 
        flex: "1 1 auto", 
        width: "100%", 
        maxWidth: "none !important",
        height: "100%"
      }}>
        <Toolbar disableGutters sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flex: "1 1 auto",
          minHeight: "4.5rem",
          height: "100%",
          padding: "0.75rem 0rem",
          gap: "2rem", // 32px
        }}>
          {/* Left Section - Logo */}
          <Box onClick={handleLogoClick} sx={{
            display: { xs: 'none', md: 'flex' },
            flex: "0 0 auto",
            width: "130px",
            height: "40px",
            cursor: "pointer",
            marginLeft: '-10px',
          }}>
            <img
              src="/assets/svg/dataplex-universal-catalog-logo.svg"
              alt="Dataplex Universal Catalog"
              style={{ width: '130px', height: '40px' }}
            />
          </Box>
          
          {/* Center Section - Search Bar */}
          {
            searchBar && location.pathname !== '/admin-panel' ?
            (
              <Box sx={{
                display: { lg: 'flex' },
                flex: "1 1 41rem",
                alignItems: "center",
                justifyContent: "flex-start",
                height: "3rem",
              }}>
                <div style={{ width: 'calc(100% - 10.2%)', marginLeft: '0' }}>
                  <SearchBar
                    handleSearchSubmit={handleNavSearch}
                    dataSearch={dataSearch}
                    variant="navbar"
                  />
                </div>
              </Box>
            ) : (
              <Box sx={{ flex: "1 1 auto" }} />
            )
          }
 
         {/* Mobile Navigation */}
          <Box sx={{ 
            flex: "0 0 auto", 
            display: { xs: 'flex', md: 'none' },
            alignItems: "center",
            gap: "1rem"
          }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              sx={{
                color: iconColor,
                p: "0.25rem"
              }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {/* <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/admin-panel'); }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: "0.5rem" }}>
                  <AdminPanelSettings sx={{ fontSize: "1.25rem", color: "#5F6367" }} />
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>Admin Panel</Typography>
                </Box>
              </MenuItem> */}
              <MenuItem onClick={()=>{handleCloseNavMenu(); navigate('/guide')}}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: "0.5rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: mode === 'dark' ? '#c4c7c5' : '#444746', fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>Guide</Typography>
                </Box>
              </MenuItem>
              {/* <MenuItem onClick={handleCloseNavMenu}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: "0.5rem" }}>
                  <NotificationsNone sx={{ fontSize: "1.25rem", color: "#5F6367" }} />
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>Notifications</Typography>
                </Box>
              </MenuItem> */}
              <MenuItem onClick={handleOpenFeedback}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: "0.5rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: mode === 'dark' ? '#c4c7c5' : '#444746' }}>help</span>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>Help</Typography>
                </Box>
              </MenuItem>
            </Menu>
          </Box>
          
          {/* Mobile Logo */}
          <Box onClick={handleLogoClick} sx={{
            display: { xs: 'flex', md: 'none' },
            flex: "1 1 auto",
            justifyContent: "center",
            alignItems: "center",
            height: "2rem"
          }}>
            <div className="logo-container" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: "pointer",}}>
                <label style={{fontSize:"19px", fontWeight:700, color: mode === 'dark' ? '#c4c7c5' : "#0B57D0", lineHeight: 1, cursor: "pointer",}}>Dataplex</label>
                <label style={{fontSize:"12px", fontWeight:700, color: mode === 'dark' ? '#c4c7c5' : "#0B57D0", lineHeight: 1, cursor: "pointer",}}>Universal Catalog</label>
              </div>
            </div>
          </Box>
          {/* Right Section - Icons and Avatar */}
          <Box sx={{ 
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "8px",
            padding: "0.375rem 0" // 6px vertical padding
          }}>
            {/* Icon Button Area */}
            <Box sx={{
              display: "flex",
              alignItems: "center", 
              gap: "0px",
              height: "2.125rem" // 34px
            }}>
              {/* <Tooltip title="Admin Panel">
                <IconButton 
                  onClick={() => navigate('/admin-panel')}
                  sx={{ 
                    p: 0, 
                    width: "1.5rem", // 24px
                    height: "1.5rem" // 24px
                  }}
                >
                  <AdminPanelSettings sx={{ 
                    fontSize: "1.5rem", 
                    color: "#5F6367" 
                  }} />
                </IconButton>
              </Tooltip> */}
              <Tooltip title="Guide">
                <IconButton sx={{
                    p: 0,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s',
                    '&:hover': { backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' },
                  }}
                  onClick={()=>{navigate('/guide')}}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: mode === 'dark' ? '#c4c7c5' : '#444746', fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                </IconButton>
              </Tooltip>
              {/* <Tooltip title="Notification">
                <IconButton sx={{
                  p: 0,
                  width: "1.5rem", // 24px
                  height: "1.5rem" // 24px
                }}>
                  <NotificationsNone sx={{
                    fontSize: "1.5rem",
                    color: "#5F6367"
                  }} />
                </IconButton>
              </Tooltip> */}
              <Tooltip title="Help">
                <IconButton sx={{
                    p: 0,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    transition: 'background-color 0.2s',
                    '&:hover': { backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' },
                  }}
                  onClick={handleOpenFeedback}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: mode === 'dark' ? '#c4c7c5' : '#444746' }}>help</span>
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Avatar */}
            <Tooltip
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: mode === 'dark' ? '#3C4043' : '#56595C',
                  },
                },
              }}
              title={
              <Box sx={{ textAlign: 'left', fontFamily: '"Roboto", sans-serif' }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 500, fontFamily: 'inherit', color: '#FFFFFF' }}>Google Account</Typography>
                <Typography sx={{ fontSize: '0.75rem', fontFamily: 'inherit', color: mode === 'dark' ? '#9AA0A6' : '#BFC4C7' }}>{name}</Typography>
                <Typography sx={{ fontSize: '0.75rem', fontFamily: 'inherit', color: mode === 'dark' ? '#9AA0A6' : '#BFC4C7' }}>{email}</Typography>
              </Box>
            }>
              <IconButton onClick={handleOpenUserMenu} sx={{
                p: '4px',
                borderRadius: '50%',
                transition: 'background-color 0.2s',
                '&:hover': { backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' },
              }} aria-label="Open settings">
                <Avatar
                  alt={name ?? ""}
                  src={picture ?? ""}
                  sx={{
                    width: "2rem", // 32px
                    height: "2rem", // 32px
                    borderRadius: "50%"
                  }}
                />
              </IconButton>
            </Tooltip>
            <UserAccountDropdown
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>

    {/* Send Feedback Panel */}
          <SendFeedback
            isOpen={openFeedback}
            onClose={handleCloseFeedback}
            onSubmitSuccess={handleSendFeedbackSuccess}
          />
    
          {/* Notification Bar */}
          <NotificationBar
            isVisible={isNotificationVisible}
            onClose={handleCloseNotification}
            onUndo={handleUndoNotification}
            message={notificationMessage}
          />
        </>
    
  );
}
export default Navbar;
