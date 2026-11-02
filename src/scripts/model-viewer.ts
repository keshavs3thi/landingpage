// 3D model viewers on workshop pages. This file stays tiny: three.js (model-scene.ts) is only fetched
// once a viewer is about to scroll into view, and never on devices without WebGL.

const viewers = document.querySelectorAll<HTMLElement>('[data-model-viewer]');

function webgl() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

if (viewers.length && webgl()) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        import('./model-scene')
          .then((m) => m.mount(e.target as HTMLElement))
          .catch((err) => {
            console.error('[model-viewer]', err);
            (e.target as HTMLElement).dataset.state = 'error';
          });
      }
    },
    { rootMargin: '200px' },
  );
  viewers.forEach((v) => io.observe(v));
} else {
  viewers.forEach((v) => (v.dataset.state = 'error'));
}
