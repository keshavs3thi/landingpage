// Photo viewer: expand in place (FLIP via the Web Animations API), keyboard/arrow/swipe navigation
// that wraps around, shareable URLs (pushState to open, replaceState to move, Back closes), and
// preloading. Markup comes from render.ts so it matches what Astro renders for direct visits.

import { VIEWER_SIZES, infoHtml, pictureHtml, type ViewerEntry } from '../lib/photos/render';

const OPEN_MS = 240;
const NAV_MS = 120;
const EASE_OUT = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
const SWIPE_FRACTION = 0.2; // of the stage width
const SWIPE_DOWN_PX = 100;
const FLICK = 0.5; // px/ms

const dialog = document.querySelector<HTMLDialogElement>('[data-viewer]');
const data = document.querySelector('[data-viewer-list]');
if (dialog && data) init(dialog, JSON.parse(data.textContent || '[]') as ViewerEntry[]);

function init(dialog: HTMLDialogElement, list: ViewerEntry[]) {
  const $ = <T extends Element = HTMLElement>(sel: string) => dialog.querySelector<T>(sel)!;
  const root = document.documentElement;
  const stage = $('[data-stage]');
  const frame = $('[data-frame]');
  const info = $('[data-info]');
  const label = $('[data-label]');
  const count = $('[data-count]');
  const copied = $('[data-copied]');
  const details = $<HTMLDetailsElement>('.v-details');
  const panel = $('.v-panel');
  const bar = $('.v-bar');
  const tiles = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-grid] a[data-i]'));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const listUrl = dialog.dataset.listUrl!;
  const listTitle = dialog.dataset.listTitle!;
  const n = list.length;

  let index = -1;
  let pushed = false; // we added the history entry, so closing should go Back
  let ignorePop = false;
  let busy = false; // an open/close/navigate animation is running

  // ---- rendering ----------------------------------------------------------------------------

  function show(i: number) {
    const e = list[i];
    index = i;
    if (frame.dataset.i !== String(i)) {
      frame.dataset.i = String(i);
      frame.style.setProperty('--ar', `${e.w}/${e.h}`);
      frame.style.setProperty('--ph', e.color);
      // Show the grid thumbnail (already loaded) at once, then swap in the large image when decoded.
      const thumb = tiles[i]?.querySelector('img');
      const thumbSrc = thumb?.complete ? thumb.currentSrc : '';
      frame.innerHTML = thumbSrc ? `<img src="${thumbSrc}" alt="" aria-hidden="true">` : '';
      const holder = document.createElement('div');
      holder.innerHTML = pictureHtml(e.set, { sizes: VIEWER_SIZES, alt: e.alt, w: e.w, h: e.h, loading: 'eager' });
      const pic = holder.firstElementChild as HTMLElement;
      const img = pic.querySelector('img')!;
      if (thumbSrc) {
        pic.style.opacity = '0';
        const reveal = () => {
          pic.style.opacity = '';
          if (pic.isConnected && pic.previousElementSibling) pic.previousElementSibling.remove();
        };
        img.decode().then(reveal, reveal);
      }
      frame.append(pic);
    }
    info.innerHTML = infoHtml(e);
    label.textContent = `${e.heading}, photo ${i + 1} of ${n}`;
    count.textContent = `${i + 1} / ${n}`;
    copied.textContent = '';
    document.title = e.pageTitle;
    preload(i + 1);
    preload(i - 1);
  }

  const preloaded = new Map<number, HTMLElement>();
  function preload(i: number) {
    const j = (i + n) % n;
    if (n < 2 || preloaded.has(j)) return;
    const e = list[j];
    const holder = document.createElement('div');
    holder.innerHTML = pictureHtml(e.set, { sizes: VIEWER_SIZES, alt: '', w: e.w, h: e.h, loading: 'eager' });
    preloaded.set(j, holder); // a detached <picture> still picks a source and fetches it
  }

  // ---- open / close ---------------------------------------------------------------------------

  const fade = (els: Element[], from: number, to: number, duration: number) =>
    els.map((el) => el.animate([{ opacity: from }, { opacity: to }], { duration, easing: EASE_OUT }));

  const fadeBackdrop = (from: number, to: number, duration: number) =>
    dialog.animate([{ opacity: from }, { opacity: to }], { duration, easing: EASE_OUT, pseudoElement: '::backdrop' });

  const inView = (r: DOMRect) => r.bottom > 0 && r.top < innerHeight && r.width > 0;

  function flip(from: DOMRect, to: DOMRect) {
    const s = from.width / to.width;
    return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${s})`;
  }

  async function open(i: number, { animate = true, push = true } = {}) {
    if (busy) return;
    show(i);
    if (dialog.open && !dialog.matches(':modal')) dialog.close(); // upgrade the server-rendered open dialog
    if (!dialog.open) dialog.showModal();
    root.classList.add('viewer-open');
    details.open = !mobile.matches;
    if (push) {
      history.pushState({ viewer: i }, '', list[i].url);
      pushed = true;
    }
    if (!animate) return;

    busy = true;
    const tile = tiles[i];
    const tileRect = tile?.getBoundingClientRect();
    const anims: Animation[] = [fadeBackdrop(0, 1, OPEN_MS), ...fade([panel, bar], 0, 1, OPEN_MS)];
    if (reduce.matches || !tileRect || !inView(tileRect)) {
      anims.push(...fade([stage], 0, 1, OPEN_MS));
    } else {
      const to = frame.getBoundingClientRect();
      anims.push(frame.animate([{ transform: flip(tileRect, to) }, { transform: 'none' }], { duration: OPEN_MS, easing: EASE_OUT }));
    }
    await Promise.allSettled(anims.map((a) => a.finished));
    busy = false;
  }

  async function close({ fromHistory = false, mode = 'flip' as 'flip' | 'fade' } = {}) {
    if (!dialog.open || busy) return;
    busy = true;
    const i = index;
    const tile = tiles[i];
    const direct = !pushed;

    if (!fromHistory) {
      if (pushed) {
        ignorePop = true;
        history.back();
      } else {
        history.replaceState(null, '', listUrl);
      }
    }
    pushed = false;

    const tileRect = tile?.getBoundingClientRect();
    const anims: Animation[] = [fadeBackdrop(1, 0, OPEN_MS), ...fade([panel, bar], 1, 0, NAV_MS)];
    if (mode === 'flip' && !reduce.matches && tileRect && inView(tileRect)) {
      const from = frame.getBoundingClientRect();
      anims.push(frame.animate([{ transform: 'none' }, { transform: flip(tileRect, from) }], { duration: OPEN_MS, easing: EASE_OUT }));
    } else {
      anims.push(...fade([stage], 1, 0, NAV_MS));
    }
    await Promise.allSettled(anims.map((a) => a.finished));

    dialog.close();
    frame.style.transform = '';
    root.classList.remove('viewer-open');
    document.title = listTitle;
    index = -1;
    if (tile) {
      if (direct && tileRect && !inView(tileRect)) tile.scrollIntoView({ block: 'center' });
      tile.focus({ preventScroll: true });
    }
    busy = false;
  }

  async function go(delta: number) {
    if (n < 2 || index < 0 || busy) return;
    const i = (index + delta + n) % n; // wraps around
    history.replaceState({ viewer: i }, '', list[i].url);
    if (reduce.matches) return show(i);
    busy = true;
    await frame.animate([{ opacity: 1 }, { opacity: 0 }], { duration: NAV_MS / 2, easing: 'ease-out' }).finished.catch(() => {});
    show(i);
    await frame.animate([{ opacity: 0 }, { opacity: 1 }], { duration: NAV_MS / 2, easing: 'ease-out' }).finished.catch(() => {});
    busy = false;
  }

  // ---- events ---------------------------------------------------------------------------------

  tiles.forEach((tile, i) => {
    tile.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab etc.
      e.preventDefault();
      open(i);
    });
    // Start loading the large version on intent so the expand feels instant.
    tile.addEventListener('pointerenter', () => preload(i));
    tile.addEventListener('focus', () => preload(i));
  });

  dialog.addEventListener('cancel', (e) => {
    e.preventDefault(); // Esc: run our close (animation + history) instead of the native one
    close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') (e.preventDefault(), go(1));
    else if (e.key === 'ArrowLeft') (e.preventDefault(), go(-1));
  });

  $('[data-close]').addEventListener('click', (e) => {
    e.preventDefault();
    close();
  });
  $('[data-prev]').addEventListener('click', () => go(-1));
  $('[data-next]').addEventListener('click', () => go(1));

  // The dimmed area around the photo acts as the backdrop.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target === stage) close();
  });

  $('[data-copy]').addEventListener('click', async () => {
    const url = new URL(list[index].url, location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      copied.textContent = 'Copied';
    } catch {
      copied.textContent = url; // clipboard blocked: show it so it can be copied by hand
    }
  });

  addEventListener('popstate', (e) => {
    if (ignorePop) {
      ignorePop = false;
      return;
    }
    const state = e.state as { viewer?: number } | null;
    if (dialog.open && typeof state?.viewer !== 'number') close({ fromHistory: true });
    else if (!dialog.open && typeof state?.viewer === 'number') {
      open(state.viewer, { push: false });
      pushed = true; // Forward re-entered our entry; Back/close should leave it again
    }
  });

  // ---- swipe (touch): follow the finger; left/right navigates, down closes ---------------------

  let sx = 0, sy = 0, st = 0, axis: '' | 'x' | 'y' = '', pointers = 0, lastY = 0;
  const zoomed = () => (window.visualViewport?.scale ?? 1) > 1.01;
  const reset = () => {
    const current = frame.style.transform;
    frame.style.transform = '';
    if (current && !reduce.matches)
      frame.animate([{ transform: current }, { transform: 'none' }], { duration: NAV_MS, easing: EASE_OUT });
  };

  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    pointers++;
    if (pointers > 1 || zoomed()) return (axis = ''), reset(); // pinch: leave it to the browser
    sx = e.clientX;
    sy = lastY = e.clientY;
    st = e.timeStamp;
    axis = '';
  });

  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'touch' || pointers !== 1 || busy) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (!axis && Math.hypot(dx, dy) > 10) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (axis === 'x' && !reduce.matches) frame.style.transform = `translateX(${dx}px)`;
    if (axis === 'y') {
      if (dy > 0 && dialog.scrollTop <= 0) {
        if (!reduce.matches) frame.style.transform = `translateY(${dy}px)`;
      } else {
        dialog.scrollTop -= e.clientY - lastY; // the photo area doesn't pan natively; scroll for it
      }
    }
    lastY = e.clientY;
  });

  const end = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    pointers = Math.max(0, pointers - 1);
    if (!axis || busy) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    const dt = Math.max(1, e.timeStamp - st);
    const a = axis;
    axis = '';
    if (a === 'x' && (Math.abs(dx) > stage.clientWidth * SWIPE_FRACTION || Math.abs(dx) / dt > FLICK)) {
      frame.style.transform = '';
      go(dx < 0 ? 1 : -1);
    } else if (a === 'y' && dy > 0 && dialog.scrollTop <= 0 && (dy > SWIPE_DOWN_PX || dy / dt > FLICK)) {
      close({ mode: 'fade' });
    } else {
      reset();
    }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', (e) => {
    pointers = Math.max(0, pointers - 1);
    axis = '';
    if (e.pointerType === 'touch') reset();
  });

  // ---- direct visit: the page was rendered with the viewer open on this photo ------------------

  const start = dialog.dataset.openIndex;
  if (start !== undefined && start !== '') {
    history.replaceState({ viewer: Number(start) }, '');
    open(Number(start), { animate: false, push: false });
  }
}
