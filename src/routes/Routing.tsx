import { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';

interface RootState {
  user: {
    userData?: any;
    token?: string;
  };
}
import Login from '../component/Auth/Login/Login';
import Navbar from '../component/Navbar/Navbar';
import Home from '../component/Home/Home';
import { useSelector } from 'react-redux';
import SearchPage from '../component/SearchPage/SearchPage';
import { Email, Info } from '@mui/icons-material';
import { Button } from '@mui/material';
import ViewDetails from '../component/ViewDetails/ViewDetails';
import AdminPanel from '../component/AdminPanel/AdminPanel';
import { useAuth } from '../auth/AuthProvider';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import BrowseByAnnotation from '../component/BrowseByAnnotation/BrowseByAnnotation';
import SessionExpirationWrapper from '../component/Auth/SessionExpirationWrapper';
import UserGuide from '../component/Guide/UserGuide';

const Routing = () => {
  // state to hold the user object
  // and a function to update it
  // if the user is logged in, it will be set to a User object
  const { user, logout } = useAuth();
  const userState = useSelector((state: RootState) => state.user);
  const location = useLocation();

  //const [roleChecking, setRoleChecking] = useState<boolean>(false);
  const navigate = useNavigate()

  const handleSignOut = () => {
    logout();
  };

  useEffect(() => {
    // Only redirect if we're on the root path or login page
    const shouldRedirect = location.pathname === '/' || location.pathname === '/login';
    
    if (userState && shouldRedirect) {
      if(userState.userData?.hasRole) {
        navigate('/home')
      }else{
        navigate('/login');
      }
    }
  }, [userState, location.pathname, navigate]);

  // useEffect(() => {
  //   console.log("Routing component mounted", user);
  // }, [navigate]);
  
  return (
    <Routes>
      <Route
        path="/"
        element={
          user ?
            <Navigate to="/home" replace />
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/login"
        element={
          user && user.email ?
            <Navigate to="/home" replace />
            : <Login />
        }
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <SessionExpirationWrapper>
              <>
                <Navbar searchBar={false}/>
                <Home />
              </>
            </SessionExpirationWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
            <ProtectedRoute>
              <SessionExpirationWrapper>
                <>
                  <Navbar searchBar={true} searchNavigate={false}/>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '95vh',
                    backgroundColor: '#F8FAFD',
                  }}>
                  <SearchPage />
                  </div>
                </>
              </SessionExpirationWrapper>
            </ProtectedRoute>
        }
      />
      <Route
        path="/permission-required"
        element={
            <ProtectedRoute>
            <>
              <div style={{ padding: '20px', width:"800px", margin:"100px auto 0",  }}>
                <img src="/assets/images/cs-studio-logo-main.png" alt="CS Studio Logo" style={{width:"300px"}} />
                <h1>Permission Required</h1>
                <p style={{fontSize:"20px"}}>You do not have the required permissions to access this app.<br />
                <Info style={{position:"relative",top:"5px"}}/> You would be needing at least <label>"dataplex.viewer"</label> role to access this app<br />
                Please contact admin for the access <Email style={{position:"relative",top:"5px"}}/> {import.meta.env.VITE_ADMIN_EMAIL}</p>
                <Button variant="outlined" onClick={handleSignOut}  style={{color:"#333", background:"white", borderRadius:"20px"}}>SignOut</Button>
              </div>
            </>
            </ProtectedRoute>
        }
      />
      <Route
        path="/view-details"
        element={
          <ProtectedRoute>
            <SessionExpirationWrapper>
              <>
                <div style={{ position: 'sticky', top: 0, zIndex: 1100, backgroundColor: '#F8FAFD' }}>
                <Navbar searchBar={true}/>
                </div>
                <ViewDetails />
              </>
            </SessionExpirationWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-panel"
        element={
          <ProtectedRoute>
            <SessionExpirationWrapper>
              <>
                <Navbar searchBar={true}/>
                <AdminPanel />
              {/* </ProtectedRoute><CircularProgress style={{position:"absolute", top:"50%", left:"50%", transform:"translate(-50%, -50%)"}} /> */}
              </>
            </SessionExpirationWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/browse-by-annotation"
        element={
          <ProtectedRoute>
            <SessionExpirationWrapper>
              <>
                <Navbar searchBar={true}/>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '95vh',
                    backgroundColor: '#F8FAFD',
                  }}>
                <BrowseByAnnotation />
                </div>
              </>
            </SessionExpirationWrapper>
          </ProtectedRoute>
        }
      />
     <Route
        path="/guide"
        element={
          <ProtectedRoute>
            <SessionExpirationWrapper>
              <Navbar searchBar={true}/>
              <>
                <div style={{ 
                  width: "90%", 
                  maxWidth: "1400px",
                  margin: "20px auto 0", 
                  backgroundColor: "#FFF",
                  borderRadius: "8px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)"
                }}>
                  <UserGuide />
                </div>
              </>
            </SessionExpirationWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/help-support"
        element={
          <ProtectedRoute>
            <SessionExpirationWrapper>
              <Navbar searchBar={true}/>
              <>
                <div style={{ padding: '20px', width:"1000px", margin:"100px auto 0",  }}>
                    <div className="logo-container">
                      <img src="/assets/svg/catalog-studio-logo-figma-585de1.svg" alt="CS Studio Logo" className="navbar-logo-img" />
                      <label style={{fontSize:"24px", fontWeight:800, color:"#0E4DCA"}}>Dataplex</label>
                      <label style={{fontSize:"24px", fontWeight:600, color:"#0E4DCA", margin:"0px 3px 0px"}}>|</label>
                      <label style={{fontSize:"22px", fontWeight:600, color:"#0E4DCA", margin:"0px 3px 0px"}}>Buisness Interface</label>
                    </div>
                    <h1>For help contact over these email</h1>
                    <div style={{ borderBottom: "1px solid #DADCE0", padding: '0.875rem 0', gap: '0.25rem'}}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                        <div style={{ flex: '1 1 0', width: '50%' }}>
                          <div style={{ color: "#575757", fontSize: "1.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>Admin/Support Contact Email</div>
                          <div style={{ textDecoration:"underline", color: "#0E4DCA", fontSize: "1rem", fontWeight: "600", fontFamily: '"Google Sans Text",sans-serif', marginTop: "0.125rem", textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {import.meta.env.VITE_SUPPORT_EMAIL || import.meta.env.VITE_ADMIN_EMAIL}
                          </div>
                        </div>
                        <div style={{ flex: '1 1 0', width: '50%'  }}>  
                          <div style={{ color: "#575757", fontSize: "1.6875rem", fontWeight: "500", fontFamily: '"Google Sans Text",sans-serif' }}>Dataplex Business Inteface Support</div>
                          <div style={{ textDecoration:"underline", color: "#0E4DCA", fontSize: "1rem", fontWeight: "600", fontFamily: '"Google Sans Text",sans-serif', marginTop: "0.125rem", textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            dataplex-interface-feedback@google.com
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </>
            </SessionExpirationWrapper>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
};

export default Routing;
