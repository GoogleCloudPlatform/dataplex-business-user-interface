import React from 'react';
import { useEffect } from 'react';
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
import { HelpOutline, MenuBook, Home, Person, AccountCircle, Logout, Menu as MenuIcon } from '@mui/icons-material';
import SearchBar from '../SearchBar/SearchBar';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { searchResourcesByTerm } from '../../features/resources/resourcesSlice';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import SendFeedback from './SendFeedback';
import NotificationBar from '../SearchPage/NotificationBar';

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
const settings = ['Home'];

// Icon mapping for menu items
const getMenuIcon = (setting: string) => {
  switch (setting) {
    case 'Home':
      return <Home sx={{ 
        mr: "0.25rem", 
        fontSize: "1.25rem", // 20px
        color: "#5F6367"
      }} />;
    case 'Profile':
      return <Person sx={{ 
        mr: "0.25rem", 
        fontSize: "1.25rem", // 20px
        color: "#5F6367"
      }} />;
    case 'Account':
      return <AccountCircle sx={{ 
        mr: "0.25rem", 
        fontSize: "1.25rem", // 20px
        color: "#5F6367"
      }} />;
    default:
      return null;
  }
};

const getNavPath = (setting: string) => {
  switch (setting) {
    case 'Home':
      return '/home';
    case 'Profile':
      return '/profile';
    case 'Account':
      return '/account';
    default:
      return '/';
  }
};

interface NavBarProps {
  searchBar?: boolean; // Optional prop to control the visibility of the search bar
  searchNavigate?: boolean; // Optional prop to control the navigation on search
}

const Navbar: React.FC<NavBarProps> = ({ searchBar = false, searchNavigate = true }) => {
  const { user, logout, updateUser } = useAuth();
  const { name, picture } = user ?? {name: '', picture:''};
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const isGlossaryPage = ['/glossaries'].includes(location.pathname);
  const isBrowsePage = ['/browse-by-annotation'].includes(location.pathname);
  const isSearchOrDetailPage = ['/search', '/view-details'].includes(location.pathname);
  const isGuidePage = ['/guide'].includes(location.pathname);
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  //const [anchorElHelp, setAnchorElHelp] = React.useState<null | HTMLElement>(null);
  const [openFeedback, setOpenFeedback] = React.useState<boolean>(false);
  const searchTerm = useSelector((state:any) => state.search.searchTerm);
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
        hasRole: user.hasRole,
        roles: user.roles,
        permissions: user.permissions,
        appConfig: {}
      };
      updateUser(user.token, userData);
    }
    navigate('/home');
  };
  
  useEffect(() => {
    dispatch(searchResourcesByTerm({term : searchTerm, id_token: id_token, semanticSearch: semanticSearch}));   
  }, []);

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
      background: "#F8FAFD",
      boxShadow: "none",
      height: "4rem", // 64px
      flex: "0 0 auto",
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
          // justifyContent: "space-between",
          flex: "1 1 auto", 
          minHeight: "4rem", 
          height: "100%",
          padding: "0.5rem 0rem", // 8px 20px
          gap: 0,
        }}>
          {/* Left Section - Logo (only on home page) */}
          {location.pathname === '/home' && (
            <Box onClick={handleLogoClick} sx={{
              display: { xs: 'none', md: 'flex' },
              flex: "0 0 auto",
              width: "157px",
              height: "46px",
              marginLeft: "-0.5rem",
              cursor: "pointer",
            }}>
              <img
                src="/assets/svg/dataplex-universal-catalog-logo.svg"
                alt="Dataplex Universal Catalog"
                style={{ width: '157px', height: '46px' }}
              />
            </Box>
          )}
          
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
                margin: "0",
                ...(isGlossaryPage && {
                  marginLeft: "calc(250px)", // Logo width + padding
                }),
                ...(isBrowsePage && {
                  marginLeft: "202px",
                }),
                ...(isSearchOrDetailPage && {
                  marginLeft: "202px",
                }),
                ...(isGuidePage && {
                  marginLeft: "calc(250px)",
                }),
              }}>
                <div style={{ width: 'calc(100% - 10.2%)', marginLeft: '0' }}>
                  <SearchBar
                    handleSearchSubmit={handleNavSearch}
                    dataSearch={[
                      { name: 'BigQuery' },
                      { name: 'Data Warehouse' },
                      { name: 'Data Lake' },
                      { name: 'Data Pipeline' },
                      { name: 'GCS' }
                    ]}
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
                color: "#5F6367",
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
                  <MenuBook sx={{ fontSize: "1.25rem", color: "#5F6367" }} />
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
                  <HelpOutline sx={{ fontSize: "1.25rem", color: "#5F6367" }} />
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
              <img src="/assets/svg/catalog-studio-logo-figma-585de1.svg" alt="CS Studio Logo" className="navbar-logo-img" />
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: "pointer",}}>
                <label style={{fontSize:"19px", fontWeight:700, color:"#0B57D0", lineHeight: 1, cursor: "pointer",}}>Dataplex</label>
                <label style={{fontSize:"12px", fontWeight:700, color:"#0B57D0", lineHeight: 1, cursor: "pointer",}}>Universal Catalog</label>
              </div>
            </div>
          </Box>
          {/* Right Section - Icons and Avatar */}
          <Box sx={{ 
            flex: "1 1 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "1.25rem", // 20px
            padding: "0.375rem 0" // 6px vertical padding
          }}>
            {/* Icon Button Area */}
            <Box sx={{
              display: "flex",
              alignItems: "center", 
              gap: "1.25rem", // 20px
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
                    width: "1.5rem", // 24px
                    height: "1.5rem" // 24px
                  }}
                  onClick={()=>{navigate('/guide')}}
                >
                  <MenuBook sx={{ 
                    fontSize: "1.5rem", 
                    color: "#5F6368" 
                  }} />
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
                    width: "1.5rem", // 24px
                    height: "1.5rem" // 24px
                  }}
                  onClick={handleOpenFeedback}
                >
                  <HelpOutline sx={{ 
                    fontSize: "1.5rem", 
                    color: "#5F6368" 
                  }} />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Avatar */}
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
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
            <Menu
              sx={{ mt: "2.8125rem" }} // 45px
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: "0.25rem" 
                  }}
                  onClick={()=>{navigate(getNavPath(setting))}}
                  >
                    {getMenuIcon(setting)}
                    <Typography sx={{ 
                      textAlign: 'center',
                      fontSize: "0.875rem", // 14px
                      fontWeight: 500,
                      lineHeight: 1.43
                    }}>
                      {setting}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
              <MenuItem key="SignOut" onClick={() => {
                  sessionStorage.removeItem('welcomeShown');
                  logout();
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: "0.25rem" 
                }}>
                  <Logout sx={{ 
                    fontSize: "1.25rem", // 20px
                    color: "#5F6367"
                  }} />
                  <Typography sx={{ 
                    textAlign: 'center',
                    fontSize: "0.875rem", // 14px
                    fontWeight: 500,
                    lineHeight: 1.43
                  }}>
                    SignOut
                  </Typography>
                </Box>
              </MenuItem>
            </Menu>
            {/* Help Menu */}
            {/* <Menu
              sx={{ mt: "2.8125rem" }} // 45px
              id="menu-help"
              anchorEl={anchorElHelp}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElHelp)}
              onClose={handleCloseHelpMenu} // Just close this menu
            > */}
              {/* Help Item */}
              {/* <MenuItem onClick={() => handleHelpMenuAction('/help')}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: "0.25rem" 
                }}>
                  <HelpOutline sx={{ 
                    fontSize: "1.25rem", // 20px
                    color: "#5F6367"
                  }} />
                  <Typography sx={{ 
                    textAlign: 'center',
                    fontSize: "0.875rem", // 14px
                    fontWeight: 500,
                    lineHeight: 1.43
                  }}>
                    Help
                  </Typography>
                </Box>
              </MenuItem> */}
              {/* Give Feedback Item (Placeholder) */}
              {/* <MenuItem onClick={() => handleHelpMenuAction(null)}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: "0.25rem" 
                }}>
                  <Feedback sx={{ 
                    fontSize: "1.25rem", // 20px
                    color: "#5F6367"
                  }} />
                  <Typography sx={{ 
                    textAlign: 'center',
                    fontSize: "0.875rem", // 14px
                    fontWeight: 500,
                    lineHeight: 1.43
                  }}>
                    Give Feedback
                  </Typography>
                </Box>
              </MenuItem> */}
            {/* </Menu> */}
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
