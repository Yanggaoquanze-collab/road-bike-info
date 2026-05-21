<script lang="ts">
  let activeLabel = $state("");
  let activePos = $state({ x: 0, y: 0 });
  let tappedOnce = $state(false);
  let tappedTarget = $state("");

  function onEnter(e) {
    const g = e.currentTarget.closest(".hotspot-area");
    if (!g) return;
    const path = g.querySelector(".hotspot-bg");
    if (path) path.style.fill = "rgba(59, 130, 246, 0.12)";
    g.style.filter = "url(#glow)";
    activeLabel = g.dataset.label || "";
  }

  function onMove(e) {
    const svg = e.currentTarget.closest("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 420 / rect.height;
    activePos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY - 20,
    };
  }

  function onLeave(e) {
    const g = e.currentTarget.closest(".hotspot-area");
    if (!g) return;
    const path = g.querySelector(".hotspot-bg");
    if (path) path.style.fill = "none";
    g.style.filter = "";
    activeLabel = "";
  }

  function onClick(e) {
    const g = e.currentTarget.closest(".hotspot-area");
    if (!g) return;
    const section = g.dataset.section || "/";
    const category = g.dataset.category || "";
    const url = category ? `${section}?category=${encodeURIComponent(category)}` : section;
    window.location.href = url;
  }

  function onTouch(e) {
    const g = e.currentTarget.closest(".hotspot-area");
    if (!g) return;
    const targetId = g.id;
    if (!tappedOnce || tappedTarget !== targetId) {
      e.preventDefault();
      tappedOnce = true;
      tappedTarget = targetId;
      const path = g.querySelector(".hotspot-bg");
      if (path) path.style.fill = "rgba(59, 130, 246, 0.12)";
      g.style.filter = "url(#glow)";
      activeLabel = g.dataset.label || "";
      setTimeout(() => {
        tappedOnce = false;
        tappedTarget = "";
      }, 2000);
    } else {
      const section = g.dataset.section || "/";
      const category = g.dataset.category || "";
      const url = category ? `${section}?category=${encodeURIComponent(category)}` : section;
      window.location.href = url;
    }
  }

  function mount(svg) {
    if (!svg) return;
    const areas = svg.querySelectorAll(".hotspot-area");
    areas.forEach((area) => {
      if ("ontouchstart" in window) {
        area.addEventListener("touchstart", onTouch, { passive: false });
      } else {
        area.addEventListener("mouseenter", onEnter);
        area.addEventListener("mousemove", onMove);
        area.addEventListener("mouseleave", onLeave);
      }
      area.addEventListener("click", onClick);
    });
  }
</script>

<div class="relative max-w-2xl mx-auto">
  <div use:mount class="bike-svg-container">
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
