import axios, { AxiosError } from 'axios';

import { parseCookies, setCookie } from 'nookies';

import { signOut } from '../contexts/AuthContext';

import { AuthTokenError } from './errors/AuthTokenError';

let isRefreshing = false;

let failedRequestQueue = [];

export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['auth-frontend.token']}`
    }
  })
  
  api.interceptors.response.use(response => {
    return response;
  }, (error: AxiosError) => {
    if(error.response.status === 401) {
      if(error.response.data?.code === 'token.expired') {
        // refresh token
        cookies = parseCookies(ctx);
  
        const { 'auth-frontend.refreshToken': refreshToken } = cookies;
  
        const originalConfig = error.config;
  
        if(!isRefreshing) {
          isRefreshing = true;
  
          api.post('/refresh', {
            refreshToken,
          }).then(response => {
            const { token } = response.data;
    
            setCookie(ctx, 'auth-frontend.token', token, {
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/',
              sameSite: 'strict',
              secure: 'true',
            });
      
            setCookie(ctx, 'auth-frontend.refreshToken', response.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/',
              sameSite: 'strict',
              secure: 'true',
            });
    
            api.defaults.headers['Authorization'] = `Bearer ${token}`;
  
            failedRequestQueue.forEach(request => request.onSuccess(token));
            failedRequestQueue = [];
          }).catch(err => {
            failedRequestQueue.forEach(request => request.onFailure(err));
            failedRequestQueue = [];
  
            if(process.browser) {
              signOut()
            }
          }).finally(() => {
            isRefreshing = false;
          });
        }
  
        // request queue
        return new Promise((resolve, reject) => {
          failedRequestQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers['Authorization'] = `Bearer ${token}`;
  
              resolve(api(originalConfig))
            },
            onFailure: (err: AxiosError) => {
              reject(err)
            },
          })
        })
      } else {
        // signOut user
        if(process.browser) {
          signOut()
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }
  
    return Promise.reject(error);
  });
  
  return api;
}