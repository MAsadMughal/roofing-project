<script lang="ts">
  import type { PageData } from './$types';
  import Button from '$lib/components/ui/button/button.svelte';
  export let data: PageData;

  const profile = data.userProfile;
  const metrics = data.metrics;
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email;
</script>

<div class="mx-auto max-w-6xl p-6 space-y-6">
  <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <div class="size-16 rounded-full bg-primary/10 grid place-items-center text-primary font-semibold">
        {fullName.charAt(0).toUpperCase()}
      </div>
      <div>
        <h1 class="text-xl md:text-2xl font-semibold tracking-tight">{fullName}</h1>
        <p class="text-muted-foreground text-sm">{profile.role}</p>
        <p class="text-muted-foreground text-xs">{profile.email}</p>
      </div>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="sm">Message</Button>
      <Button size="sm">Assign Lead</Button>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div class="rounded-lg border bg-card p-4">
      <p class="text-xs text-muted-foreground">Leads Assigned</p>
      <p class="text-3xl font-semibold mt-1">{metrics.leadsAssigned}</p>
    </div>
    <div class="rounded-lg border bg-card p-4">
      <p class="text-xs text-muted-foreground">Inspections Performed</p>
      <p class="text-3xl font-semibold mt-1">{metrics.inspectionsPerformed}</p>
    </div>
    <div class="rounded-lg border bg-card p-4">
      <p class="text-xs text-muted-foreground">Assignments Involved</p>
      <p class="text-3xl font-semibold mt-1">{metrics.assignmentsInvolved}</p>
    </div>
  </div>

  <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 space-y-4">
      <div class="rounded-lg border bg-card p-4">
        <h2 class="font-medium">About</h2>
        <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-muted-foreground">Name</p>
            <p>{fullName}</p>
          </div>
          <div>
            <p class="text-muted-foreground">Email</p>
            <p>{profile.email}</p>
          </div>
          <div>
            <p class="text-muted-foreground">Role</p>
            <p>{profile.role}</p>
          </div>
          <div>
            <p class="text-muted-foreground">Member since</p>
            <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg border bg-card p-4">
        <h2 class="font-medium">Activity</h2>
        <p class="text-sm text-muted-foreground mt-2">Recent activity will appear here.</p>
      </div>
    </div>

    <div class="space-y-4">
      <div class="rounded-lg border bg-card p-4">
        <h3 class="font-medium">Quick actions</h3>
        <div class="mt-3 grid gap-2">
          <Button size="sm" variant="secondary">Add to Watchlist</Button>
          <Button size="sm" variant="outline">Schedule Inspection</Button>
          <Button size="sm" variant="ghost">View Assigned Leads</Button>
        </div>
      </div>

      <div class="rounded-lg border bg-card p-4">
        <h3 class="font-medium">Organization</h3>
        <p class="text-sm text-muted-foreground mt-2">Only visible to organization members.</p>
        <div class="mt-3 text-sm">
          <p>Contractor ID: {profile.contractorId ?? '—'}</p>
          <p>Customer ID: {profile.customerId ?? '—'}</p>
        </div>
      </div>
    </div>
  </section>
</div>


