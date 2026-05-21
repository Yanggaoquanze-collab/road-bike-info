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

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") search();
  }
</script>

<div class="w-full max-w-xl mx-auto">
  <div class="flex gap-3">
    <input
      type="text"
      bind:value={query}
      onkeydown={onKeydown}
      placeholder="描述你的症状，如：咯吱咯吱异响、刹车刹不住..."
      class="flex-1 px-5 py-3 bg-bg-secondary border border-surface-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue transition-colors"
    />
    <button
      onclick={search}
      class="px-6 py-3 bg-accent-blue text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
    >
      搜索
    </button>
  </div>
</div>
