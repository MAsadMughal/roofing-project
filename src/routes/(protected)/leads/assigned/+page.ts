import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/api/leads/assigned');
  const leads = await res.json();
  return { leads };
};


