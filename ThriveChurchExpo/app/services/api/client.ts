import axios from 'axios';
import { apiConfig } from '../../config/app.config';

export const BASE_URL = apiConfig.baseURL;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: apiConfig.timeout,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Normalize network errors
    return Promise.reject(err);
  },
);

