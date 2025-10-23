// src/routes/(protected)/+layout.server.ts
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async (event) => {
  const user = event.locals.user;
  console.log('Public layout user:', user); // Debug log
  
  if (user) {
    console.log('User present, redirecting to dashboard'); // Debug log
    throw redirect(302, '/dashboard');
  }

  return {
    user
  };
};