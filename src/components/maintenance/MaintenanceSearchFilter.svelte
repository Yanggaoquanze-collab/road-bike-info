<script lang="ts">
  let query = $state("");
  let resultCount = $state(0);

  $effect(() => {
    const q = new URLSearchParams(window.location.search).get("q") || "";
    query = q;
    const cards = document.querySelectorAll<HTMLElement>(".maintenance-card");
    if (!q.trim()) {
      cards.forEach((c) => (c.style.display = ""));
      resultCount = cards.length;
      return;
    }
    const keywords = q.trim().toLowerCase().split(/\s+/);
    let count = 0;
    cards.forEach((card) => {
      const text = (card.dataset.searchText || "").toLowerCase();
      const match = keywords.every((kw) => text.includes(kw));
      card.style.display = match ? "" : "none";
      if (match) count++;
    });
    resultCount = count;
  });
</script>

{#if query}
  <div class="mb-6 text-sm text-text-secondary">
    搜索 "<span class="text-text-primary font-medium">{query}</span>"，找到 {resultCount} 条结果
    {#if resultCount === 0}
      <span class="block mt-2 text-text-tertiary">没有匹配的结果，试试其他关键词</span>
    {/if}
  </div>
{/if}
