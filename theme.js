// theme.js: gerencia o tema claro/escuro em todas as páginas.
// Ele lê o tema salvo no localStorage, aplica o tema inicial e
// atualiza o botão para refletir o estado atual.
(function () {
  const themeToggle = document.querySelector('#theme-toggle');
  const html = document.documentElement;

  // Retorna o tema armazenado pelo usuário, se existir
  function getStoredTheme() {
    return localStorage.getItem('theme');
  }

  // Retorna o tema preferido pelo sistema operacional
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Atualiza o texto do botão de alternância de tema
  function applyThemeToUI(theme) {
    if (!themeToggle) return;
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // Define o tema no elemento <html> e salva a preferência localmente
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

  // Inicializa o tema com base na preferência salva ou nas configurações do sistema
  function initTheme() {
    const stored = getStoredTheme();
    const theme = stored || getSystemTheme();
    setTheme(theme);
  }

  // Alterna o tema quando o botão for clicado
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Se o usuário alterar o tema do sistema, atualiza automaticamente
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const stored = getStoredTheme();
    if (!stored) setTheme(e.matches ? 'dark' : 'light');
  });

  // Executa a configuração inicial de tema
  initTheme();
})();
