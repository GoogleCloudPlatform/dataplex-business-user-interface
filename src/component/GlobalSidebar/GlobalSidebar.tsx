import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from '@mui/icons-material';
import SidebarMenuItem from './SidebarMenuItem';
import BrowsePopover from './BrowsePopover';
import { useAccessRequest } from '../../contexts/AccessRequestContext';
import './GlobalSidebar.css';
import { fetchDataProductsList } from '../../features/dataProducts/dataProductsSlice';
import { useDispatch } from 'react-redux';
import { type AppDispatch } from '../../app/store';
import { useAuth } from '../../auth/AuthProvider';

interface GlobalSidebarProps {
  isHomePage?: boolean;
}

const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ isHomePage = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAccessPanelOpen } = useAccessRequest();
  const [browseAnchorEl, setBrowseAnchorEl] = useState<HTMLElement | null>(null);

  const isBrowseOpen = Boolean(browseAnchorEl);

  // Determine active states based on current route
  const isSearchActive = ['/home', '/search', '/view-details'].includes(location.pathname);
  const isBrowseActive = ['/glossaries', '/browse-by-annotation'].includes(location.pathname) || isBrowseOpen;
  const isDataProductsActive = location.pathname.startsWith('/data-products');
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const handleSearchClick = () => {
    navigate('/home');
  };

  const handleBrowseClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setBrowseAnchorEl(event.currentTarget);
  };

  const handleBrowseClose = () => {
    setBrowseAnchorEl(null);
  };

  const handleLogoClick = () => {
    navigate('/home');
  };

  const handleDataProducts = () => {
    dispatch(fetchDataProductsList({ id_token: user?.token }));
    navigate('/data-products');
  };

  return (
    <nav
      className={`global-sidebar ${isHomePage ? 'partial-height' : 'full-height'}`}
      style={{
        zIndex: isAccessPanelOpen ? 999 : 1200,
      }}
    >
      {!isHomePage && (
        <div className="sidebar-logo-container" onClick={handleLogoClick}>
          <img
            src="/assets/svg/dataplex-logo-icon.svg"
            alt="Dataplex"
            className="logo-icon-only"
          />
        </div>
      )}

      {/* Menu Items */}
      <div className="sidebar-menu-items">
        {/* Search */}
        <SidebarMenuItem
          icon={<Search sx={{ fontSize: 20 }} />}
          label="Search"
          isActive={isSearchActive}
          onClick={handleSearchClick}
        />

        {/* Browse */}
        <SidebarMenuItem
          icon={
            isBrowseActive ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <mask id="mask0_7284_49287" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="20" height="20">
                  <rect width="20" height="20" fill="#D9D9D9"/>
                </mask>
                <g mask="url(#mask0_7284_49287)">
                  <path d="M4.16667 17.5L2.5 7.5H17.5L15.8333 17.5H4.16667ZM5.5625 15.8333H14.4375L15.5 9.16667H4.5L5.5625 15.8333ZM8.33333 12.5H11.6667C11.9028 12.5 12.1007 12.4201 12.2604 12.2604C12.4201 12.1007 12.5 11.9028 12.5 11.6667C12.5 11.4306 12.4201 11.2326 12.2604 11.0729C12.1007 10.9132 11.9028 10.8333 11.6667 10.8333H8.33333C8.09722 10.8333 7.89931 10.9132 7.73958 11.0729C7.57986 11.2326 7.5 11.4306 7.5 11.6667C7.5 11.9028 7.57986 12.1007 7.73958 12.2604C7.89931 12.4201 8.09722 12.5 8.33333 12.5ZM5 6.66667C4.76389 6.66667 4.56597 6.58681 4.40625 6.42708C4.24653 6.26736 4.16667 6.06944 4.16667 5.83333C4.16667 5.59722 4.24653 5.39931 4.40625 5.23958C4.56597 5.07986 4.76389 5 5 5H15C15.2361 5 15.434 5.07986 15.5938 5.23958C15.7535 5.39931 15.8333 5.59722 15.8333 5.83333C15.8333 6.06944 15.7535 6.26736 15.5938 6.42708C15.434 6.58681 15.2361 6.66667 15 6.66667H5ZM6.66667 4.16667C6.43056 4.16667 6.23264 4.08681 6.07292 3.92708C5.91319 3.76736 5.83333 3.56944 5.83333 3.33333C5.83333 3.09722 5.91319 2.89931 6.07292 2.73958C6.23264 2.57986 6.43056 2.5 6.66667 2.5H13.3333C13.5694 2.5 13.7674 2.57986 13.9271 2.73958C14.0868 2.89931 14.1667 3.09722 14.1667 3.33333C14.1667 3.56944 14.0868 3.76736 13.9271 3.92708C13.7674 4.08681 13.5694 4.16667 13.3333 4.16667H6.66667Z" fill="#0E4DCA"/>
                </g>
              </svg>
            ) : (
              <img src="/assets/svg/browse-icon.svg" alt="Browse" style={{ width: 20, height: 20 }} />
            )
          }
          label="Browse"
          isActive={isBrowseActive}
          onClick={handleBrowseClick}
        />

        {/* Data Products (Disabled) */}
        <SidebarMenuItem
          icon={<img src="/assets/svg/data-products-icon.svg" alt="Data Products" style={{ width: 20, height: 20 }} />}
          label="Data Products"
          isActive={isDataProductsActive}
          disabled={false}
          multiLine={false}
          onClick={() => {handleDataProducts();}}
        />
      </div>

      {/* Browse Popover */}
      <BrowsePopover
        anchorEl={browseAnchorEl}
        open={isBrowseOpen}
        onClose={handleBrowseClose}
      />
    </nav>
  );
};

export default GlobalSidebar;
