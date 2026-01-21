import React from 'react';
import { useLocation } from 'react-router-dom';
import GlobalSidebar from '../GlobalSidebar/GlobalSidebar';
import Navbar from '../Navbar/Navbar';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  searchBar?: boolean;
  searchNavigate?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  searchBar = false,
  searchNavigate = true,
}) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/home';

  // Home page layout: Navbar at top, then sidebar + content below
  if (isHomePage) {
    return (
      <div className="home-layout">
        <div className="navbar-section">
          <Navbar searchBar={searchBar} searchNavigate={searchNavigate} />
        </div>
        <div className="content-with-sidebar">
          <GlobalSidebar isHomePage={true} />
          <div className="home-content-area">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Other routes: Sidebar full height on left, Navbar + content to the right
  return (
    <div className="app-layout">
      <GlobalSidebar isHomePage={false} />
      <div className="main-content-area">
        <Navbar searchBar={searchBar} searchNavigate={searchNavigate} />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
