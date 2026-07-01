<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import AvatarRing from '$lib/components/AvatarRing.svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import Plus from '@lucide/svelte/icons/plus';
	import Send from '@lucide/svelte/icons/send-horizontal';
	import UsersIcon from '@lucide/svelte/icons/users';
	import UserIcon from '@lucide/svelte/icons/user';
	import MailIcon from '@lucide/svelte/icons/mail';
	import CheckIcon from '@lucide/svelte/icons/check';
	import Link from '@lucide/svelte/icons/external-link';
	import MessageSquare from '@lucide/svelte/icons/message-square';

	const { data } = $props<{ chats: any[]; members: any[]; user: any }>();

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

	function getChatInitials(participants: any[]): string {
		return participants
			.filter((p: any) => p.id !== Number(user.id))
			.map((p: any) => p.name)
			.join(', ');
	}
</script>

<svelte:head>
	<title>Chats | ROOFPILOT CRM</title>
</svelte:head>

<div class="flex h-[calc(100vh-56px)] overflow-hidden border-t border-border">
	<!-- Sidebar: Chat List Panel -->
	<aside class="flex h-full w-80 shrink-0 flex-col border-r border-border bg-card md:w-96">
		<div class="flex items-center justify-between border-b border-border px-5 py-4">
			<div class="flex items-center gap-2 text-base font-bold tracking-tight text-foreground">
				<UsersIcon class="size-4.5 text-primary" />
				Conversations
			</div>
			<Button
				size="icon"
				variant="ghost"
				aria-label="Start new chat"
				class="size-8 rounded-lg"
				onclick={() => (showNew = true)}
			>
				<Plus class="size-4.5" />
			</Button>
		</div>

		<div class="border-b border-border bg-slate-50/50 px-4 py-3 dark:bg-slate-900/10">
			<div class="relative w-full">
				<Input
					class="h-9 w-full pr-8 pl-3 text-sm"
					placeholder="Search conversations..."
					bind:value={sidebarSearch}
					autocomplete="off"
				/>
			</div>
		</div>

		<!-- List scrollbody -->
		<div class="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
			{#if chats.length === 0}
				<div class="text-muted-foreground p-8 text-center text-sm">No chats found.</div>
			{:else}
				{#each chats.filter((c) => !sidebarSearch.trim() || c.participants.some((p: any) => p.name
								.toLowerCase()
								.includes(sidebarSearch.trim().toLowerCase()))) as c (c.id)}
					{@const isSelected = selectedChatId === c.id}
					{@const otherParticipants = c.participants.filter((p: any) => p.id !== Number(user.id))}
					{@const isOnline = otherParticipants.some((p: any) => p.online)}

					<button
						class="flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition-all {isSelected
							? 'border-border/40 bg-slate-100/70 shadow-xs dark:bg-slate-800'
							: 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}"
						onclick={async () => {
							selectedChatId = c.id;
							await loadMessages(c.id);
							await fetch(`/api/chats/${c.id}/read`, { method: 'POST' });
							const refreshed = await (await fetch('/api/chats')).json().catch(() => []);
							chats = refreshed;
						}}
					>
						<AvatarRing
							name={otherParticipants.map((p: any) => p.name).join(', ')}
							online={isOnline}
							size="sm"
							class="mt-0.5"
						/>

						<div class="min-w-0 flex-1">
							<div class="flex items-center justify-between gap-2">
								<span class="truncate text-sm font-semibold text-foreground">
									{otherParticipants.map((p: any) => p.name).join(', ')}
								</span>
								{#if c.last_message}
									<span class="text-muted-foreground shrink-0 text-[10px] font-medium">
										{formatLastMessageTime(c.last_message.at)}
									</span>
								{/if}
							</div>

							<div class="mt-1 flex items-center justify-between gap-2">
								{#if c.last_message}
									<p class="text-muted-foreground max-w-[180px] truncate text-xs md:max-w-[240px]">
										<span class="font-medium">{c.last_message.from.name}:</span>
										{c.last_message.text}
									</p>
								{:else}
									<p class="text-muted-foreground/60 text-xs italic">No messages yet</p>
								{/if}

								{#if c.unread > 0}
									<span
										class="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white"
									>
										{c.unread}
									</span>
								{/if}
							</div>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</aside>

	<!-- Messages Panel Window -->
	<section class="flex flex-1 flex-col bg-slate-50/20 dark:bg-slate-900/10">
		{#if selectedChatId}
			{@const currentChat = chats.find((c) => c.id === selectedChatId)}
			{@const otherParticipants =
				currentChat?.participants.filter((i: any) => i.id !== Number(user.id)) || []}
			{@const chatTitle = otherParticipants.map((p: any) => p.name).join(', ')}

			<!-- Chat Area Header -->
			<div
				class="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6"
			>
				<div class="flex min-w-0 items-center gap-3">
					<UserIcon class="size-4.5 shrink-0 text-primary" />
					<span class="max-w-[200px] truncate text-sm font-bold text-foreground md:max-w-md">
						{chatTitle}
					</span>

					<Button
						type="button"
						size="icon"
						variant="ghost"
						onclick={() => (showParticipantsModal = true)}
						class="size-8 rounded-lg border border-border"
						title="Show participant details"
					>
						<UsersIcon class="size-4" />
					</Button>
				</div>
			</div>

			<!-- Message body grid -->
			<div class="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
				{#if loadingMessages}
					<div class="text-muted-foreground flex h-full items-center justify-center text-sm">
						Loading conversation history...
					</div>
				{:else}
					{#if messages.length === 0}
						<div
							class="text-muted-foreground flex h-full flex-col items-center justify-center p-8 text-center text-sm"
						>
							<span class="mb-2 text-2xl">👋</span>
							<p class="font-semibold text-foreground">No messages yet</p>
							<p class="mt-1 max-w-[200px] text-xs">
								Be the first to say hello to this team segment.
							</p>
						</div>
					{/if}

					{#each messages as m}
						{@const isMe = m.from?.me}

						<div
							class="flex max-w-[70%] flex-col gap-1.5 {isMe
								? 'ml-auto items-end'
								: 'mr-auto items-start'}"
						>
							<!-- Sender header details -->
							<span class="text-muted-foreground px-1 text-[10px] font-semibold">
								{m.from.name} • {formatLastMessageTime(m.at)}
							</span>

							<!-- Chat message text content -->
							<div
								class="rounded-2xl border px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap shadow-xs {isMe
									? 'rounded-tr-xs border-primary/20 bg-primary text-primary-foreground'
									: 'rounded-tl-xs border-border bg-card text-foreground'}"
							>
								{m.text}
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Message Composer input form bar -->
			<form
				class="flex items-center gap-2.5 border-t border-border bg-card p-4"
				autocomplete="off"
				onsubmit={(e) => {
					e.preventDefault();
					sendMessage();
				}}
			>
				<Input
					class="h-10 flex-1 rounded-lg bg-slate-50/50 px-4 text-sm"
					placeholder="Type your message here..."
					bind:value={compose}
					autocomplete="off"
				/>
				<Button
					type="submit"
					size="sm"
					disabled={!compose.trim()}
					class="h-10 gap-1.5 rounded-lg px-4"
				>
					<Send class="size-4" />
					<span>Send</span>
				</Button>
			</form>
		{:else}
			<div class="flex flex-1 flex-col items-center justify-center p-8 text-center">
				<div
					class="text-muted-foreground mb-4 flex size-14 items-center justify-center rounded-2xl border border-border bg-card shadow-xs"
				>
					<MessageSquare class="text-muted-foreground size-6" />
				</div>
				<h3 class="text-base font-bold text-foreground">Select a chat</h3>
				<p class="text-muted-foreground mt-1.5 max-w-[240px] text-xs">
					Pick an existing conversation from the left sidebar panel or start a new chat with team
					members.
				</p>
				<Button size="sm" onclick={() => (showNew = true)} class="mt-4 gap-1.5">
					<Plus class="size-4" /> Start New Chat
				</Button>
			</div>
		{/if}
	</section>
</div>

<!-- Participant Details Modal -->
<Dialog.Root bind:open={showParticipantsModal}>
	<Dialog.Content class="max-w-md rounded-2xl border border-border bg-card">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<UsersIcon class="size-5 text-primary" />
				<span>Chat Participants</span>
			</Dialog.Title>
			<Dialog.Description class="text-xs">
				List of team members participating in this conversation thread.
			</Dialog.Description>
		</Dialog.Header>

		{#if selectedChatId}
			<div class="custom-scrollbar mt-4 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
				{#each chats.find((c) => c.id === selectedChatId)?.participants || [] as p (p.id)}
					<div
						class="flex items-center justify-between rounded-xl border border-border/50 p-2.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
					>
						<div class="flex min-w-0 items-center gap-3">
							<AvatarRing name={p.name} online={p.online} size="sm" />
							<div class="min-w-0">
								<div class="flex items-center gap-1.5 text-sm font-semibold text-foreground">
									<span class="truncate">{p.name}</span>
									{#if p.id === user.id}
										<span
											class="inline-flex items-center gap-0.5 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700"
										>
											me <CheckIcon class="size-2.5" />
										</span>
									{/if}
								</div>
								<div class="text-muted-foreground mt-0.5 flex items-center gap-1 truncate text-xs">
									<MailIcon class="size-3 shrink-0" />
									<span class="truncate">{p.email}</span>
								</div>
							</div>
						</div>
						<a
							href={`/user/profile/${p.id}`}
							class="text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-slate-50"
							title="Open user profile card"
						>
							<Link class="size-3.5" />
						</a>
					</div>
				{/each}
			</div>
		{/if}

		<Dialog.Footer class="mt-4">
			<Dialog.Close>
				<Button variant="outline" size="sm">Close</Button>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- New Chat Modal -->
<Dialog.Root bind:open={showNew}>
	<Dialog.Content class="max-w-md rounded-2xl border border-border bg-card">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Plus class="size-5 text-primary" />
				<span>Start a new chat</span>
			</Dialog.Title>
			<Dialog.Description class="text-xs">
				Select colleagues from your organization list to begin.
			</Dialog.Description>
		</Dialog.Header>

		<div class="custom-scrollbar mt-4 max-h-[50vh] space-y-2 overflow-y-auto py-2 pr-1">
			{#each members as m}
				<label
					class="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-slate-300 hover:shadow-xs dark:hover:border-slate-700"
				>
					<div class="flex items-center gap-3">
						<AvatarRing name={m.name} size="sm" />
						<div>
							<p class="text-sm font-semibold text-foreground">{m.name}</p>
							<p class="text-muted-foreground text-xs">{m.email}</p>
						</div>
					</div>
					<input
						type="checkbox"
						checked={selectedMembers.has(m.id)}
						onchange={() => toggleMember(m.id)}
						class="size-4.5 shrink-0 rounded border-border accent-primary"
						aria-label="Select member"
					/>
				</label>
			{/each}
		</div>

		<Dialog.Footer class="mt-4 gap-2">
			<Dialog.Close>
				<Button variant="outline" size="sm">Cancel</Button>
			</Dialog.Close>
			<Button size="sm" onclick={createChat} disabled={selectedMembers.size === 0}
				>Create Thread</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
