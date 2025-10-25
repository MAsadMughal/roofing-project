// src/routes/(protected)/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const user = locals.user;
  
  if (!user) {
    const redirectUrl = `/login?redirectTo=${encodeURIComponent(url.pathname)}`;
    throw redirect(302, redirectUrl);
  }

  return {
    user
  };
};