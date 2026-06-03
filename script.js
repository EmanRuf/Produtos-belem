// script.js: função geral de navegação e validação de login/cadastro.
// O tema é gerenciado separadamente em /theme.js.

// ===== SISTEMA DE ABAS =====
// Seleciona botões de navegação por abas, caso existam na página.
const tabButtons = document.querySelectorAll('.tab-btn');
// Seleciona todos os painéis de conteúdo para alternar visibilidade.
const panels = document.querySelectorAll('.panel');

function showPanel(id) {
  panels.forEach((p) => {
    if (p.id === id) p.classList.remove('hidden');
    else p.classList.add('hidden');
  });
  tabButtons.forEach((b) => {
    if (b.dataset.target === id) b.classList.add('tab-active');
    else b.classList.remove('tab-active');
  });
}

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    if (target) showPanel(target);
  });
});

// Sub-opções dentro do painel de opções
// Este trecho cuida de botões internos opcionais, caso existam na página.
const optionButtons = document.querySelectorAll('.option-btn');
const optionPanel = document.querySelector('#option-panel');
optionButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const opt = btn.dataset.option;
    if (opt === 'meus-pedidos') {
      optionPanel.textContent = 'Aqui estão seus pedidos (placeholder).';
    } else if (opt === 'usuario') {
      optionPanel.textContent = 'Informações do usuário (placeholder).';
    } else if (opt === 'boletos') {
      optionPanel.textContent = 'Boletos e pagamentos (placeholder).';
    }
  });
});

// Alterna visibilidade do menu de opções fixo no canto esquerdo.
const optionsToggle = document.querySelector('#options-toggle');
const overlayOptions = document.querySelector('.overlay-options');
if (optionsToggle && overlayOptions) {
  optionsToggle.addEventListener('click', () => {
    const isCollapsed = overlayOptions.classList.toggle('collapsed');
    optionsToggle.setAttribute('aria-expanded', String(!isCollapsed));
  });
}

// Mostrar painel inicial por padrão
// Mostrar painel inicial agora é o login
showPanel('panel-login');

// ===== Gerenciamento de contas (localStorage) =====
// As contas são salvas e lidas do localStorage do navegador.
function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem('accounts') || '{}');
  } catch (e) {
    return {};
  }
}

function saveAccount(cnpjDigits, account) {
  const accounts = getAccounts();
  accounts[cnpjDigits] = account;
  localStorage.setItem('accounts', JSON.stringify(accounts));
}

// Busca uma conta salva usando o CNPJ limpo de caracteres não numéricos.
function findAccountByCnpj(cnpj) {
  const digits = cnpj.replace(/\D/g, '');
  const accounts = getAccounts();
  return accounts[digits];
}

// ===== Login simples =====
// Valida as credenciais na página inicial e redireciona para pedidos.
const loginForm = document.querySelector('#login-form');
const loginStatus = document.querySelector('#login-status');
const loginResult = document.querySelector('#login-result');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cnpj = document.querySelector('#login-cnpj').value.replace(/\D/g, '');
    const password = document.querySelector('#login-password').value;
    if (!cnpj || cnpj.length !== 14) {
      loginStatus.textContent = 'Informe um CNPJ válido.';
      loginStatus.className = 'status-invalid';
      loginResult.classList.remove('hidden');
      return;
    }
    if (!isValidCnpj(cnpj)) {
      loginStatus.textContent = 'CNPJ inválido.';
      loginStatus.className = 'status-invalid';
      loginResult.classList.remove('hidden');
      return;
    }
    const account = findAccountByCnpj(cnpj);
    if (!account || account.password !== password) {
      loginStatus.textContent = 'CNPJ ou senha incorretos.';
      loginStatus.className = 'status-invalid';
      loginResult.classList.remove('hidden');
      return;
    }
    // sucesso: armazenar sessão simples e redirecionar para /pedidos/index.html
    sessionStorage.setItem('loggedCnpj', cnpj);
    window.location.href = '/pedidos/index.html';
  });
}

// Registro: submissão simples (exemplo local)
const registerForm = document.querySelector('#register-form');
const registerStatus = document.querySelector('#register-status');
const registerResult = document.querySelector('#register-result');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cnpj = document.querySelector('#reg-cnpj').value.replace(/\D/g, '').trim();
    const name = document.querySelector('#reg-name').value.trim();
    const email = document.querySelector('#reg-email').value.trim();
    const password = document.querySelector('#reg-password').value;
    if (!cnpj || cnpj.length !== 14 || !isValidCnpj(cnpj)) {
      registerStatus.textContent = 'Informe um CNPJ válido.';
      registerStatus.className = 'status-invalid';
      registerResult.classList.remove('hidden');
      return;
    }
    const account = { name, email, password, createdAt: new Date().toISOString() };
    saveAccount(cnpj, account);
    registerStatus.textContent = 'Cadastro realizado com sucesso.';
    registerStatus.className = 'status-valid';
    registerResult.classList.remove('hidden');
    // Após cadastro, abrir opções
    const tabOptions = document.querySelector('#tab-options');
    if (tabOptions) tabOptions.click();
  });
}

// ===== FIM DO SISTEMA DE ABAS =====

const form = document.querySelector('#cnpj-form');
const input = document.querySelector('#cnpj-input');
const nameInput = document.querySelector('#name-input');
const emailInput = document.querySelector('#email-input');
const quantityInput = document.querySelector('#quantity-input');
const resultSection = document.querySelector('#result');
const statusEl = document.querySelector('#status');
const dataEl = document.querySelector('#data');

function formatCnpj(value) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2')
    .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, '$1-$2');
}

function calculateCheckDigit(cnpjDigits, weights) {
  const digits = cnpjDigits.split('').map(Number);
  const sum = digits.reduce((acc, number, index) => acc + number * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function isValidCnpj(cnpj) {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const base = digits.slice(0, 12);
  const firstCheck = calculateCheckDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]).toString();
  const secondCheck = calculateCheckDigit(base + firstCheck, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]).toString();
  return digits === base + firstCheck + secondCheck;
}

input.addEventListener('input', () => {
  input.value = formatCnpj(input.value);
});

input.addEventListener('blur', () => {
  const cnpj = input.value.replace(/\D/g, '');
  if (cnpj.length === 14) {
    fetch(`/api/users?cnpj=${cnpj}`)
      .then((response) => {
        if (!response.ok) throw new Error('Nenhum dado salvo');
        return response.json();
      })
      .then((user) => {
        nameInput.value = user.name || '';
        emailInput.value = user.email || '';
        quantityInput.value = user.quantity || quantityInput.value;
        resultSection.classList.remove('hidden');
        statusEl.textContent = 'Dados carregados para este CNPJ.';
        statusEl.className = 'status-valid';
        dataEl.textContent = '';
      })
      .catch(() => {
        // Ignora se não houver dados salvos
      });
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const cnpj = input.value.replace(/\D/g, '');
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const quantity = Number(quantityInput.value);
  resultSection.classList.remove('hidden');
  dataEl.textContent = '';

  if (!cnpj) {
    statusEl.textContent = 'Informe um CNPJ para verificar.';
    statusEl.className = 'status-invalid';
    return;
  }

  if (!name) {
    statusEl.textContent = 'Informe o nome do cliente.';
    statusEl.className = 'status-invalid';
    return;
  }

  if (!quantity || quantity < 50) {
    statusEl.textContent = 'A quantidade mínima é 50 unidades de amaciante.';
    statusEl.className = 'status-invalid';
    return;
  }

  const valid = isValidCnpj(cnpj);
  if (!valid) {
    statusEl.textContent = `CNPJ ${formatCnpj(cnpj)} inválido.`;
    statusEl.className = 'status-invalid';
    return;
  }

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnpj, name, email, quantity }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao salvar os dados.');
    }
    const userData = await response.json();
    statusEl.textContent = `CNPJ ${formatCnpj(cnpj)} válido. Pedido de ${userData.quantity} unidades confirmado.`;
    statusEl.className = 'status-valid';
    dataEl.textContent = `Dados salvos: ${userData.name}${userData.email ? ` | ${userData.email}` : ''}`;
  } catch (error) {
    statusEl.textContent = error.message || 'Não foi possível salvar os dados do usuário.';
    statusEl.className = 'status-invalid';
  }

  dataEl.textContent += '\nConsultando dados públicos...';
  try {
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
    if (!response.ok) {
      throw new Error('Falha na consulta externa.');
    }
    const data = await response.json();
    if (data.status === 'ERROR') {
      dataEl.textContent += `\nConsulta indisponível: ${data.message || 'não foi possível obter informações.'}`;
      return;
    }
    const formatted = JSON.stringify(
      {
        Nome: data.nome,
        Fantasia: data.fantasia,
        Situação: data.situacao,
        Abertura: data.abertura,
        'Natureza Jurídica': data.natureza_juridica,
        UF: data.uf,
        Município: data.municipio,
        'Atividade Principal': data.atividade_principal?.map((item) => item.texto).join(', '),
      },
      null,
      2
    );
    dataEl.textContent = `${dataEl.textContent}\n\n${formatted}`;
  } catch (error) {
    dataEl.textContent += '\nNão foi possível consultar a API pública. O CNPJ ainda foi validado localmente.';
  }
});

