<script lang="ts">
  const quotes = [
    "骑行不是逃离生活，<br />而是重新感受风。",
    "从环法赛段到周末骑行，<br />我们记录真正值得被骑的路、车，与人。",
    "每一公里，<br />都是对速度的重新定义。",
    "最好的路线，<br />永远在下一条。",
    "风的方向，<br />就是骑行的方向。",
  ];

  let index = $state(0);
  let visible = $state(true);

  function rotate() {
    visible = false;
    setTimeout(() => {
      index = (index + 1) % quotes.length;
      visible = true;
    }, 600);
  }

  $effect(() => {
    const timer = setInterval(rotate, 5000);
    return () => clearInterval(timer);
  });
</script>

<div class="max-w-[1200px] mx-auto px-6 py-24 md:py-32">
  <p
    class="font-brand font-light text-text-primary leading-relaxed max-w-3xl transition-opacity duration-500"
    style="font-size: clamp(1.5rem, 3vw, 2.5rem); letter-spacing: 0.02em; line-height: 1.6; opacity: {visible ? 1 : 0};"
  >
    {@html quotes[index]}
  </p>
</div>
