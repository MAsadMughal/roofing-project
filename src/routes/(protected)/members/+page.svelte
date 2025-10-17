<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte';
  import Input from '$lib/components/ui/input/input.svelte';
  import Label from '$lib/components/ui/label/label.svelte';
  import Card from '$lib/components/ui/card/card.svelte';
  import { CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';
  import * as Select from "$lib/components/ui/select";

  const { data } = $props();

  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let role = $state('REP');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let inviteLink = $state<string | null>(null);

  const roles = [
    { value: 'REP', label: 'Sales Representative' },
    { value: 'ESTIMATOR', label: 'Estimator' },
    { value: 'PM', label: 'Project/Production Manager' },
    { value: 'FOREMAN', label: 'Crew Lead / Foreman' },
    { value: 'OFFICE', label: 'Office Staff / Coordinator' }
  ];

  const triggerContent = $derived(roles.find((r) => r.value === role)?.label ?? 'Select a role');

  async function submit(e: SubmitEvent) {
    e.preventDefault();
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
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto max-w-3xl">
  <Card class="w-full border shadow-lg">
    <CardHeader>
      <div class="space-y-2">
        <h1 class="text-2xl font-bold tracking-tight">Add team member</h1>
        <p class="text-sm text-muted-foreground">Invite a sales rep or organization member. They will receive a link to set their password.</p>
      </div>
    </CardHeader>

    <CardContent>
      <form onsubmit={submit} class="grid grid-cols-1 gap-4">
        <div class="space-y-2">
          <Label for="name">Full name</Label>
          <Input id="name" bind:value={name} placeholder="Jane Doe" />
        </div>
        <div class="space-y-2">
          <Label for="email">Email</Label>
          <Input id="email" type="email" bind:value={email} required placeholder="jane@example.com" />
        </div>
        <div class="space-y-2">
          <Label for="phone">Phone</Label>
          <Input id="phone" bind:value={phone} placeholder="(555) 555-5555" />
        </div>

        <div class="space-y-2">
          <Label>Role</Label>
          <Select.Root bind:value={role}>
            <Select.Trigger class="w-full">{triggerContent}</Select.Trigger>
            <Select.Content>
              <Select.Group>
                {#each roles as r}
                  <Select.Item value={r.value}>{r.label}</Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>

        {#if error}
          <div class="rounded-md bg-destructive/10 p-3 text-destructive">
            <p class="text-sm font-medium">{error}</p>
          </div>
        {/if}

        {#if inviteLink}
          <div class="rounded-md bg-emerald-600/10 p-3 text-emerald-700">
            <p class="text-sm font-medium">Invite created. Share this link:</p>
            <a class="break-all text-xs underline" href={inviteLink}>{inviteLink}</a>
          </div>
        {/if}

        <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create invite'}</Button>
      </form>
    </CardContent>
    <CardFooter>
      <div class="w-full">
        <h2 class="mb-2 text-sm font-semibold text-muted-foreground">Recent invites</h2>
        <div class="divide-y rounded-md border">
          {#if data.invites?.length}
            {#each data.invites as inv}
              <div class="flex items-center justify-between p-3 text-sm">
                <div>
                  <div class="font-medium">{inv.email}</div>
                  <div class="text-xs text-muted-foreground">{inv.role} • Expires {new Date(inv.expiresAt).toLocaleString()}</div>
                </div>
                <div class="text-xs text-muted-foreground">{inv.acceptedAt ? 'Accepted' : 'Pending'}</div>
              </div>
            {/each}
          {:else}
            <div class="p-3 text-sm text-muted-foreground">No invites yet.</div>
          {/if}
        </div>
      </div>
    </CardFooter>
  </Card>
</div>


