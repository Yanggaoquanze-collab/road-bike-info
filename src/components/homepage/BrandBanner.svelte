<script lang="ts">
  const images = [
    "/images/gallery/微信图片_20260525114847_825_248.jpg",
    "/images/gallery/微信图片_20260525114850_826_248.jpg",
    "/images/gallery/微信图片_20260525114852_827_248.jpg",
    "/images/gallery/微信图片_20260525114855_828_248.jpg",
    "/images/gallery/微信图片_20260525114856_829_248.jpg",
    "/images/gallery/微信图片_20260525114859_830_248.jpg",
    "/images/gallery/微信图片_20260525114900_831_248.jpg",
    "/images/gallery/微信图片_20260525114901_832_248.jpg",
    "/images/gallery/微信图片_20260525114903_833_248.jpg",
    "/images/gallery/微信图片_20260525114904_834_248.jpg",
    "/images/gallery/2a09ad35a8d64fe8fe8ef5cbeaa4083f.jpg",
    "/images/gallery/3958308321ea9c6d29df8f4a8949bccb.jpg",
    "/images/gallery/fcf1d82571a6706e93a45d7a3139dd66.jpg",
  ];

  let imgIdx = $state(0);
  let imgOn = $state(true);

  function rotateImage() {
    imgOn = false;
    setTimeout(() => {
      imgIdx = (imgIdx + 1) % images.length;
      imgOn = true;
    }, 600);
  }

  $effect(() => {
    const timer = setInterval(rotateImage, 4000);
    return () => clearInterval(timer);
  });
</script>

<div class="grid grid-cols-1 md:grid-cols-2">
  <div class="flex items-center px-8 py-20 md:px-16 md:py-24" style="background: #fafaf7;">
    <div class="max-w-md">
      <p
        class="font-brand font-light text-text-primary leading-relaxed"
        style="font-size: clamp(1.5rem, 3vw, 2.5rem); letter-spacing: 0.02em; line-height: 1.6;"
      >
        骑行不是逃离生活，<br />而是重新感受风。
      </p>
      <p class="font-display font-medium text-sm mt-10 tracking-[0.2em]" style="color: rgba(0,0,0,0.18);">
        RIDE TO FEEL THE WIND
      </p>
    </div>
  </div>

  <div class="overflow-hidden" style="min-height: 50vh;">
    <img
      src={images[imgIdx]}
      alt=""
      class="w-full h-full object-cover transition-opacity duration-500"
      style="opacity: {imgOn ? 1 : 0};"
    />
  </div>
</div>
