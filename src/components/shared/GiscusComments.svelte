<script lang="ts">
  import { GISCUS } from "../../config";

  let ready = $state(false);

  $effect(() => {
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", GISCUS.repo);
    script.setAttribute("data-repo-id", GISCUS.repoId);
    script.setAttribute("data-category", GISCUS.category);
    script.setAttribute("data-category-id", GISCUS.categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "lazy");
    script.crossOrigin = "anonymous";
    script.async = true;

    const container = document.getElementById("giscus-container");
    if (container) {
      container.innerHTML = "";
      container.appendChild(script);
      ready = true;
    }
  });
</script>

<div class="mt-16 pt-8 border-t border-surface-border">
  <h3 class="text-lg font-semibold text-text-primary mb-6">评论</h3>

  {#if GISCUS.repo.includes("YOUR_GITHUB")}
    <div class="px-6 py-8 card-static text-center">
      <p class="text-text-secondary text-sm mb-3">评论功能尚未配置</p>
      <p class="text-text-tertiary text-xs">
        部署前请在 <code class="px-1 py-0.5 bg-bg-primary border border-surface-border rounded text-[11px]">src/config.ts</code> 中填入你的 GitHub 仓库信息和
        <a href="https://giscus.app/zh-CN" target="_blank" rel="noopener noreferrer" class="text-accent-blue hover:underline">Giscus</a> 配置
      </p>
    </div>
  {:else}
    <div id="giscus-container" class="min-h-[100px]">
      {#if !ready}
        <p class="text-text-tertiary text-sm">加载评论中...</p>
      {/if}
    </div>
  {/if}
</div>
