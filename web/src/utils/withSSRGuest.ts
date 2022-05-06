import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";

import { parseCookies } from "nookies";

export function withSSRGuest<P>(fn: GetServerSideProps<P>) { // High Order Function is basically a function that receives a second function as a parameter
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
    const cookies = parseCookies(ctx);

    if(cookies['auth-frontend.token']) {
      return {
        redirect: {
          destination: '/dashboard',
          permanent: false,
        }
      }
    }

    return await fn(ctx)
  }
}


// public routes (do not need authentication, either because it does not use the token or the refreshToken strategy)
// if if authenticated, redirects to private routes