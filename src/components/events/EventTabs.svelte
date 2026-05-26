<script lang="ts">
  let active = $state("upcoming");
</script>

<div>
  <div class="flex gap-6 mb-12">
    <button
      class="event-tab"
      data-active={active === "upcoming"}
      onclick={() => active = "upcoming"}
    >
      UPCOMING
    </button>
    <button
      class="event-tab"
      data-active={active === "past"}
      onclick={() => active = "past"}
    >
      PAST
    </button>
  </div>

  {#if active === "upcoming"}
    <slot name="upcoming" />
  {:else}
    <slot name="past" />
  {/if}
</div>

<style>
  .event-tab {
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 500;
    opacity: 0.35;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0 0 4px 0;
    border-bottom: 1px solid transparent;
    transition: opacity 0.18s ease, border-bottom-color 0.18s ease;
    font-family: var(--font-data);
    color: #111;
  }
  .event-tab:hover {
    opacity: 0.6;
  }
  .event-tab[data-active="true"] {
    opacity: 1;
    border-bottom-color: rgba(0, 0, 0, 0.2);
  }
</style>
