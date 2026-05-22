<script lang="ts">
  import { onMount } from "svelte";

  let visible = $state(false);

  onMount(() => {
    const onScroll = () => {
      visible = window.scrollY > 500;
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  });

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
</script>

{#if visible}
  <button
    onclick={scrollToTop}
    aria-label="回到顶部"
    class="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-accent-blue text-white shadow-lg flex items-center justify-center transition-opacity duration-200 hover:opacity-90"
  >
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 12.5L10 7.5L5 12.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
{/if}
