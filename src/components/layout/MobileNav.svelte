<script lang="ts">
  import { NAV } from "../../config";

  let open = $state(false);

  function toggle() {
    open = !open;
    document.body.style.overflow = open ? "hidden" : "";
  }

  function close() {
    open = false;
    document.body.style.overflow = "";
  }
</script>

<button onclick={toggle} class="p-2 text-text-secondary hover:text-text-primary" aria-label="菜单">
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
    {#if open}
      <path d="M5 5l10 10M15 5L5 15" />
    {:else}
      <path d="M3 5h14M3 10h14M3 15h14" />
    {/if}
  </svg>
</button>

<!-- svelte-ignore a11y_no_noninteractive_element_interaction -->
{#if open}
  <div class="fixed inset-0 top-[57px] z-40" onclick={close} onkeydown={(e) => e.key === "Escape" && close()}>
    <div class="absolute inset-0 bg-bg-primary/95 backdrop-blur-sm" />
    <nav class="relative flex flex-col items-center gap-6 pt-16">
      {#each NAV as item}
        <a
          href={item.href}
          class="text-xl text-text-secondary hover:text-text-primary transition-colors"
          onclick={close}
        >
          {item.label}
        </a>
      {/each}
    </nav>
  </div>
{/if}
