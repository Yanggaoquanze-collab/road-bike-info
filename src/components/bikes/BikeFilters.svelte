<script lang="ts">
  import { BIKE_CATEGORIES } from "../../lib/constants";

  let activeBrand = $state("");
  let activePriceRange = $state("");
  let activeCategory = $state("");

  const brands = ["Giant", "Merida", "Trek", "Specialized", "Canyon", "Cannondale", "Pinarello", "Cervelo", "Factor", "Wilier"];
  const priceRanges = [
    { value: "entry", label: "入门" },
    { value: "mid", label: "中端" },
    { value: "high", label: "高端" },
  ];
  const categories = Object.entries(BIKE_CATEGORIES);

  $effect(() => {
    const params = new URLSearchParams(window.location.search);
    activeBrand = params.get("brand") || "";
    activePriceRange = params.get("priceRange") || "";
    activeCategory = params.get("category") || "";
    applyFilters();
  });

  function applyFilters() {
    const cards = document.querySelectorAll<HTMLElement>("[data-bike-card]");
    cards.forEach((card) => {
      const brand = card.dataset.brand || "";
      const category = card.dataset.category || "";
      const priceRange = card.dataset.priceRange || "";
      const match =
        (!activeBrand || brand === activeBrand) &&
        (!activePriceRange || priceRange === activePriceRange) &&
        (!activeCategory || category === activeCategory);
      card.style.display = match ? "" : "none";
    });
  }

  function update() {
    const p = new URLSearchParams();
    if (activeBrand) p.set("brand", activeBrand);
    if (activePriceRange) p.set("priceRange", activePriceRange);
    if (activeCategory) p.set("category", activeCategory);
    const search = p.toString();
    const url = search ? `?${search}` : window.location.pathname;
    history.replaceState(null, "", url);
    applyFilters();
  }
</script>

<div class="flex flex-wrap gap-4 mb-8">
  <div class="flex-1 min-w-[200px]">
    <label class="block text-xs text-text-tertiary mb-2">品牌</label>
    <select
      bind:value={activeBrand}
      onchange={update}
      class="w-full px-3 py-2 bg-bg-secondary border border-surface-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-blue"
    >
      <option value="">全部品牌</option>
      {#each brands as brand}
        <option value={brand}>{brand}</option>
      {/each}
    </select>
  </div>

  <div class="flex-1 min-w-[150px]">
    <label class="block text-xs text-text-tertiary mb-2">价位</label>
    <div class="flex gap-1">
      <button
        onclick={() => { activePriceRange = ""; update(); }}
        class={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${activePriceRange === "" ? "bg-accent-blue border-accent-blue text-white" : "bg-bg-secondary border-surface-border text-text-secondary hover:text-text-primary"}`}
      >全部</button>
      {#each priceRanges as range}
        <button
          onclick={() => { activePriceRange = activePriceRange === range.value ? "" : range.value; update(); }}
          class={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${activePriceRange === range.value ? "bg-accent-blue border-accent-blue text-white" : "bg-bg-secondary border-surface-border text-text-secondary hover:text-text-primary"}`}
        >{range.label}</button>
      {/each}
    </div>
  </div>

  <div class="flex-1 min-w-[200px]">
    <label class="block text-xs text-text-tertiary mb-2">类型</label>
    <div class="flex flex-wrap gap-1">
      <button
        onclick={() => { activeCategory = ""; update(); }}
        class={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeCategory === "" ? "bg-accent-blue border-accent-blue text-white" : "bg-bg-secondary border-surface-border text-text-secondary hover:text-text-primary"}`}
      >全部</button>
      {#each categories as [value, label]}
        <button
          onclick={() => { activeCategory = activeCategory === value ? "" : value; update(); }}
          class={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeCategory === value ? "bg-accent-purple border-accent-purple text-white" : "bg-bg-secondary border-surface-border text-text-secondary hover:text-text-primary"}`}
        >{label}</button>
      {/each}
    </div>
  </div>
</div>
