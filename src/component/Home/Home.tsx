import './Home.css'
import SearchBar from '../SearchBar/SearchBar'
import { CircularProgress, Grid } from '@mui/material'
import { ChevronRight } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import axios from 'axios'
import { URLS } from '../../constants/urls'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '../../app/store'
import { useNotification } from '../../contexts/NotificationContext'
import { getProjects } from '../../features/projects/projectsSlice'

/**
 * @file Home.tsx
 * @description
 * This component renders the main home/landing page of the application.
 *
 * Key functionalities include:
 * 1.  **Application Configuration Fetching**: On component mount, it checks if the
 * user's `appConfig` (from the `useAuth` context) is populated.
 * - If not, it displays a `CircularProgress` loader while it fetches the
 * configuration from the `APP_CONFIG` API endpoint.
 * - Upon successful fetch, it updates the user's context with this
 * configuration using `updateUser`.
 * - If the fetch fails (e.g., token expiration), it logs the user out.
 * 2.  **State Reset**: It dispatches Redux actions to clear any existing
 * search/resource items from previous sessions.
 * 3.  **Search Handling**: It renders the `SearchBar` component. When a user
 * submits a search (via `handleSearch`), it again resets Redux state and
 * navigates to the `/search` page.
 * 4.  **Browse Navigation**: It provides a "Browse" link that navigates the user
 * to the `/browse-by-annotation` page when clicked.
 *
 * @param {object} props - This component accepts no props.
 *
 * @returns {React.ReactElement} A React element displaying either:
 * - A `CircularProgress` loader while fetching application configuration.
 * - The main home page layout with the `SearchBar` and "Browse" link.
 */

const Home = () => {
  // const { displayName, email, phoneNumber, photoURL } = user
  const { user, logout, updateUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  
  const projectsLoaded = useSelector((state: any) => state.projects.isloaded);
  //const searchTerm = useSelector((state:any) => state.search.term);

  useEffect(() => {
    if(!projectsLoaded) {
      dispatch(getProjects({ id_token: user?.token }));
    }
    dispatch({ type: 'resources/setItemsPreviousPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsStoreData', payload: [] });
    dispatch({ type: 'resources/setItems', payload: [] });
      if(Object.keys(user?.appConfig).length === 0){
        axios.get(URLS.API_URL + URLS.APP_CONFIG)
        .then((res)=>{
          const appConfig:any = res.data;
          let userData = {
            name: user?.name,
            email: user?.email,
            picture: user?.picture,
            token: user?.token,
            hasRole: true,
            roles: [],
            permissions: [],
            appConfig: appConfig
          };
          updateUser(user?.token, userData);
          setLoader(false);
          showSuccess("Welcome " + user?.name + "!", 2000);
        }).catch((err)=>{
          console.log(err);
          showError("Access token expired or you do not have enough permissions", 2000);
          setLoader(false);
          logout();
        });
      }else{
        setLoader(false);
      }
  }, []);

  const handleSearch = (text:string) => {
    console.log("Search Term:", text);
    dispatch({ type: 'resources/setItemsPreviousPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsStoreData', payload: [] });
    dispatch({ type: 'resources/setItems', payload: [] });
    // Dispatch the setSearchTerm action with the new value
    navigate('/search');
    
  };

  const handleBrowse = () => {
    navigate('/browse-by-annotation');
  };


  return (
    <div className="home">
      <div className='home-body'>
        { loader ? (<>
          <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            justifyContent="center"
            sx={{ minHeight: 'inherit' }}
          >
            <CircularProgress />
          </Grid>
          </>) : 
          ( <div className='home-banner'>
              <Grid
                container
                spacing={0}
                direction="column"
                alignItems="center"
                justifyContent="center"
                sx={{ minHeight: 'inherit' }}
              >
                <div style={{fontSize: "1.75rem",color:"#1F1F1F",fontWeight: "500", marginBottom:"1.25rem", fontStyle:"Medium", fontFamily: '"Google Sans", sans-serif'}}>
                  <span>What would you like to discover?</span>
                </div>
                <SearchBar handleSearchSubmit={handleSearch} variant="default" dataSearch={[
                    { name: 'BigQuery' },
                    { name: 'Data Warehouse' },
                    { name: 'Data Lake' },
                    { name: 'Data Pipeline' },
                    { name: 'GCS' }
                  ]}/>
                <div style={{marginTop:"12px", fontSize:"14px", color:"#0B57D0", fontWeight:"600", width:"700px", fontStyle:"Medium", marginLeft: "-18px",}}>
                  <a className='home-browse-button' onClick={handleBrowse} style={{color:"#0B57D0", fontFamily: '"Roboto","Google Sans", sans-serif'}}>
                    Browse 
                    <ChevronRight style={{ top:"7px", position:"relative", color:"#0B57D0" }} />
                  </a>
                </div>
              </Grid>
            </div>
          )}
      </div>
    </div>
  )
}

export default Home;
