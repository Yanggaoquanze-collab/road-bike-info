<script lang="ts">
  let query = $state("");
  let results: { url: string; title: string; excerpt: string }[] = $state([]);
  let loading = $state(false);
  let initialized = $state(false);
  let unavailable = $state(false);
  let total = $state(0);
  let pagefindMod: any = null;

  $effect(() => {
    const q = new URLSearchParams(window.location.search).get("q") || "";
    if (q) query = q;
    init();
  });

  async function init() {
    if (initialized || unavailable) return;
    try {
      const pagefindUrl = "/pagefind/pagefind.js";
      pagefindMod = await import(pagefindUrl);
      await pagefindMod.init();
      initialized = true;
      if (query.trim()) doSearch();
    } catch {
      unavailable = true;
    }
  }

  async function doSearch() {
    if (!pagefindMod || !query.trim()) {
      results = [];
      return;
    }
    loading = true;
    const q = query.trim();
    const url = new URL(window.location.href);
    url.searchParams.set("q", q);
    window.history.replaceState({}, "", url.toString());

    try {
      const pf = await pagefindMod.search(q);
      total = pf.results.length;
      const data = await Promise.all(pf.results.slice(0, 20).map((r: any) => r.data()));
      results = data.map((d: any) => ({
        url: d.url,
        title: d.meta?.title || d.url,
        excerpt: d.excerpt || "",
      }));
    } catch {
      results = [];
    }
    loading = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") doSearch();
  }

  function highlightExcerpt(excerpt: string) {
    return excerpt.replace(/<mark>/g, '<mark class="bg-accent-blue/30 text-text-primary rounded-sm px-0.5">').replace(/<\/mark>/g, '</mark>');
  }
</script>

<div class="max-w-2xl mx-auto">
  <div class="relative mb-8">
    <svg
      class="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
      width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
    <input
      type="text"
      bind:value={query}
      onkeydown={onKeydown}
      placeholder="搜索新闻、赛事、维修、车型..."
      class="w-full pl-12 pr-4 py-3.5 bg-bg-secondary border border-surface-border rounded-xl text-text-primary text-lg placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue transition-colors"
    />
  </div>

  {#if unavailable}
    <div class="text-center py-16">
      <div class="text-4xl mb-4">🔍</div>
      <p class="text-text-secondary text-lg mb-2">搜索功能暂不可用</p>
      <p class="text-text-tertiary text-sm">请运行 <code class="px-1.5 py-0.5 bg-bg-secondary border border-surface-border rounded text-xs">npm run build && npm run preview</code> 以启用搜索</p>
    </div>
  {:else if loading}
    <div class="text-center py-16">
      <p class="text-text-tertiary">搜索中...</p>
    </div>
  {:else if query && results.length > 0}
    <p class="text-text-tertiary text-sm mb-4">{total} 个结果</p>
    <ul class="space-y-3">
      {#each results as result}
        <li>
          <a
            href={result.url}
            class="block px-5 py-4 surface-lined group"
          >
            <p class="text-base font-medium text-text-primary group-hover:text-accent-blue transition-colors">
              {result.title}
            </p>
            {#if result.excerpt}
              <p class="text-sm text-text-tertiary mt-1.5 leading-relaxed">
                {@html highlightExcerpt(result.excerpt)}
              </p>
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  {:else if query}
    <div class="text-center py-16">
      <div class="text-4xl mb-4">🤷</div>
      <p class="text-text-secondary">未找到与 "<span class="text-text-primary">{query}</span>" 相关的结果</p>
      <p class="text-text-tertiary text-sm mt-2">试试其他关键词</p>
    </div>
  {:else}
    <div class="text-center py-16">
      <div class="text-4xl mb-4">🔍</div>
      <p class="text-text-secondary text-lg mb-2">搜索全站内容</p>
      <p class="text-text-tertiary text-sm">输入关键词搜索新闻、赛事、维修指南、车型数据</p>
    </div>
  {/if}
</div>
