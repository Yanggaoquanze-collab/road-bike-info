<script lang="ts">
  let active = $state("upcoming");

  function setTab(tab: string) {
    active = tab;
  }
</script>

<div>
  <div class="flex gap-1 mb-6 bg-bg-secondary rounded-xl p-1 w-fit border border-surface-border">
    <button
      class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active === "upcoming" ? "bg-accent-blue text-white" : "text-text-secondary hover:text-text-primary"}`}
      onclick={() => setTab("upcoming")}
    >
      即将开始
    </button>
    <button
      class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active === "past" ? "bg-accent-blue text-white" : "text-text-secondary hover:text-text-primary"}`}
      onclick={() => setTab("past")}
    >
      历史赛事
    </button>
  </div>

  {#if active === "upcoming"}
    <slot name="upcoming" />
  {:else}
    <slot name="past" />
  {/if}
</div>
