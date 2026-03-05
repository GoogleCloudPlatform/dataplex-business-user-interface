import './Home.css'
import SearchBar from '../SearchBar/SearchBar'
import { CircularProgress, Grid } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import axios from 'axios'
import { URLS } from '../../constants/urls'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '../../app/store'
import { useNotification } from '../../contexts/NotificationContext'
import { getProjects } from '../../features/projects/projectsSlice'
import { sanitizeFirstName } from '../../utils/sanitizeName'

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
 *
 * @param {object} props - This component accepts no props.
 *
 * @returns {React.ReactElement} A React element displaying either:
 * - A `CircularProgress` loader while fetching application configuration.
 * - The main home page layout with the `SearchBar`.
 */

const Home = () => {
  const { user, logout, updateUser } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();
  const [loader, setLoader] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const projectsLoaded = useSelector((state: any) => state.projects.isloaded);

  useEffect(() => {
    setLoader(true);
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
            tokenExpiry: user?.tokenExpiry,
            tokenIssuedAt: user?.tokenIssuedAt,
            hasRole: user?.hasRole,
            roles: user?.roles || [],
            permissions: user?.permissions || [],
            iamDisplayRole: user?.iamDisplayRole,
            appConfig: appConfig
          };
          updateUser(user?.token, userData);
          setLoader(false);
        }).catch((err)=>{
          console.log(err);
          showError("Access token expired or you do not have enough permissions", 2000);
          setLoader(false);
          logout();
        });
      }else{
        setLoader(false);
      }
  }, [user, projectsLoaded, dispatch, updateUser, logout, showError]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSearch = (_text:string) => {
    dispatch({ type: 'resources/setItemsPreviousPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsPageRequest', payload: null });
    dispatch({ type: 'resources/setItemsStoreData', payload: [] });
    dispatch({ type: 'resources/setItems', payload: [] });
    navigate('/search');
  };

  return (
    <div className="home">
      <div className='home-body'>
        { loader ? (
          <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            justifyContent="center"
          >
            <CircularProgress />
          </Grid>
        ) : (
          <div className="home-banner">
            <div className="home-content-wrapper">
              <div className="home-header">
                <div className="home-greeting">
                  <span>Hi <span className="home-greeting-name">{sanitizeFirstName(user?.name)}</span>,</span>
                </div>
                <h1 className="home-title">
                  What would you like to discover?
                </h1>
              </div>
              <div className="home-search-container">
                <SearchBar handleSearchSubmit={handleSearch} variant="default" dataSearch={[
                    { name: 'BigQuery' },
                    { name: 'Data Warehouse' },
                    { name: 'Data Lake' },
                    { name: 'Data Pipeline' },
                    { name: 'GCS' }
                ]}/>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home;
