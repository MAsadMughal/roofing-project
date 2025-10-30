<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import Plus from '@lucide/svelte/icons/plus';
	import Send from '@lucide/svelte/icons/send-horizontal';
	import UsersIcon from '@lucide/svelte/icons/users';
	import UserIcon from '@lucide/svelte/icons/user';
	import MailIcon from '@lucide/svelte/icons/mail';
	import CheckIcon from '@lucide/svelte/icons/check';
	import Link from '@lucide/svelte/icons/external-link';

	const { data } = $props<{ chats: any[]; members: any[] }>();

	let chats = $state<Array<any>>(data.chats ?? []);
	let members = $state<Array<any>>(data.members ?? []);
	let selectedChatId: number | null = $state(chats[0]?.id ?? null);
	let messages = $state<Array<any>>([]);
	let loadingMessages = $state(false);
	let compose = $state('');
	let user = $state(data.user);
	let sidebarSearch = $state('');
	let showParticipantsModal = $state(false);

	// Helper to format time
	function formatLastMessageTime(ts: string) {
		if (!ts) return '';
		const d = new Date(ts);
		const now = new Date();
		// Today
		if (
			d.getDate() === now.getDate() &&
			d.getMonth() === now.getMonth() &&
			d.getFullYear() === now.getFullYear()
		) {
			return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/^0/, '');
		}
		// This year
		if (d.getFullYear() === now.getFullYear()) {
			return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
		}
		// Other years
		return d.toLocaleDateString([], { year: '2-digit', month: 'short', day: 'numeric' });
	}

	async function loadMessages(chatId: number) {
		loadingMessages = true;
		try {
			const res = await fetch(`/api/chats/${chatId}/messages`);
			messages = (await res.json().catch(() => [])) ?? [];
		} finally {
			loadingMessages = false;
		}
	}

	$effect(() => {
		if (browser && selectedChatId) {
			(async () => {
				await loadMessages(selectedChatId!);
				await fetch(`/api/chats/${selectedChatId}/read`, { method: 'POST' });
				const refreshed = await (await fetch('/api/chats')).json().catch(() => []);
				chats = refreshed;
			})();
		}
	});

	// Lightweight polling and heartbeat without sockets
	$effect(() => {
		if (!browser) return;
		const chatsInterval = setInterval(async () => {
			const refreshed = await (await fetch('/api/chats')).json().catch(() => []);
			chats = refreshed;
		}, 20000);
		const hbInterval = setInterval(async () => {
			await fetch('/api/users/heartbeat', { method: 'POST' });
		}, 60000);
		return () => {
			clearInterval(chatsInterval);
			clearInterval(hbInterval);
		};
	});

	async function sendMessage() {
		if (!selectedChatId || !compose.trim()) return;
		const text = compose;
		compose = '';
		const res = await fetch(`/api/chats/${selectedChatId}/messages`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ text })
		});
		if (res.ok) {
			await loadMessages(selectedChatId);
			const refreshed = await (await fetch('/api/chats')).json().catch(() => []);
			chats = refreshed;
		} else {
			alert('Failed to send');
		}
	}

	// New chat modal
	let showNew = $state(false);
	let selectedMembers = $state<Set<number>>(new Set());
	function toggleMember(id: number) {
		if (selectedMembers.has(id)) selectedMembers.delete(id);
		else selectedMembers.add(id);
		selectedMembers = new Set(selectedMembers);
	}
	async function createChat() {
		if (selectedMembers.size === 0) return;
		const participant_ids = Array.from(selectedMembers);
		const res = await fetch('/api/chats', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ participant_ids })
		});
		if (res.ok) {
			showNew = false;
			selectedMembers = new Set();
			const refreshed = await (await fetch('/api/chats')).json().catch(() => []);
			chats = refreshed;
			selectedChatId = chats[0]?.id ?? null;
		}
	}

	// For participant modal navigation
	function goToProfile(userId: number) {
		window.location.href = `/user/profile/${userId}`;
	}
</script>

<svelte:head>
	<title>Chats</title>
</svelte:head>

<div class="flex h-[calc(100vh-130px)] gap-6 md:gap-8">
	<!-- Sidebar: Chats -->
	<aside
		class="flex h-full w-[330px] min-w-[265px] shrink-0 flex-col rounded-2xl border bg-white shadow-lg dark:bg-slate-900"
	>
		<div class="flex items-center justify-between border-b px-5 py-4">
			<div class="text-lg font-bold tracking-tight text-primary flex items-center gap-1">
				<UsersIcon class="size-5 mr-2" />
				Chats
			</div>
			<Button
				size="icon"
				variant="ghost"
				aria-label="Start new chat"
				class="rounded-full"
				onclick={() => (showNew = true)}
			>
				<Plus class="size-5" />
			</Button>
		</div>
		<div class="border-b px-4 py-3">
			<Input
				class="w-full"
				placeholder="Search chats…"
				bind:value={sidebarSearch}
				autocomplete="off"
				inputmode="search"
			/>
		</div>
		<div class="custom-scrollbar flex-1 overflow-y-auto bg-background/50 p-0">
			{#if chats.length === 0}
				<div class="text-muted-foreground p-5 text-center text-sm">No chats yet</div>
			{:else}
				<ul class="divide-y divide-border">
					{#each chats.filter((c) => !sidebarSearch.trim() || c.participants.some((p: any) => p.name
									.toLowerCase()
									.includes(sidebarSearch.trim().toLowerCase()))) as c (c.id)}
						<li>
							<button
								class={`flex w-full items-center gap-3 rounded-xl px-5 py-4
                                transition-colors focus:outline-none focus-visible:ring-2
                                ${
																	selectedChatId === c.id
																		? 'bg-accent/70 font-bold shadow'
																		: 'hover:bg-secondary/30'
																}`}
								aria-selected={selectedChatId === c.id}
								onclick={async () => {
									selectedChatId = c.id;
									await loadMessages(c.id);
									await fetch(`/api/chats/${c.id}/read`, { method: 'POST' });
									const refreshed = await (await fetch('/api/chats')).json().catch(() => []);
									chats = refreshed;
								}}
							>
								<div
									class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400/10 to-violet-300/10 text-lg font-semibold text-indigo-600"
								>
									<span>
										{c.participants
											.filter((p: any) => p.id !== Number(user.id))
											.map((p: any) =>
												p.name
													.split(' ')
													.map((n: string) => n[0])
													.join('')
											)
											.join(', ')
											.slice(0, 2)
											.toUpperCase()}
									</span>
								</div>
								<div class="flex min-w-0 flex-grow flex-col justify-center">
									<div class="flex min-w-0 items-center justify-between">
										<span class="truncate text-base font-semibold flex items-center">
											<UserIcon class="size-4 mr-1 text-indigo-500 shrink-0" />
											<span class="truncate">
											{c.participants
												.filter((p: any) => {
													return p.id !== Number(user.id);
												})
												.map((p: any) => p.name)
												.join(', ')}
											</span>
										</span>
										{#if c.last_message}
											<span class="text-muted-foreground ml-3 flex-shrink-0 text-xs font-medium">
												{formatLastMessageTime(c.last_message.at)}
											</span>
										{/if}
									</div>
									<div class="mt-1 flex min-w-0 items-center gap-2">
										{#if c.last_message}
											<span class="text-muted-foreground truncate text-[13px]">
												<span class="font-medium">{c.last_message.from.name}:</span>
												{c.last_message.text}
											</span>
										{:else}
											<span class="text-muted-foreground text-xs italic">No messages yet</span>
										{/if}
									</div>
								</div>
								<div class="ml-2 flex items-center gap-2">
									{#if c.participants.some((p: any) => p.online)}
										<span class="inline-block h-2.5 w-2.5 rounded-full bg-green-500" title="Online"
										></span>
									{/if}
									{#if c.unread > 0}
										<span
											class="inline-flex min-w-6 justify-center rounded-full bg-primary/80 px-1.5 py-0.5 text-xs font-bold text-white"
											>{c.unread}</span
										>
									{/if}
								</div>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</aside>

	<!-- Messages Pane -->
	<section
		class="flex min-w-0 grow flex-col rounded-2xl border bg-white shadow-lg dark:bg-slate-900"
	>
		<div
			class="flex items-center rounded-t-2xl border-b bg-gradient-to-r from-indigo-50/80 to-violet-50/70 px-8 py-4 dark:from-indigo-950/50 dark:to-violet-950/40"
		>
			<!-- Participant names with modal trigger and lucide icon -->
			<div class="flex-1 flex items-center gap-2 min-w-0">
				<UserIcon class="size-5 text-indigo-700 shrink-0" />
				<span class="truncate text-lg font-semibold text-primary max-w-[60vw]">
				{#if selectedChatId}
					{chats
						.find((c) => c.id === selectedChatId)
						?.participants
						.filter((i: any) => i.id !== Number(user.id))
						.map((p: any) => p.name)
						.join(', ') || 'Select a chat'}
				{:else}
					Select a chat
				{/if}
				</span>
				<!-- icon btn to show modal -->
				{#if selectedChatId}
					<Button
						type="button"
						size="icon"
						variant="ghost"
						aria-label="Show participants"
						title="Show participant details"
						onclick={() => showParticipantsModal = true}
						class="ml-2 rounded-full border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
					>
						<UsersIcon class="size-5" />
					</Button>
				{/if}
			</div>
		</div>
		<div
			class="custom-scrollbar flex min-h-0 grow flex-col gap-2 overflow-y-auto bg-background/70 p-8"
		>
			{#if !selectedChatId}
				<div class="text-muted-foreground mt-16 flex flex-col items-center text-center text-base">
					<svg width="48" height="48" fill="none" class="mb-4 opacity-25" viewBox="0 0 24 24"
						><rect
							x="4"
							y="4"
							width="16"
							height="14"
							rx="2"
							fill="currentColor"
							class="text-indigo-300"
						/><rect
							x="8"
							y="18"
							width="8"
							height="2"
							rx="1"
							fill="currentColor"
							class="text-indigo-400"
						/></svg
					>
					<div>Pick a chat to start messaging.</div>
				</div>
			{:else if loadingMessages}
				<div class="text-muted-foreground mt-16 text-center text-base">Loading…</div>
			{:else}
				{#if messages.length === 0}
					<div class="text-muted-foreground mt-16 text-center text-base">
						No messages yet – say hello 👋
					</div>
				{/if}
				{#each messages as m}
					<div
						class="mb-0.5 max-w-[66%] min-w-[100px] rounded-xl border border-border bg-background px-4 py-2.5 text-[15px] shadow-sm
                        {m.from?.me
							? 'ml-auto border-primary/40 bg-gradient-to-br from-primary/20 to-indigo-100 dark:from-primary/30 dark:to-gray-900'
							: 'bg-white dark:bg-slate-800'}
                    "
					>
						<div class="mb-1 flex items-center gap-1 text-xs font-bold text-primary/90">
							{m.from.name}
							<span class="text-muted-foreground mx-1 font-normal">•</span>
							<span class="text-muted-foreground font-normal">{formatLastMessageTime(m.at)}</span>
						</div>
						<div class="leading-relaxed break-words whitespace-pre-wrap">{m.text}</div>
					</div>
				{/each}
			{/if}
		</div>
		<form
			class="flex gap-2 rounded-b-2xl border-t bg-background/80 px-8 py-5"
			autocomplete="off"
			onsubmit={(e) => {
				e.preventDefault();
				sendMessage();
			}}
		>
			<Input
				class="grow rounded-full px-5 py-3 text-base shadow-inner"
				placeholder="Type a message…"
				bind:value={compose}
				autocomplete="off"
			/>
			<Button
				type="submit"
				size="lg"
				disabled={!compose.trim()}
				class="gap-2 rounded-full px-6 py-3 shadow-lg transition-all duration-75 active:scale-95"
			>
				<Send class="size-5" />
				<span class="hidden sm:inline">Send</span>
			</Button>
		</form>

		<!-- Participants Modal -->
		<Dialog.Root bind:open={showParticipantsModal}>
			<Dialog.Content class="max-w-lg">
				<Dialog.Header>
					<Dialog.Title>
						<UsersIcon class="size-6 mr-1.5 align-middle inline" /> Participants
					</Dialog.Title>
					<Dialog.Description>Click a participant to view their profile.</Dialog.Description>
				</Dialog.Header>
				{#if selectedChatId}
					<div class="max-h-[65vh] overflow-y-auto pr-2">
						<ul class="divide-y">
							{#each chats.find(c => c.id === selectedChatId)?.participants || [] as p (p.id)}
                                <li
                                    class="flex items-center py-4 px-1 gap-4 hover:bg-accent/60 transition rounded-lg cursor-pointer group"
                                    title="Open profile"
                                >
									<div class="flex-shrink-0">
										<UserIcon class="size-7 text-violet-700 bg-violet-50 rounded-full p-1 border border-violet-200" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="font-semibold text-base truncate flex items-center gap-1">
											{p.name}
											{#if p.id === user.id}
												<span class="text-xs bg-emerald-100 text-emerald-700 px-1.5 rounded ml-2 flex items-center gap-0.5">
													me
													<CheckIcon class="size-3 ml-1" />
												</span>
											{/if}
										</div>
										<div class="text-slate-500 text-sm flex items-center gap-1 truncate">
											<MailIcon class="size-4" /> {p.email}
										</div>
										{#if p.online}
											<span class="inline-flex items-center text-xs mt-0.5 text-green-600 gap-1">
												<span class="inline-block h-2 w-2 rounded-full bg-green-500"></span> Online
											</span>
										{:else}
											<span class="inline-flex items-center text-xs mt-0.5 text-slate-400 gap-1">
												<span class="inline-block h-2 w-2 rounded-full bg-gray-300"></span> Offline
											</span>
										{/if}
									</div>
									<a
										href={`/user/profile/${p.id}`}
										target="_blank"
										rel="noopener noreferrer"
										class="ml-2 rounded-full border border-slate-200 bg-white hover:bg-indigo-50 dark:border-slate-700 transition group-hover:bg-indigo-100 flex items-center justify-center"
										title="Go to profile"
										tabindex="-1"
									>
										<Link class="size-4" />
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				<Dialog.Footer class="mt-4 flex justify-end">
					<Dialog.Close>
						<Button variant="outline">Close</Button>
					</Dialog.Close>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</section>
</div>

<!-- New Chat Modal -->
<Dialog.Root bind:open={showNew}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>
				<Plus class="size-5 mr-1.5 align-middle inline" /> Start a new chat
			</Dialog.Title>
			<Dialog.Description>
				Select people from your organization
			</Dialog.Description>
		</Dialog.Header>
		<div class="max-h-[60vh] space-y-2 overflow-y-auto py-2">
			{#each members as m}
				<label
					class="flex cursor-pointer items-center justify-between rounded-xl border bg-background/40 p-3 text-base transition hover:border-primary hover:shadow-md gap-2"
				>
					<div class="flex items-center gap-2">
						<UserIcon class="size-5 text-indigo-500" />
						<div>
							<div class="font-medium">{m.name}</div>
							<div class="text-muted-foreground text-xs">{m.email}</div>
						</div>
					</div>
					<input
						type="checkbox"
						checked={selectedMembers.has(m.id)}
						onchange={() => toggleMember(m.id)}
						class="size-5 rounded accent-indigo-600"
						aria-label="Select member"
					/>
				</label>
			{/each}
		</div>
		<Dialog.Footer class="mt-3 flex justify-end gap-2">
			<Dialog.Close>
				<Button variant="outline">Cancel</Button>
			</Dialog.Close>
			<Button onclick={createChat} disabled={selectedMembers.size === 0}>Create</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 9px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: linear-gradient(120deg, #a5b4fc55, #dddde090);
		border-radius: 6px;
	}
	.custom-scrollbar:hover::-webkit-scrollbar-thumb {
		background: linear-gradient(120deg, #818cf888, #dddde0b0);
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar {
		scrollbar-color: #a5b4fc44 transparent;
		scrollbar-width: thin;
	}
</style>
