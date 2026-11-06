// Hero interactions: accent background, active/dim state, cursor tilt, soon-pulse, touch taps.
// Visual states live in hero.css; this file only toggles classes and a few CSS variables.

const MAX_TILT = 8; // degrees
const EASE = 0.12; // per-frame lerp toward the target tilt
const SPOT_EASE = 0.08; // slower lerp so the spotlight trails the cursor

const root = document.documentElement;
const stage = document.querySelector<HTMLElement>('[data-stage]');
if (stage) init(stage);

function init(stage: HTMLElement) {
  const wraps = Array.from(stage.querySelectorAll<HTMLElement>('[data-obj]'));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let active: HTMLElement | null = null;

  const activate = (wrap: HTMLElement) => {
    if (active === wrap) return;
    active?.classList.remove('is-active');
    active = wrap;
    wrap.classList.add('is-active');
    stage.dataset.active = wrap.dataset.id;
    root.style.setProperty('--bg', wrap.dataset.bg ?? '');
    stage.style.setProperty('--spot-accent', wrap.dataset.accent ?? '');
  };

  const deactivate = (wrap?: HTMLElement) => {
    if (!active || (wrap && wrap !== active)) return;
    active.classList.remove('is-active');
    active = null;
    delete stage.dataset.active;
    root.style.removeProperty('--bg'); // --spot-accent stays so the accent layer fades out in colour
  };

  // When hover ends, fall back to whichever object holds keyboard focus.
  const restoreFocused = () => {
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.matches('.obj:focus-visible')) {
      const wrap = focused.closest<HTMLElement>('[data-obj]');
      if (wrap) return activate(wrap);
    }
    deactivate();
  };

  const pulse = (wrap: HTMLElement) => {
    const label = wrap.querySelector<HTMLElement>('.label');
    if (!label) return;
    label.classList.remove('pulse');
    void label.offsetWidth; // restart the animation
    label.classList.add('pulse');
  };

  for (const wrap of wraps) {
    const obj = wrap.querySelector<HTMLElement>('.obj')!;
    const tilt = wrap.querySelector<HTMLElement>('.tilt')!;
    let x = 0, y = 0, targetX = 0, targetY = 0, frame = 0;

    const step = () => {
      x += (targetX - x) * EASE;
      y += (targetY - y) * EASE;
      const settled = Math.abs(targetX - x) < 0.01 && Math.abs(targetY - y) < 0.01;
      if (settled) (x = targetX), (y = targetY);
      tilt.style.setProperty('--tx', `${x.toFixed(3)}deg`);
      tilt.style.setProperty('--ty', `${y.toFixed(3)}deg`);
      frame = settled ? 0 : requestAnimationFrame(step);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };

    obj.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') activate(wrap);
    });

    obj.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || !finePointer.matches || reduceMotion.matches) return;
      const r = obj.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      // Turn the face toward the cursor.
      targetX = -ny * MAX_TILT;
      targetY = nx * MAX_TILT;
      kick();
    });

    obj.addEventListener('pointerleave', (e) => {
      targetX = targetY = 0;
      kick();
      if (e.pointerType !== 'touch' && active === wrap) restoreFocused();
    });

    obj.addEventListener('focus', () => activate(wrap));
    obj.addEventListener('blur', () => deactivate(wrap));

    obj.addEventListener('click', (e) => {
      activate(wrap);
      if (wrap.dataset.status === 'soon') {
        e.preventDefault();
        pulse(wrap);
      }
    });

    wrap.querySelector('.label')?.addEventListener('animationend', (e) => {
      (e.currentTarget as HTMLElement).classList.remove('pulse');
    });
  }

  // Tap/click elsewhere returns to neutral.
  document.addEventListener('pointerdown', (e) => {
    if (!(e.target instanceof Element) || !e.target.closest('[data-obj] .obj')) deactivate();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !active) return;
    (document.activeElement as HTMLElement | null)?.blur();
    deactivate();
  });

  initSpot(stage, reduceMotion, finePointer);

  // Touch layout: scrolling the active object out of view returns to neutral.
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target === active && entry.intersectionRatio < 0.4) deactivate();
      }
    },
    { threshold: [0, 0.4] },
  );
  wraps.forEach((wrap) => io.observe(wrap));
}

// Spotlight trails the cursor across the stage and drifts back to its CSS rest point on leave.
// Pointer devices only; touch, narrow layouts and reduced motion keep it at rest.
function initSpot(stage: HTMLElement, reduceMotion: MediaQueryList, finePointer: MediaQueryList) {
  const spot = stage.querySelector<HTMLElement>('.spot');
  if (!spot) return;
  const wide = matchMedia('(min-width: 701px)');
  let x = 0, y = 0, targetX = 0, targetY = 0, frame = 0;

  const step = () => {
    x += (targetX - x) * SPOT_EASE;
    y += (targetY - y) * SPOT_EASE;
    const settled = Math.abs(targetX - x) < 0.5 && Math.abs(targetY - y) < 0.5;
    if (settled) (x = targetX), (y = targetY);
    spot.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    frame = settled ? 0 : requestAnimationFrame(step);
  };
  const kick = () => {
    if (!frame) frame = requestAnimationFrame(step);
  };

  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || !finePointer.matches || !wide.matches || reduceMotion.matches) return;
    // Offset from the rest point (spot centre with translate removed).
    const r = spot.getBoundingClientRect();
    targetX = e.clientX - (r.left + r.width / 2 - x);
    targetY = e.clientY - (r.top + r.height / 2 - y);
    kick();
  });

  const rest = () => {
    targetX = targetY = 0;
    kick();
  };
  stage.addEventListener('pointerleave', rest);
  reduceMotion.addEventListener('change', rest);
  wide.addEventListener('change', rest);
}
