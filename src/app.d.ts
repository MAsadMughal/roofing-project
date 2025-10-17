// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: {
				id: bigint;
				email: string;
				firstName?: string | null;
				lastName?: string | null;
				role: 'OWNER' | 'REP' | 'ESTIMATOR' | 'PM' | 'FOREMAN' | 'OFFICE' | 'CUSTOMER';
				contractorId?: bigint | null;
				customerId?: bigint | null;
			} | null;
			sessionId: string | null;
		}
		interface PageData {
			user: App.Locals['user'];
		}
	}
}

export {};
