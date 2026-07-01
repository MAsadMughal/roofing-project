<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import { CardHeader, CardContent } from '$lib/components/ui/card';
	import RoleSelect from '$lib/components/ui/select/select.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import AvatarRing from '$lib/components/AvatarRing.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';

	import Search from '@lucide/svelte/icons/search';
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import UserRound from '@lucide/svelte/icons/user-round';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { slide } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';

	const { data } = $props<{ data: any }>();

	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let role = $state('REP');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let inviteLink = $state<string | null>(null);
	let searchQuery = $state('');

	const roles = [
		{ value: 'OWNER', label: 'Owner' },
		{ value: 'REP', label: 'Sales Representative' },
		{ value: 'ESTIMATOR', label: 'Estimator' },
		{ value: 'PM', label: 'Project/Production Manager' },
		{ value: 'FOREMAN', label: 'Crew Lead / Foreman' },
		{ value: 'OFFICE', label: 'Office Staff / Coordinator' }
	];

	async function submit(e?: Event) {
		if (e) e.preventDefault();
		error = null;
		inviteLink = null;
		loading = true;
		try {
			const res = await fetch('/api/invites', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name, email, phone, role })
			});
			const out = await res.json().catch(() => ({}));
			if (!res.ok) {
				error = out.error || 'Failed to create invite';
				return;
			}
			inviteLink = out.inviteUrl ?? null;

			// Add new invite to data.invites if available
			if (out.invite && data.invites) {
				data.invites = [...data.invites, out.invite];
			}

			// Reset form
			name = '';
			email = '';
			phone = '';
			role = 'REP';

			// Refresh data
			await invalidateAll();
		} finally {
			loading = false;
		}
	}

	const fullName = (u: { firstName: string | null; lastName: string | null; email: string }) => {
		const nameParts = [u.firstName, u.lastName].filter(Boolean).join(' ');
		return nameParts || u.email;
	};

	const filteredUsers = $derived(
		data.users?.filter(
			(u: any) =>
				fullName(u).toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.email.toLowerCase().includes(searchQuery.toLowerCase())
		) || []
	);
</script>

<svelte:head>
	<title>Team Management | ROOFPILOT CRM</title>
</svelte:head>

<div class="container mx-auto max-w-5xl space-y-6 p-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Team Directory</h1>
			<p class="text-muted-foreground mt-0.5 text-sm">
				Manage your organization's user accounts and view member directories
			</p>
		</div>

		<Dialog.Root>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button variant="outline" class="gap-2 shadow-xs" {...props}>
						<UserPlus class="size-4" />
						Invite Colleague
					</Button>
				{/snippet}
			</Dialog.Trigger>

			<Dialog.Content class="rounded-2xl border border-border bg-card sm:max-w-md">
				<Dialog.Header>
					<Dialog.Title class="flex items-center gap-2">
						<UserPlus class="size-5 text-primary" />
						<span>Invite Team Member</span>
					</Dialog.Title>
					<Dialog.Description class="text-xs">
						Send an invite to join your workspace. They will receive a link to set up their account
						credentials.
					</Dialog.Description>
				</Dialog.Header>

				<form class="space-y-4 py-3" onsubmit={submit}>
					<div class="space-y-1.5">
						<Label for="name" class="text-xs font-semibold">Full Name</Label>
						<Input id="name" bind:value={name} placeholder="e.g. Jane Doe" class="h-9 text-sm" />
					</div>

					<div class="space-y-1.5">
						<Label for="email" class="text-xs font-semibold">Email Address</Label>
						<Input
							id="email"
							type="email"
							bind:value={email}
							required
							placeholder="e.g. jane@company.com"
							class="h-9 text-sm"
						/>
					</div>

					<div class="space-y-1.5">
						<Label for="phone" class="text-xs font-semibold">Phone Number</Label>
						<Input
							id="phone"
							bind:value={phone}
							placeholder="e.g. (555) 000-0000"
							class="h-9 text-sm"
						/>
					</div>

					<div class="space-y-1.5">
						<Label class="text-xs font-semibold">Workspace Role</Label>
						<RoleSelect
							class="h-9 w-full text-sm"
							items={roles}
							bind:value={role}
							placeholder="Select a role"
						/>
					</div>

					{#if error}
						<div class="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600">
							<p class="font-medium">{error}</p>
						</div>
					{/if}

					{#if inviteLink}
						<div class="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs">
							<p class="font-bold text-emerald-700">Invite created successfully!</p>
							<p
								class="mt-1 rounded border border-emerald-500/10 bg-card/65 p-1.5 font-mono break-all text-emerald-600 select-all"
							>
								{inviteLink}
							</p>
						</div>
					{/if}

					<Dialog.Footer class="gap-2 pt-2">
						<Dialog.Close>
							<Button variant="outline" size="sm">Cancel</Button>
						</Dialog.Close>
						<Button type="submit" size="sm" disabled={loading}>
							{#if loading}
								<span>Sending...</span>
							{:else}
								<span>Send Invitation</span>
							{/if}
						</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<!-- Directory Tabs -->
	<Tabs value="members" class="w-full">
		<TabsList
			class="grid w-full max-w-[280px] grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
		>
			<TabsTrigger value="members" class="py-1.5 text-xs">Active</TabsTrigger>
			<TabsTrigger value="invites" class="py-1.5 text-xs">Pending Invites</TabsTrigger>
		</TabsList>

		<!-- Active Directory Tab -->
		<TabsContent value="members" class="mt-4">
			<Card class="overflow-hidden border border-border bg-card shadow-xs">
				<CardHeader class="border-b border-border bg-slate-50/30 p-4 dark:bg-slate-900/10">
					<div class="relative max-w-sm">
						<Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							class="h-9 pl-9 text-sm"
							placeholder="Search colleagues..."
							bind:value={searchQuery}
						/>
					</div>
				</CardHeader>
				<CardContent class="p-0">
					<div class="divide-y divide-border">
						{#if filteredUsers.length > 0}
							{#each filteredUsers as user}
								<div
									class="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
									transition:slide
								>
									<div class="flex min-w-0 items-center gap-3.5">
										<AvatarRing name={fullName(user)} size="md" />

										<div class="min-w-0">
											<p class="truncate text-sm font-semibold text-foreground">{fullName(user)}</p>
											<div
												class="text-muted-foreground mt-0.5 flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:gap-3"
											>
												<span class="flex items-center gap-1 truncate">
													<Mail class="size-3.5 shrink-0" />
													<span class="truncate">{user.email}</span>
												</span>
												{#if user.phone}
													<span class="flex shrink-0 items-center gap-1">
														<Phone class="size-3.5" />
														<span>{user.phone}</span>
													</span>
												{/if}
											</div>
										</div>
									</div>

									<div class="flex shrink-0 items-center gap-3">
										<StatusBadge type="role" value={user.role} />
										<Button
											variant="ghost"
											size="sm"
											class="h-8 text-xs hover:bg-slate-100"
											href={`/user/profile/${user.id}`}
										>
											View Profile
										</Button>
									</div>
								</div>
							{/each}
						{:else}
							<EmptyState
								title="No Colleagues Found"
								description="Try refining your search filter."
								icon={UserRound}
							/>
						{/if}
					</div>
				</CardContent>
			</Card>
		</TabsContent>

		<!-- Pending Invites Tab -->
		<TabsContent value="invites" class="mt-4">
			<Card class="overflow-hidden border border-border bg-card shadow-xs">
				<CardContent class="p-0">
					<div class="divide-y divide-border">
						{#if data.invites?.length > 0}
							{#each data.invites as invite}
								<div
									class="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
									transition:slide
								>
									<div class="min-w-0">
										<p class="truncate text-sm font-semibold text-foreground">{invite.email}</p>
										<div class="text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
											<StatusBadge type="role" value={invite.role} />
											<span>•</span>
											<span>Expires {new Date(invite.expiresAt).toLocaleDateString()}</span>
										</div>
									</div>
									<div class="shrink-0">
										{#if invite.acceptedAt}
											<Badge
												class="border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400"
											>
												Accepted
											</Badge>
										{:else}
											<Badge
												class="border border-amber-500/20 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400"
											>
												Pending
											</Badge>
										{/if}
									</div>
								</div>
							{/each}
						{:else}
							<EmptyState
								title="No Pending Invites"
								description="Invite team members to populate this list."
								icon={UserPlus}
							/>
						{/if}
					</div>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
