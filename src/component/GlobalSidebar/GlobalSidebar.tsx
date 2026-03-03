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

const GlobalSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAccessPanelOpen } = useAccessRequest();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const mode = useSelector((state: RootState) => state.user.mode);
  const isDarkModeEnabled = import.meta.env.VITE_FEATURE_DARK_MODE === 'true';

  // Determine active states based on current route
  const isHomeActive = ['/home', '/search', '/view-details'].includes(location.pathname);
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
        {/* Home */}
        <SidebarMenuItem
          icon={
            <div className="icon-states">
              <span className="icon-inactive">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#444746"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>
              </span>
              <span className="icon-hover">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#444746"><path d="M270.78-222.78H347V-469h266v246.22h76.22v-337.83L480-717.52 270.78-560.61v337.83Zm-98 98v-484.83L480-840.31 787.22-609.8v485.02H523.48v-254.7h-86.96v254.7H172.78ZM480-469.87Z"/></svg>
              </span>
              <span className="icon-active">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#001D35"><path d="M172.78-124.78v-484.83L480-840.31 787.22-609.8v485.02h-230.7v-287.74H403.48v287.74h-230.7Z"/></svg>
              </span>
            </div>
          }
          label="Home"
          isActive={isHomeActive}
          onClick={handleHomeClick}
        />

        {/* Glossaries */}
        <SidebarMenuItem
          icon={
            <div className="icon-states">
              <span className="icon-inactive">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#444746"><path d="M324-96q-54.69 0-93.34-38.66Q192-173.31 192-228v-504q0-54.69 38.66-93.34Q269.31-864 324-864h444v575q-25 0-42.5 17.91t-17.5 43.5q0 25.59 17.5 43.09Q743-167 768-167v71H324Zm-60-250q14-7 28.5-10.5T324-360h12v-432h-12q-25 0-42.5 17.5T264-732v386Zm144-14h288v-432H408v432Zm-144 14v-446 446Zm60 178h326q-7-14-10.5-28t-3.5-31.27q0-16.25 4-31.49Q644-274 651-288H324q-26 0-43 17.5T264-228q0 26 17 43t43 17Z"/></svg>
              </span>
              <span className="icon-hover">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#444746"><path d="M314.96-76.78q-59.21 0-100.7-41.48-41.48-41.49-41.48-100.7v-522.08q0-59.21 41.48-100.69 41.49-41.49 100.7-41.49h472.26v613.44q-20.76 0-35.29 14.94-14.54 14.95-14.54 36.3 0 21.34 14.54 35.88 14.53 14.53 35.29 14.53v91.35H314.96Zm-49.83-274.87q11.63-4.87 23.58-7.46 11.96-2.59 26.25-2.59h22.17v-429.17h-22.17q-20.76 0-35.3 14.53-14.53 14.54-14.53 35.3v389.39Zm164.35-10.05h265.39v-429.17H429.48v429.17Zm-164.35 10.05v-439.22 439.22Zm49.83 182.52h340.13q-5.18-11.79-7.61-23.5-2.44-11.72-2.44-25.78 0-13.24 3.09-25.98 3.09-12.73 7.96-24.39H314.96q-21.6 0-35.71 14.53-14.12 14.53-14.12 35.29 0 21.6 14.12 35.71 14.11 14.12 35.71 14.12Z"/></svg>
              </span>
              <span className="icon-active">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#001D35"><path d="M314.96-76.78q-59.21 0-100.7-41.48-41.48-41.49-41.48-100.7v-522.08q0-59.21 41.48-100.69 41.49-41.49 100.7-41.49h472.26v613.44q-20.76 0-35.29 14.94-14.54 14.95-14.54 36.3 0 21.34 14.54 35.88 14.53 14.53 35.29 14.53v91.35H314.96Zm22.17-284.92h92.35v-429.17h-92.35v429.17Zm-22.17 192.57h340.13q-5.18-11.79-7.61-23.5-2.44-11.72-2.44-25.78 0-13.24 3.09-25.98 3.09-12.73 7.96-24.39H314.96q-21.6 0-35.71 14.53-14.12 14.53-14.12 35.29 0 21.6 14.12 35.71 14.11 14.12 35.71 14.12Z"/></svg>
              </span>
            </div>
          }
          label="Glossaries"
          isActive={isGlossariesActive}
          onClick={handleGlossariesClick}
        />

        {/* Annotations */}
        <SidebarMenuItem
          icon={
            <div className="icon-states">
              <span className="icon-inactive">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#444746"><path d="M168-144q-29.7 0-50.85-21.15Q96-186.3 96-216v-528q0-29.7 21.15-50.85Q138.3-816 168-816h624q29.7 0 50.85 21.15Q864-773.7 864-744v528q0 29.7-21.15 50.85Q821.7-144 792-144H168Zm0-72h624v-528H168v528Zm72-96h480v-72H240v72Zm0-144h168v-216H240v216Zm240 0h240v-72H480v72Zm0-144h240v-72H480v72ZM168-216v-528 528Z"/></svg>
              </span>
              <span className="icon-hover">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#444746"><path d="M174.78-124.78q-41 0-69.5-28.5t-28.5-69.5v-514.44q0-41 28.5-69.5t69.5-28.5h610.44q41 0 69.5 28.5t28.5 69.5v514.44q0 41-28.5 69.5t-69.5 28.5H174.78Zm0-98h610.44v-514.44H174.78v514.44Zm68.61-92.61h473.22v-72H243.39v72Zm0-140.61h168v-212.61h-168V-456ZM480-456h236.61v-72H480v72Zm0-140.61h236.61v-72H480v72ZM174.78-222.78v-514.44 514.44Z"/></svg>
              </span>
              <span className="icon-active">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#001D35"><path d="M174.78-124.78q-41 0-69.5-28.5t-28.5-69.5v-514.44q0-41 28.5-69.5t69.5-28.5h610.44q41 0 69.5 28.5t28.5 69.5v514.44q0 41-28.5 69.5t-69.5 28.5H174.78Zm68.61-190.61h473.22v-72H243.39v72Zm0-140.61h168v-212.61h-168V-456ZM480-456h236.61v-72H480v72Zm0-140.61h236.61v-72H480v72Z"/></svg>
              </span>
            </div>
          }
          label="Aspects"
          isActive={isAnnotationsActive}
          onClick={handleAnnotationsClick}
        />

        {/* Data Products */}
        <SidebarMenuItem
          icon={
            <div className="icon-states">
              <span className="icon-inactive">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#444746"><path d="M288-288h144v-144H288v144Zm240 0h144v-144H528v144ZM288-528h144v-144H288v144Zm240 0h144v-144H528v144ZM216-144q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h528q29.7 0 50.85 21.15Q816-773.7 816-744v528q0 29.7-21.15 50.85Q773.7-144 744-144H216Zm0-72h528v-528H216v528Zm0-528v528-528Z"/></svg>
              </span>
              <span className="icon-hover">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#444746"><path d="M283.48-283.48h153.04v-153.04H283.48v153.04Zm240 0h153.04v-153.04H523.48v153.04Zm-240-240h153.04v-153.04H283.48v153.04Zm240 0h153.04v-153.04H523.48v153.04Zm-300.7 398.7q-41 0-69.5-28.5t-28.5-69.5v-514.44q0-41 28.5-69.5t69.5-28.5h514.44q41 0 69.5 28.5t28.5 69.5v514.44q0 41-28.5 69.5t-69.5 28.5H222.78Zm0-98h514.44v-514.44H222.78v514.44Zm0-514.44v514.44-514.44Z"/></svg>
              </span>
              <span className="icon-active">
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#001D35"><path d="M283.48-283.48h153.04v-153.04H283.48v153.04Zm240 0h153.04v-153.04H523.48v153.04Zm-240-240h153.04v-153.04H283.48v153.04Zm240 0h153.04v-153.04H523.48v153.04Zm-300.7 398.7q-41 0-69.5-28.5t-28.5-69.5v-514.44q0-41 28.5-69.5t69.5-28.5h514.44q41 0 69.5 28.5t28.5 69.5v514.44q0 41-28.5 69.5t-69.5 28.5H222.78Zm0-98h514.44v-514.44H222.78v514.44Zm0-514.44v514.44-514.44Z"/></svg>
              </span>
            </div>
          }
          label="Data Products"
          isActive={isDataProductsActive}
          disabled={false}
          multiLine={false}
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
                width: 44,
                height: 32,
                borderRadius: '1000px',
                '&:hover': {
                  backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              {mode === 'light' ? (
                <DarkMode sx={{ fontSize: 20 }} />
              ) : (
                <LightMode sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>
        </div>
      )}
    </nav>
  );
};

export default GlobalSidebar;
