import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SidebarMenuItem from './SidebarMenuItem';
import { useAccessRequest } from '../../contexts/AccessRequestContext';
import './GlobalSidebar.css';
import { fetchDataProductsList } from '../../features/dataProducts/dataProductsSlice';
import { fetchGlossaries } from '../../features/glossaries/glossariesSlice';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../../app/store';
import { useAuth } from '../../auth/AuthProvider';
import { changeMode } from '../../features/user/userSlice';
import { DarkMode, LightMode } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { SIDEBAR_ICONS } from '../../constants/icons';

const GlobalSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAccessPanelOpen } = useAccessRequest();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const mode = useSelector((state: RootState) => state.user.mode);
  const isDarkModeEnabled = import.meta.env.VITE_FEATURE_DARK_MODE === 'true';

  // Determine active states based on current route
  const isHomeActive = location.pathname === '/home';
  const isGlossariesActive = location.pathname === '/glossaries';
  const isAnnotationsActive = location.pathname === '/browse-by-annotation';
  const isDataProductsActive = location.pathname.startsWith('/data-products');

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleGlossariesClick = () => {
    dispatch(fetchGlossaries({ id_token: user?.token }));
    navigate('/glossaries');
  };

  const handleAnnotationsClick = () => {
    navigate('/browse-by-annotation');
  };

  const handleDataProducts = () => {
    dispatch(fetchDataProductsList({ id_token: user?.token }));
    navigate('/data-products');
  };

  return (
    <nav
      className="global-sidebar"
      style={{
        zIndex: isAccessPanelOpen ? 999 : 1200,
      }}
    >
      {/* Menu Items */}
      <div className="sidebar-menu-items">
        <SidebarMenuItem
          icon={SIDEBAR_ICONS.HOME}
          label="Home"
          isActive={isHomeActive}
          onClick={handleHomeClick}
        />

        <SidebarMenuItem
          icon={SIDEBAR_ICONS.GLOSSARIES}
          label="Glossaries"
          isActive={isGlossariesActive}
          onClick={handleGlossariesClick}
        />

        <SidebarMenuItem
          icon={SIDEBAR_ICONS.ASPECTS}
          label="Aspects"
          isActive={isAnnotationsActive}
          onClick={handleAnnotationsClick}
        />

        <SidebarMenuItem
          icon={SIDEBAR_ICONS.DATA_PRODUCTS}
          label={<>Data<br />Products</>}
          isActive={isDataProductsActive}
          disabled={false}
          multiLine={true}
          onClick={() => {handleDataProducts();}}
        />
      </div>

      {/* Dark Mode Toggle */}
      {isDarkModeEnabled && (
        <div className="sidebar-bottom-section">
          <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'} placement="right">
            <IconButton
              onClick={() => dispatch(changeMode())}
              aria-label="Toggle dark mode"
              sx={{
                color: mode === 'dark' ? '#c4c7c5' : '#444746',
                width: 56,
                height: 36,
                borderRadius: '1000px',
                '&:hover': {
                  backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              {mode === 'light' ? (
                <DarkMode sx={{ fontSize: 24 }} />
              ) : (
                <LightMode sx={{ fontSize: 24 }} />
              )}
            </IconButton>
          </Tooltip>
        </div>
      )}
    </nav>
  );
};

export default GlobalSidebar;
