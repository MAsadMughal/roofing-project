import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
    // Call parent() to get data returned from layout.server.ts, e.g., { user }
    const parentData = await parent();
    const user = parentData.user;

    const [chatsRes, membersRes] = await Promise.all([
        fetch('/api/chats'),
        fetch('/api/org/members')
    ]);
    const chats = await chatsRes.json().catch(() => []);
    const members = await membersRes.json().catch(() => []);
    return { chats, members, user };
};
