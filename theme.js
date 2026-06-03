// Tema compartilhado para todas as páginas
(function () {
  const themeToggle = document.querySelector('#theme-toggle');
  const html = document.documentElement;

  function getStoredTheme() {
    return localStorage.getItem('theme');
  }

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyThemeToUI(theme) {
    if (!themeToggle) return;
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function setTheme(theme) {
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
      applyThemeToUI('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
      applyThemeToUI('light');
      localStorage.setItem('theme', 'light');
    }
  }

  function initTheme() {
    const stored = getStoredTheme();
    const theme = stored || getSystemTheme();
    setTheme(theme);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Detecta mudança nas preferências do sistema
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const stored = getStoredTheme();
    if (!stored) setTheme(e.matches ? 'dark' : 'light');
  });

  // Inicializa
  initTheme();
})();
