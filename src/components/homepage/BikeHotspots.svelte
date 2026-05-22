<script lang="ts">
  let activeLabel = $state("");
  let activePos = $state({ x: 0, y: 0 });
  let tappedTarget = $state("");

  function getArea(el: Element) {
    return el.closest(".hotspot-area") as HTMLElement | null;
  }

  function onEnter(e: Event) {
    const g = getArea(e.currentTarget as Element);
    if (!g) return;
    setGlow(g, true);
    activeLabel = g.dataset.label || "";
  }

  function onMove(e: MouseEvent) {
    const g = getArea(e.currentTarget as Element);
    if (!g) return;
    const wrapper = g.closest(".bike-svg-wrapper") as HTMLElement | null;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    activePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 40,
    };
  }

  function onLeave(e: Event) {
    const g = getArea(e.currentTarget as Element);
    if (!g) return;
    setGlow(g, false);
    activeLabel = "";
  }

  function setGlow(g: HTMLElement, on: boolean) {
    const bg = g.querySelector(".hotspot-bg") as SVGElement | null;
    if (bg) bg.setAttribute("fill", on ? "rgba(59, 130, 246, 0.15)" : "transparent");
    g.style.filter = on ? "url(#glow)" : "";
  }

  function navigate(g: HTMLElement) {
    const section = g.dataset.section || "/";
    const category = g.dataset.category || "";
    const url = category ? `${section}?category=${encodeURIComponent(category)}` : section;
    window.location.href = url;
  }

  function onClick(e: Event) {
    const g = getArea(e.currentTarget as Element);
    if (!g) return;
    if (tappedTarget === g.id) return;
    navigate(g);
  }

  function onTouchStart(e: TouchEvent) {
    const g = getArea(e.currentTarget as Element);
    if (!g) return;
    e.preventDefault();
    if (tappedTarget !== g.id) {
      tappedTarget = g.id;
      setGlow(g, true);
      activeLabel = g.dataset.label || "";
      setTimeout(() => {
        setGlow(g, false);
        activeLabel = "";
        tappedTarget = "";
      }, 2500);
    } else {
      tappedTarget = "";
      setGlow(g, false);
      activeLabel = "";
      navigate(g);
    }
  }

  function mount(container: HTMLElement) {
    const areas: Element[] = [];
    const raf = requestAnimationFrame(() => {
      container.querySelectorAll(".hotspot-area").forEach((area) => {
        areas.push(area);
        area.addEventListener("mouseenter", onEnter);
        area.addEventListener("mousemove", onMove as EventListener);
        area.addEventListener("mouseleave", onLeave);
        area.addEventListener("click", onClick);
        area.addEventListener("touchstart", onTouchStart, { passive: false });
      });
    });
    return {
      destroy() {
        cancelAnimationFrame(raf);
        areas.forEach((area) => {
          area.removeEventListener("mouseenter", onEnter);
          area.removeEventListener("mousemove", onMove as EventListener);
          area.removeEventListener("mouseleave", onLeave);
          area.removeEventListener("click", onClick);
          area.removeEventListener("touchstart", onTouchStart);
        });
      },
    };
  }
</script>

<div class="bike-svg-wrapper relative max-w-2xl mx-auto">
  <div use:mount class="bike-svg-container cursor-pointer">
    <slot />
  </div>

  {#if activeLabel}
    <div
      class="absolute pointer-events-none z-20 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-surface-border text-sm text-text-primary font-medium shadow-lg whitespace-nowrap"
      style="left: {activePos.x}px; top: {activePos.y}px"
    >
      {activeLabel}
    </div>
  {/if}
</div>
