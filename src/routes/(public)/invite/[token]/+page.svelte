<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import { CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	const { data } = $props();

	let password = $state('');
	let confirm = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!data.valid) return;
		error = null;
		success = false;
		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}
		if (password !== confirm) {
			error = 'Passwords do not match';
			return;
		}
		loading = true;
		try {
			const res = await fetch('/api/invites/accept', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ token: data.token, password })
			});
			const out = await res.json().catch(() => ({}));
			if (!res.ok) {
				error = out.error || 'Failed to accept invite';
				return;
			}
			success = true;
			if (browser) {
				setTimeout(() => {
					goto('/login');
				}, 2000);
			}
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Accept Invitation | ROOFPILOT CRM</title>
</svelte:head>

<div class="flex min-h-screen">
	<!-- Left Side: Enterprise Feature Showcase (Desktop only) -->
	<div
		class="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-slate-800 bg-slate-950 p-12 text-white lg:flex"
	>
		<!-- Abstract grid background pattern -->
		<div
			class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_50%)]"
		></div>
		<div
			class="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px]"
		></div>

		<!-- Header / Brand Logo -->
		<div class="relative z-10 flex items-center gap-2.5">
			<img
				src="https://i.postimg.cc/BZ2cNHkd/logo.png"
				alt="Logo"
				class="h-8 w-auto brightness-200 drop-shadow-md"
			/>
			<span class="text-lg font-bold tracking-tight text-white">ROOFPILOT</span>
			<span
				class="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-indigo-400 uppercase"
				>Enterprise</span
			>
		</div>

		<!-- Center: Feature List / Visual Mockup -->
		<div class="relative z-10 my-auto max-w-md space-y-8">
			<div class="space-y-3">
				<h1 class="text-3xl leading-tight font-extrabold tracking-tight text-white">
					The Operating System for Roofing Enterprises.
				</h1>
				<p class="text-xs leading-relaxed text-slate-400">
					Unify sales pipelines, crew operations, client proposals, and real-time scheduling under a
					single, highly performant SaaS application.
				</p>
			</div>

			<div class="space-y-4">
				<!-- Feature Item 1 -->
				<div class="flex gap-3">
					<div
						class="flex size-7 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
					>
						<svg
							class="size-4"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
					</div>
					<div>
						<h4 class="text-xs font-semibold text-white">High-Precision Pipelines</h4>
						<p class="text-slate-450 mt-0.5 text-[11px]">
							Streamline intake, assign estimators, and watch lead-to-contract metrics convert.
						</p>
					</div>
				</div>

				<!-- Feature Item 2 -->
				<div class="flex gap-3">
					<div
						class="flex size-7 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
					>
						<svg
							class="size-4"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
					</div>
					<div>
						<h4 class="text-xs font-semibold text-white">Dynamic Scheduling & Kanban</h4>
						<p class="text-slate-450 mt-0.5 text-[11px]">
							Track production workflow milestones, crew details, and scheduling timelines on the
							fly.
						</p>
					</div>
				</div>

				<!-- Feature Item 3 -->
				<div class="flex gap-3">
					<div
						class="flex size-7 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400"
					>
						<svg
							class="size-4"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/></svg
						>
					</div>
					<div>
						<h4 class="text-xs font-semibold text-white">Instant Proposals & Invoices</h4>
						<p class="text-slate-450 mt-0.5 text-[11px]">
							Generate bids, request approvals, and log contractor payments in single click
							operations.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer of Left Showcase -->
		<div
			class="relative z-10 flex items-center justify-between border-t border-slate-900 pt-6 text-[11px] text-slate-500"
		>
			<span>© 2026 ROOFPILOT Inc. All rights reserved.</span>
			<span class="cursor-pointer hover:text-slate-400">Security & Compliance</span>
		</div>
	</div>

	<!-- Right Side: Auth Form -->
	<div
		class="flex w-full flex-col justify-center bg-slate-50/50 px-6 md:px-16 lg:w-1/2 dark:bg-slate-900/10"
	>
		<div class="mx-auto w-full max-w-sm space-y-6">
			<!-- Mobile Brand Logo (hidden on large displays) -->
			<div class="mb-6 flex items-center justify-center gap-2 lg:hidden">
				<img
					src="https://i.postimg.cc/BZ2cNHkd/logo.png"
					alt="Logo"
					class="h-8 w-auto drop-shadow-xs"
				/>
				<span class="text-lg font-bold tracking-tight text-foreground">ROOFPILOT</span>
			</div>

			<!-- Invite Card container -->
			<Card class="w-full rounded-2xl border border-border bg-card p-2 shadow-lg transition-all">
				<CardHeader class="mt-3 pb-2 text-center">
					<h2 class="text-xl font-bold tracking-tight text-foreground">Set Up Your Account</h2>
					{#if !data.valid}
						<p class="mt-1 text-xs font-medium text-red-500">
							This invite link is invalid or has expired.
						</p>
					{:else}
						<p class="text-muted-foreground mt-1 text-xs">
							Choose a password to secure your account for <span
								class="font-semibold text-foreground">{data.email}</span
							>
						</p>
					{/if}
				</CardHeader>

				<CardContent class="pt-4">
					{#if success}
						<div class="space-y-4 py-4 text-center">
							<div
								class="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
							>
								<svg
									class="size-6"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									viewBox="0 0 24 24"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							<div class="space-y-1">
								<h3 class="text-base font-bold text-foreground">Account Activated!</h3>
								<p class="text-muted-foreground text-xs">
									Your password has been set. Redirecting you to the login page...
								</p>
							</div>
							<Button onclick={() => goto('/login')} class="mt-2 h-10 w-full font-semibold">
								Go to Login
							</Button>
						</div>
					{:else if data.valid}
						<form onsubmit={submit} class="space-y-4">
							<div class="space-y-1.5">
								<Label for="password" class="text-muted-foreground text-xs font-semibold"
									>Password</Label
								>
								<Input
									id="password"
									type="password"
									bind:value={password}
									required
									minlength={8}
									class="h-10 w-full text-sm"
									placeholder="••••••••"
								/>
							</div>
							<div class="space-y-1.5">
								<Label for="confirm" class="text-muted-foreground text-xs font-semibold"
									>Confirm Password</Label
								>
								<Input
									id="confirm"
									type="password"
									bind:value={confirm}
									required
									minlength={8}
									class="h-10 w-full text-sm"
									placeholder="••••••••"
								/>
							</div>

							{#if error}
								<div
									class="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-600"
								>
									{error}
								</div>
							{/if}

							<Button
								type="submit"
								class="mt-2 h-10 w-full font-semibold shadow-xs"
								disabled={loading}
							>
								{loading ? 'Activating...' : 'Activate Account'}
							</Button>
						</form>
					{:else}
						<div class="py-6 text-center">
							<div
								class="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
							>
								<svg
									class="size-6"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
							</div>
							<p class="text-muted-foreground text-sm">
								Please request a new workspace invitation from your administrator.
							</p>
						</div>
					{/if}
				</CardContent>

				<CardFooter class="flex flex-col space-y-3 border-t border-border p-5 text-center">
					<p class="text-muted-foreground text-xs">
						Already have an account?
						<a href="/login" class="font-semibold text-primary hover:underline">Sign in</a>
					</p>
				</CardFooter>
			</Card>
		</div>
	</div>
</div>
