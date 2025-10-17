<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import { CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirm = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = null;
		success = false;
		if (newPassword.length < 8) {
			error = 'New password must be at least 8 characters';
			return;
		}
		if (newPassword !== confirm) {
			error = 'Passwords do not match';
			return;
		}
		loading = true;
		try {
			const res = await fetch('/api/auth/change', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword })
			});
			const out = await res.json().catch(() => ({}));
			if (!res.ok) {
				error = out.error || 'Change password failed';
				return;
			}
			success = true;
			currentPassword = '';
			newPassword = '';
			confirm = '';
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto flex min-h-screen items-center justify-center">
	<Card class="w-full max-w-lg border shadow-lg">
		<CardHeader>
			<div class="space-y-2 text-center">
				<h1 class="text-3xl font-bold tracking-tight">Change password</h1>
				<p class="text-sm text-muted-foreground">Update your password. You will stay signed in.</p>
			</div>
		</CardHeader>

		<CardContent>
			<form onsubmit={submit} class="space-y-6">
				<div class="space-y-2">
					<Label for="current" class="font-medium">Current password</Label>
					<Input
						id="current"
						type="password"
						bind:value={currentPassword}
						required
						class="w-full"
					/>
				</div>
				<div class="space-y-2">
					<Label for="new" class="font-medium">New password</Label>
					<Input id="new" type="password" bind:value={newPassword} required class="w-full" />
				</div>
				<div class="space-y-2">
					<Label for="confirm" class="font-medium">Confirm new password</Label>
					<Input id="confirm" type="password" bind:value={confirm} required class="w-full" />
				</div>

				{#if error}
					<div class="rounded-md bg-destructive/15 p-3">
						<p class="text-sm font-medium text-destructive">{error}</p>
					</div>
				{/if}

				{#if success}
					<div class="rounded-md bg-emerald-600/10 p-3">
						<p class="text-sm font-medium text-emerald-700">Password updated successfully.</p>
					</div>
				{/if}

				<Button type="submit" class="w-full" variant="default" size="lg" disabled={loading}>
					{loading ? 'Updating...' : 'Update password'}
				</Button>
			</form>
		</CardContent>

		<CardFooter class="flex flex-col space-y-4 border-t p-6">
			<p class="text-center text-sm text-muted-foreground">
				<a href="/" class="font-medium text-primary hover:underline">Back to dashboard</a>
			</p>
		</CardFooter>
	</Card>
</div>
