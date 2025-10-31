import axios from 'axios';
import { checkAndHandleAuthError } from '../services/authErrorService';

// Axios response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error: Error) => {
    checkAndHandleAuthError(error);
    return Promise.reject(error);
  }
);

export default axios;
