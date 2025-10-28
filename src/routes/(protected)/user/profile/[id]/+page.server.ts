import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  requireAuth(event);

  const id = event.params.id;
  const res = await event.fetch(`/api/users/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw error(res.status, 'Profile not accessible');
  }
  const data = await res.json();
  return { userProfile: data.profile, metrics: data.metrics };
};