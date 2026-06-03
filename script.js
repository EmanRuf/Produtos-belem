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

  try {
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
    if (!response.ok) {
      throw new Error('Falha na consulta externa.');
    }
    const data = await response.json();
    if (data.status === 'ERROR') {
      dataEl.textContent = `Consulta indisponível: ${data.message || 'não foi possível obter informações.'}`;
      return;
    }
    const formatted = JSON.stringify(
      {
        'Nome': data.nome,
        'Fantasia': data.fantasia,
        'Situação': data.situacao,
        'Abertura': data.abertura,
        'Natureza Jurídica': data.natureza_juridica,
        'UF': data.uf,
        'Município': data.municipio,
        'Atividade Principal': data.atividade_principal?.map((item) => item.texto).join(', '),
      },
      null,
      2
    );
    dataEl.textContent = formatted;
  } catch (error) {
    dataEl.textContent = 'Não foi possível consultar a API pública. O CNPJ ainda foi validado localmente.';
  }
});
