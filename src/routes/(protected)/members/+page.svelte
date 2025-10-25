<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Card from '$lib/components/ui/card/card.svelte';
	import { CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';
	import RoleSelect from '$lib/components/ui/select/select.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Search, Mail, Phone, UserPlus } from '@lucide/svelte/icons';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { slide } from 'svelte/transition';
	import { invalidateAll } from '$app/navigation';

	const { data } = $props();

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

	const roleColors:any = {
		OWNER: 'bg-cyan-100 text-cyan-800',
		REP: 'bg-blue-100 text-blue-800',
		ESTIMATOR: 'bg-green-100 text-green-800',
		PM: 'bg-purple-100 text-purple-800',
		FOREMAN: 'bg-orange-100 text-orange-800',
		OFFICE: 'bg-gray-100 text-gray-800'
	};

	async function submit() {
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
		const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
		return name || u.email;
	};

	const filteredUsers:any = $derived(
		data.users?.filter(
			(u) =>
				fullName(u).toLowerCase().includes(searchQuery.toLowerCase()) ||
				u.email.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function getRoleLabel(roleValue: string) {
		return roles.find((r) => r.value === roleValue)?.label || roleValue;
	}

</script>

<div class="container mx-auto max-w-6xl space-y-8 py-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Team Members</h1>
			<p class="text-muted-foreground mt-2">Manage your organization's team members and invites</p>
		</div>
		<Dialog.Root>
			<Dialog.Trigger>
				<Button variant="outline" class="gap-2" >
					<UserPlus class="size-4" />
					Invite Member
				</Button>
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[500px]">
				<Dialog.Header>
					<Dialog.Title>Invite Team Member</Dialog.Title>
					<Dialog.Description>
						Send an invitation to join your organization. They'll receive a link to set up their
						account.
					</Dialog.Description>
				</Dialog.Header>

				<form class="grid gap-4 py-4" on:submit|preventDefault={submit}>
					<div class="space-y-2">
						<Label for="name">Full name</Label>
						<Input id="name" bind:value={name} placeholder="Jane Doe" />
					</div>

					<div class="space-y-2">
						<Label for="email">Email address</Label>
						<Input id="email" type="email" bind:value={email} required placeholder="jane@example.com" />
					</div>

					<div class="space-y-2">
						<Label for="phone">Phone number</Label>
						<Input id="phone" bind:value={phone} placeholder="(555) 555-5555" />
					</div>

					<div class="space-y-2">
						<Label>Role</Label>
						<RoleSelect class="w-full" items={roles} bind:value={role} placeholder="Select a role" />
					</div>

					{#if error}
						<div class="bg-destructive/10 text-destructive rounded-md p-3">
							<p class="text-sm font-medium">{error}</p>
						</div>
					{/if}

					{#if inviteLink}
						<div class="rounded-md bg-emerald-600/10 p-3">
							<div class="flex items-center justify-between">
								<p class="text-sm font-medium text-emerald-700">Invite created successfully!</p>
							</div>
							<p class="mt-1 text-xs break-all text-emerald-600">{inviteLink}</p>
						</div>
					{/if}

					<Dialog.Footer>
						<Dialog.Close>
							<Button variant="outline">Cancel</Button>
						</Dialog.Close>
						<Button type="submit" disabled={loading}>
							{#if loading}
								<span class="mr-2 animate-spin">⏳</span>
								Sending invite...
							{:else}
								Send invite
							{/if}
						</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	<Tabs value="members" class="w-full">
		<TabsList class="grid w-full max-w-[400px] grid-cols-2">
			<TabsTrigger value="members">Active Members</TabsTrigger>
			<TabsTrigger value="invites">Invites</TabsTrigger>
		</TabsList>

		<TabsContent value="members" class="mt-6">
			<Card>
				<CardHeader>
					<div class="relative">
						<Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							class="pl-10"
							placeholder="Search members by name or email..."
							bind:value={searchQuery}
						/>
					</div>
				</CardHeader>
				<CardContent>
					<div class="divide-y rounded-md">
						{#if filteredUsers?.length}
							{#each filteredUsers as user}
								<div class="flex items-center justify-between py-4" transition:slide>
									<div class="flex items-center gap-4">
										<div
											class="grid size-10 place-items-center rounded-full bg-primary/10 font-semibold text-primary"
										>
											{fullName(user).charAt(0).toUpperCase()}
										</div>
										<div>
											<div class="font-medium">{fullName(user)}</div>
											<div class="text-muted-foreground mt-1 flex items-center gap-3 text-sm">
												<div class="flex items-center gap-1">
													<Mail class="size-3" />
													{user.email}
												</div>
												{#if user.phone}
													<div class="flex items-center gap-1">
														<Phone class="size-3" />
														{user.phone}
													</div>
												{/if}
											</div>
										</div>
									</div>
									<div class="flex items-center gap-4">
										<Badge class={roleColors[user.role]}>
											{getRoleLabel(user.role)}
										</Badge>
										<Button
											variant="ghost"
											size="sm"
											class="gap-2"
											href={`/user/profile/${user.id}`}
										>
											View Profile
										</Button>
									</div>
								</div>
							{/each}
						{:else}
							<div class="text-muted-foreground py-8 text-center">No team members found</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		</TabsContent>

		<TabsContent value="invites" class="mt-6">
			<Card>
				<CardContent class="pt-6">
					<div class="divide-y rounded-md">
						{#if data.invites?.length}
							{#each data.invites as invite}
								<div class="flex items-center justify-between py-4" transition:slide>
									<div>
										<div class="font-medium">{invite.email}</div>
										<div class="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
											<Badge  class={roleColors[invite.role]}>
												{getRoleLabel(invite.role)}
											</Badge>
											<span>•</span>
											<span>Expires {new Date(invite.expiresAt).toLocaleDateString()}</span>
										</div>
									</div>
									<Badge>
										{invite.acceptedAt ? 'Accepted' : 'Pending'}
									</Badge>
								</div>
							{/each}
						{:else}
							<div class="text-muted-foreground py-8 text-center">No pending invites</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
