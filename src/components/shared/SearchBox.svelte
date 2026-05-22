<script lang="ts">
  let query = $state("");
  let results: { url: string; title: string; excerpt: string }[] = $state([]);
  let loading = $state(false);
  let open = $state(false);
  let initialized = $state(false);
  let unavailable = $state(false);
  let pagefindMod: any = null;

  async function init() {
    if (initialized || unavailable) return;
    try {
      const pagefindUrl = "/pagefind/pagefind.js";
      pagefindMod = await import(pagefindUrl);
      await pagefindMod.init();
      initialized = true;
    } catch {
      unavailable = true;
    }
  }

  async function search() {
    if (!pagefindMod || !query.trim()) {
      results = [];
      return;
    }
    loading = true;
    try {
      const pf = await pagefindMod.search(query.trim());
      const data = await Promise.all(pf.results.slice(0, 8).map((r: any) => r.data()));
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

  function toggle() {
    open = !open;
    if (open) {
      init();
      setTimeout(() => {
        const el = document.getElementById("search-input");
        el?.focus();
      }, 100);
    } else {
      query = "";
      results = [];
    }
  }

  function close() {
    open = false;
    query = "";
    results = [];
    document.body.style.overflow = "";
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  $effect(() => {
    if (query.trim()) search();
    else results = [];
  });

  $effect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  });
</script>

<button
  onclick={toggle}
  class="p-2 text-text-secondary hover:text-text-primary transition-colors"
  aria-label="搜索"
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
</button>

{#if open}
  <!-- svelte-ignore a11y_no_noninteractive_element_interaction -->
  <div class="fixed inset-0 z-50" onclick={close} onkeydown={onKeydown}>
    <div class="absolute inset-0 bg-bg-primary/90 backdrop-blur-sm" />
    <div class="relative flex flex-col items-center pt-[15vh] px-6">
      <div class="w-full max-w-xl">
        <div class="relative">
          <svg
            class="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            id="search-input"
            type="text"
            bind:value={query}
            placeholder="搜索新闻、赛事、维修、车型..."
            class="w-full pl-11 pr-4 py-3.5 bg-bg-secondary border border-surface-border rounded-xl text-text-primary text-lg placeholder:text-text-tertiary focus:outline-none focus:border-accent-blue transition-colors"
          />
        </div>

        <div class="mt-6">
          {#if loading}
            <p class="text-text-tertiary text-sm text-center">搜索中...</p>
          {:else if unavailable}
            <p class="text-text-tertiary text-sm text-center">搜索功能在生产构建后可用（运行 npm run build 后使用 npm run preview）</p>
          {:else if query && results.length === 0}
            <p class="text-text-tertiary text-sm text-center">未找到相关结果</p>
          {:else if results.length > 0}
            <ul class="space-y-2">
              {#each results as result}
                <li>
                  <a
                    href={result.url}
                    onclick={close}
                    class="block px-4 py-3 card-sm"
                  >
                    <p class="text-sm font-medium text-text-primary">{result.title}</p>
                    {#if result.excerpt}
                      <p class="text-xs text-text-tertiary mt-1 line-clamp-2">
                        {@html result.excerpt}
                      </p>
                    {/if}
                  </a>
                </li>
              {/each}
            </ul>
            <a
              href={`/search?q=${encodeURIComponent(query)}`}
              onclick={close}
              class="block mt-3 px-4 py-2.5 rounded-lg text-center text-sm text-accent-blue hover:bg-bg-secondary border border-transparent hover:border-accent-blue/30 transition-colors"
            >
              查看全部搜索结果 &rarr;
            </a>
          {/if}
        </div>

        <div class="mt-8 flex justify-center gap-1">
          <kbd class="px-2 py-0.5 text-[10px] text-text-tertiary bg-bg-secondary border border-surface-border rounded">ESC</kbd>
          <span class="text-[10px] text-text-tertiary self-center">关闭</span>
        </div>
      </div>
    </div>
  </div>
{/if}
