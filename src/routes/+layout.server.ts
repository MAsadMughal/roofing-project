import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    console.log('Layout user:', locals.user);
    return {
        user: locals.user
    };
};