# Produtos-belem
Empresa com produtos no varejo de Limpeza, Atendemos todos os municípios de Rondônia.

## Executar o site
1. Abra o terminal em `Produtos-belem`.
2. Execute `npm install`.
3. Execute `npm start`.
4. Abra `http://localhost:3000` no navegador.

## O que foi adicionado
- Banco de dados SQLite (`users.db`) para armazenar os dados do usuário pelo CNPJ.
- API `GET /api/users?cnpj=...` para preencher dados salvos automaticamente.
- API `POST /api/users` para salvar ou atualizar usuário e quantidade.
- Interface com campos de CNPJ, nome, e-mail e quantidade mínima de 50 unidades.
