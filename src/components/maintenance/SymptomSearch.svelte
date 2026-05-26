<script lang="ts">
  let query = $state("");

  $effect(() => {
    query = new URLSearchParams(window.location.search).get("q") || "";
  });

  function search() {
    if (query.trim()) {
      window.location.href = `/maintenance?q=${encodeURIComponent(query.trim())}`;
    }
  }

  function fill(q: string) {
    query = q;
    search();
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") search();
  }

  const keywords = ["异响", "刹车", "变速", "漏气", "跳齿"];
</script>

<div class="w-full max-w-xl">
  <div class="flex items-end gap-2">
    <input
      type="text"
      bind:value={query}
      onkeydown={onKeydown}
      placeholder="车子哪里不对劲？"
      class="flex-1 bg-transparent border-0 border-b border-surface-border rounded-none px-0 py-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-text-tertiary transition-colors text-base"
    />
    <button
      onclick={search}
      class="text-text-tertiary hover:text-text-secondary transition-colors pb-2 flex-shrink-0 text-lg"
      aria-label="搜索"
    >
      &rarr;
    </button>
  </div>
  <p class="mt-3 text-sm tracking-wider" style="color: rgba(0,0,0,.28); letter-spacing: .04em;">
    {#each keywords as kw, i}
      <button onclick={() => fill(kw)} class="hover:text-text-secondary transition-colors">{kw}</button>
      {#if i < keywords.length - 1}
        <span class="mx-1" style="color: rgba(0,0,0,.16);">·</span>
      {/if}
    {/each}
  </p>
</div>
