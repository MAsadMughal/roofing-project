// src/routes/(protected)/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async (event) => {
  const user = event.locals.user;
  console.log('Protected layout user:', user); // Debug log
  if (!user) {
    const redirectUrl = `/login?redirectTo=${encodeURIComponent(event.url.pathname)}`;
    console.log('Redirecting to:', redirectUrl); // Debug log
    throw redirect(302, redirectUrl);
  }

  return {
    user
  };
};