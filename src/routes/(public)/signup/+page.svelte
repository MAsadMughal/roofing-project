<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import { CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';

	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = null;
		loading = true;
		try {
			const res = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, password, firstName, lastName })
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				error = data.error || 'Signup failed';
				return;
			}
			window.location.href = '/';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign Up | ROOFPILOT CRM</title>
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

			<!-- Register Card container -->
			<Card class="w-full rounded-2xl border border-border bg-card p-2 shadow-lg transition-all">
				<CardHeader class="mt-3 pb-2 text-center">
					<h2 class="text-xl font-bold tracking-tight text-foreground">Create Your Account</h2>
					<p class="text-muted-foreground mt-1 text-xs">
						Join our space to manage your roofing projects and team operations.
					</p>
				</CardHeader>

				<CardContent class="pt-4">
					<form onsubmit={submit} class="space-y-4">
						<div class="grid gap-3 sm:grid-cols-2">
							<div class="space-y-1.5">
								<Label for="firstName" class="text-muted-foreground text-xs font-semibold"
									>First Name</Label
								>
								<Input
									id="firstName"
									bind:value={firstName}
									placeholder="John"
									class="h-10 text-sm"
								/>
							</div>
							<div class="space-y-1.5">
								<Label for="lastName" class="text-muted-foreground text-xs font-semibold"
									>Last Name</Label
								>
								<Input id="lastName" bind:value={lastName} placeholder="Doe" class="h-10 text-sm" />
							</div>
						</div>

						<div class="space-y-1.5">
							<Label for="email" class="text-muted-foreground text-xs font-semibold"
								>Email Address</Label
							>
							<Input
								id="email"
								type="email"
								bind:value={email}
								placeholder="name@company.com"
								required
								class="h-10 text-sm"
							/>
						</div>

						<div class="space-y-1.5">
							<Label for="password" class="text-muted-foreground text-xs font-semibold"
								>Password</Label
							>
							<Input
								id="password"
								type="password"
								bind:value={password}
								required
								class="h-10 text-sm"
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
							{loading ? 'Creating account...' : 'Create Account'}
						</Button>
					</form>
				</CardContent>

				<CardFooter class="flex flex-col space-y-3 border-t border-border p-5 text-center">
					<p class="text-muted-foreground text-xs">
						Already have an account?
						<a href="/login" class="font-semibold text-primary hover:underline"> Sign in </a>
					</p>
				</CardFooter>
			</Card>
		</div>
	</div>
</div>
