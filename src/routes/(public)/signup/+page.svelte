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

<div class="relative flex min-h-screen flex-col items-center justify-center px-4">
	<div class="absolute top-8 flex items-center gap-2">
		<img
			src="https://dcassetcdn.com/design_img/3656568/47349/47349_20884214_3656568_d2aa512e_image.png"
			alt="Logo"
			class="h-10 w-auto drop-shadow-sm"
		/>
		<h1 class="text-xl font-semibold text-slate-800">RoofLink</h1>
	</div>
	<Card
		class="w-full hover:shadow-2xl max-w-md rounded-2xl border border-purple-100 bg-white/80 shadow-xl backdrop-blur-md dark:border-purple-900 dark:bg-[#1a1335]/80"
	>
		<CardHeader class="pb-2 text-center">
			<h2
				class="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-3xl font-semibold tracking-tight text-transparent"
			>
				Create Your Account
			</h2>
			<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
				Join our community to manage roofing projects effortlessly
			</p>
		</CardHeader>

		<CardContent class="pt-6">
			<form onsubmit={submit} class="space-y-5">
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<Label for="firstName" class="font-medium text-slate-700 dark:text-slate-300"
							>First name</Label
						>
						<Input id="firstName" bind:value={firstName} placeholder="John" class="w-full" />
					</div>
					<div>
						<Label for="lastName" class="font-medium text-slate-700 dark:text-slate-300"
							>Last name</Label
						>
						<Input id="lastName" bind:value={lastName} placeholder="Doe" class="w-full" />
					</div>
				</div>

				<div>
					<Label for="email" class="font-medium text-slate-700 dark:text-slate-300"
						>Email address</Label
					>
					<Input
						id="email"
						type="email"
						bind:value={email}
						placeholder="john@example.com"
						required
					/>
				</div>

				<div>
					<Label for="password" class="font-medium text-slate-700 dark:text-slate-300"
						>Password</Label
					>
					<Input id="password" type="password" bind:value={password} required />
				</div>

				{#if error}
					<div class="rounded-md bg-red-100 p-3 dark:bg-red-900/20">
						<p class="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
					</div>
				{/if}

				<Button
					type="submit"
					class="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 font-medium text-white shadow-md transition-all duration-300 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800"
					variant="default"
					size="lg"
					disabled={loading}
				>
					{loading ? 'Creating your account...' : 'Create account'}
				</Button>
			</form>
		</CardContent>

		<CardFooter
			class="flex flex-col space-y-3 border-t border-purple-100 p-6 dark:border-purple-900"
		>
			<p class="text-center text-sm text-slate-500 dark:text-slate-400">
				Already have an account?
				<a href="/login" class="font-medium text-purple-600 hover:underline dark:text-purple-400">
					Sign in
				</a>
			</p>
			<noscript>
				<p class="text-sm text-red-600 dark:text-red-400">Please enable JavaScript to sign up.</p>
			</noscript>
		</CardFooter>
	</Card>
</div>
