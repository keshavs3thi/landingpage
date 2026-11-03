// Sidebar category toggles (instant): show or hide a category's project links.

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
