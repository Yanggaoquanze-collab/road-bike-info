<script lang="ts">
  let activeLabel = $state("");
  let activePos = $state({ x: 0, y: 0 });
  let tappedTarget = $state("");
  let tapCount = $state(0);

  function onEnter(e: Event) {
    const g = (e.currentTarget as Element).closest(".hotspot-area") as HTMLElement | null;
    if (!g) return;
    setGlow(g, true);
    activeLabel = g.dataset.label || "";
  }

  function onMove(e: MouseEvent) {
    const g = (e.currentTarget as Element).closest(".hotspot-area") as HTMLElement | null;
    if (!g) return;
    const svg = g.closest("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 420 / rect.height;
    activePos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY - 20,
    };
  }

  function onLeave(e: Event) {
    const g = (e.currentTarget as Element).closest(".hotspot-area") as HTMLElement | null;
    if (!g) return;
    setGlow(g, false);
    activeLabel = "";
  }

  function setGlow(g: HTMLElement, on: boolean) {
    const path = g.querySelector(".hotspot-bg") as SVGElement | null;
    if (path) path.style.fill = on ? "rgba(59, 130, 246, 0.15)" : "none";
    g.style.filter = on ? "url(#glow)" : "";
  }

  function navigate(g: HTMLElement) {
    const section = g.dataset.section || "/";
    const category = g.dataset.category || "";
    const url = category ? `${section}?category=${encodeURIComponent(category)}` : section;
    window.location.href = url;
  }

  function onClick(e: Event) {
    const g = (e.currentTarget as Element).closest(".hotspot-area") as HTMLElement | null;
    if (!g) return;
    // 如果是触摸后的第一次点击（tap-to-reveal），不导航
    if (tapCount === 1 && tappedTarget === g.id) {
      return;
    }
    navigate(g);
  }

  function onTouchStart(e: TouchEvent) {
    const g = (e.currentTarget as Element).closest(".hotspot-area") as HTMLElement | null;
    if (!g) return;
    e.preventDefault();
    if (tappedTarget !== g.id) {
      tapCount = 1;
      tappedTarget = g.id;
      setGlow(g, true);
      activeLabel = g.dataset.label || "";
      // 点击其他区域时清除之前的
      setTimeout(() => {
        if (tapCount === 1) {
          setGlow(g, false);
          activeLabel = "";
          tapCount = 0;
          tappedTarget = "";
        }
      }, 2500);
    } else {
      // 第二次点击同一区域 — 导航
      tapCount = 2;
      setGlow(g, false);
      activeLabel = "";
      tappedTarget = "";
      navigate(g);
    }
  }

  function mount(container: HTMLElement) {
    if (!container) return;
    // 用 requestAnimationFrame 确保 slot 内容已渲染
    requestAnimationFrame(() => {
      const areas = container.querySelectorAll(".hotspot-area");
      areas.forEach((area) => {
        area.addEventListener("mouseenter", onEnter);
        area.addEventListener("mousemove", onMove as EventListener);
        area.addEventListener("mouseleave", onLeave);
        area.addEventListener("click", onClick);
        area.addEventListener("touchstart", onTouchStart, { passive: false });
      });
    });
  }
</script>

<div class="relative max-w-2xl mx-auto">
  <div use:mount class="bike-svg-container cursor-pointer">
    <slot />
  </div>

  {#if activeLabel}
    <div
      class="absolute pointer-events-none z-20 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-surface-border text-sm text-text-primary font-medium shadow-lg whitespace-nowrap"
      style="left: {(activePos.x / 800) * 100}%; top: {(activePos.y / 420) * 100}%"
    >
      {activeLabel}
    </div>
  {/if}
</div>
