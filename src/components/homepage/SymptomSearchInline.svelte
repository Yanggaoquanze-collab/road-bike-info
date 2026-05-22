<script lang="ts">
  let query = $state("");

  const commonSymptoms = [
    "咯吱咯吱异响",
    "刹车刹不住",
    "链条跳齿",
    "轮胎漏气",
    "变速不顺畅",
    "轮组偏摆",
  ];

  function search() {
    if (query.trim()) {
      window.location.href = `/maintenance?q=${encodeURIComponent(query.trim())}`;
    }
  }

  function selectSymptom(symptom: string) {
    window.location.href = `/maintenance?q=${encodeURIComponent(symptom)}`;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") search();
  }
</script>

<div class="max-w-2xl mx-auto">
  <div class="flex gap-3 mb-4">
    <input
      type="text"
      bind:value={query}
      onkeydown={onKeydown}
      placeholder="描述你遇到的问题，如：使劲蹬车咯吱咯吱响..."
      class="flex-1 px-5 py-3 bg-bg-secondary border border-surface-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue transition-colors text-sm"
    />
    <button
      onclick={search}
      class="px-6 py-3 bg-accent-blue text-white font-medium rounded-xl hover:opacity-90 transition-colors text-sm"
    >
      搜索
    </button>
  </div>
  <div class="flex flex-wrap justify-center gap-2">
    {#each commonSymptoms as symptom}
      <button
        onclick={() => selectSymptom(symptom)}
        class="px-3 py-1.5 rounded-full text-xs bg-bg-secondary border border-surface-border text-text-secondary hover:border-accent-blue hover:text-accent-blue transition-colors"
      >
        {symptom}
      </button>
    {/each}
  </div>
</div>
