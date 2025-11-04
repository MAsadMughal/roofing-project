// This +page.ts is a SvelteKit *client* (browser) load (PageLoad) file, 
// but it's trying to use server-only modules (prisma, server/auth, event.locals etc).
// That will never work; you cannot access server APIs from a client load function. 
// The correct pattern is to remove all uses of prisma/auth/locals from +page.ts
// and fetch the data from your server endpoints or the page data provided by +page.server.ts.

import type { PageLoad } from './$types';

// Client-side load: just pass through any data loaded server-side
export const load: PageLoad = async ({ data }) => {
	return data;
};
