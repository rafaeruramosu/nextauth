import { createContext, ReactNode, useEffect, useState } from "react";

import Router, { useRouter } from "next/router";

import { destroyCookie, parseCookies, setCookie } from "nookies";

import { api } from "../services/apiClient";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

type SignInCredentials = {
  email: string;
  password: string;
}

type AuthContextData = {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  user: User;
}

type AuthProviderProps = {
  children: ReactNode;
}

export const AuthContext= createContext({} as AuthContextData);

let authChannel: BroadcastChannel;

export function signOut() {
  destroyCookie(undefined, 'auth-frontend.token')
  destroyCookie(undefined, 'auth-frontend.refreshToken')

  authChannel.postMessage('signOut');

  Router.push('/');
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { push } = useRouter();

  const [ user, setUser ] = useState<User>();

  const isAuthenticated = !!user;

  useEffect(() => {
    authChannel = new BroadcastChannel('auth');

    authChannel.onmessage = (message) => {
      switch (message.data) {
        case "signIn":   
          // push('/dashboard');
          // window.location.replace("http://localhost:3000/dashboard");
          window.location.reload();
          break;
        case 'signOut': 
          // signOut();
          // authChannel.close();
          window.location.reload();
          break;
        default: 
          break;
      }
    }
  }, [])

  useEffect(() => { 
    const { 'auth-frontend.token': token } = parseCookies();

    if(token) {
      api.get('/me')
        .then(response => {
          const { email, permissions, roles } = response.data;

          setUser({
            email,
            permissions,
            roles
          });
        })
        .catch(() => {
          signOut();
        })
    }
   }, [])

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post('sessions', {
        email,
        password
      })
  
      const { token, refreshToken, permissions, roles } = response.data

      setCookie(undefined, 'auth-frontend.token', token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        sameSite: 'strict',
        secure: 'true',
      });

      setCookie(undefined, 'auth-frontend.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
        sameSite: 'strict',
        secure: 'true',
      });

      setUser({
        email,
        permissions,
        roles
      })

      api.defaults.headers['Authorization'] = `Bearer ${token}`;

      authChannel.postMessage('signIn');
      
      push('/dashboard')
    } catch (err) {
      console.log(err)
    }
  }
  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, signOut, user }} >
      {children}
    </AuthContext.Provider>
  )
}
