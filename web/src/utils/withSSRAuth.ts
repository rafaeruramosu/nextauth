import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";

import { destroyCookie, parseCookies } from "nookies";

import decode from 'jwt-decode'

import { AuthTokenError } from "../services/errors/AuthTokenError";

import { validateUserPermissions } from "./validateUserPermissions";

type WithSSRAuthOptions = {
  permissions?: string[];
  roles?: string[];
}

export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions) { // High Order Function is basically a function that receives a second function as a parameter
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
    const cookies = parseCookies(ctx);

    const token = cookies['auth-frontend.token'];

    if(!token) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        }
      }
    }

    if(options) {
      const user = decode<{ permissions: string[], roles: string[] }>(token);

      const { permissions, roles } = options;

      const userHasValidPermissions = validateUserPermissions({
        user,
        permissions,
        roles
      });

      if(!userHasValidPermissions) {
        return {
          // notFound: true, // if you don't have any page that all users have permission to access, use 'notFound' for the user to receive a 404
          redirect: {
            destination: '/dashboard',
            permanent: false,
          }
        }
      }
    }

    try {
      return await fn(ctx)
    } catch (err) {
      if(err instanceof AuthTokenError) {
        destroyCookie(ctx, 'auth-frontend.token');
        destroyCookie(ctx, 'auth-frontend.refreshToken');
    
        return {
          redirect: {
            destination: '/',
            permanent: false,
          }
        }
      }
    }
  }
}

// private routes (need authentication, use token, and use refreshToken strategy)
// if it is not authenticated, redirects to public routes