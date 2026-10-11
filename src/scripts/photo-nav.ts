// Sidebar year toggles (instant) and the mobile Index sheet.

for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-toggle]')) {
  btn.addEventListener('click', () => {
    const list = document.getElementById(btn.getAttribute('aria-controls')!);
    if (!list) return;
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    list.hidden = !open;
    btn.querySelector('[aria-hidden]')!.textContent = open ? '−' : '+';
  });
}

const sheet = document.querySelector<HTMLDialogElement>('[data-index-sheet]');
if (sheet) {
  document.querySelector('[data-index-open]')?.addEventListener('click', () => sheet.showModal());
  sheet.querySelector('[data-index-close]')?.addEventListener('click', () => sheet.close());
  // Close if the layout grows past the mobile breakpoint while open.
  matchMedia('(max-width: 760px)').addEventListener('change', (e) => {
    if (!e.matches && sheet.open) sheet.close();
  });
}
