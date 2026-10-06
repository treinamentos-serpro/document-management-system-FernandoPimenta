# Instruções do projeto - Document Management System (DMS)

Use estas instruções em todas as tarefas neste repositório. Consulte a
[especificação do DMS](../docs/specs/dms-spec.md) para requisitos, modelo de
dados, contratos de API e limites de escopo; não duplique esses contratos aqui.

## Visão geral

Sistema web para gestão de documentos com:

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário

## Stack

- Backend: Node.js + Express (CommonJS)
- Frontend: React 19 + Vite (ESM)
- Testes backend: runner nativo do Node (`node:test`)
- Sem TypeScript nesta fase (JavaScript puro)

## Comandos de desenvolvimento e validação

Execute os comandos abaixo a partir da raiz do repositório. Não existe pacote
npm na raiz; backend e frontend possuem seus próprios arquivos `package.json`.

| Finalidade | Comando |
| --- | --- |
| Instalar dependências do backend | `npm --prefix backend ci` |
| Instalar dependências do frontend | `npm --prefix frontend ci` |
| Executar testes do backend | `npm --prefix backend test` |
| Validar build do frontend | `npm --prefix frontend run build` |
| Iniciar backend com watch | `npm --prefix backend run dev` |
| Iniciar frontend | `npm --prefix frontend run dev` |

- Use Node.js 24 ou superior, conforme os requisitos do frontend.
- Para mudanças no backend, reutilize os testes HTTP em
  [backend/test/app.test.js](../backend/test/app.test.js), isolando uploads em
  diretório temporário e restaurando variáveis de ambiente após os testes.
- Não altere testes apenas para fazer uma implementação incorreta passar.
- O frontend ainda não possui script de testes; build não comprova interação
  no navegador. Valide upload, listagem e download pelo proxy quando possível.
- Confirme a disponibilidade de ferramentas e bibliotecas do navegador antes
  de afirmar que testes foram executados. Informe bloqueios de forma explícita.

## Princípios obrigatórios

- SOLID, DRY, KISS, YAGNI
- 12-Factor App (configuração via variáveis de ambiente)
- Código legível tem prioridade sobre código complexo
- Sem overengineering e sem abstrações desnecessárias

## Arquitetura do backend (Clean Architecture simples)

Separe responsabilidades em quatro camadas dentro de `backend/src`:

- `routes/`: definem os endpoints e delegam para os controllers
- `controllers/`: tratam entrada/saída HTTP e validação básica
- `services/`: concentram as regras de negócio
- `repositories/`: cuidam da persistência

Fluxo de dependência: `routes -> controllers -> services -> repositories`.
Camadas internas não conhecem camadas externas.

- Registre roteadores em [backend/src/app.js](../backend/src/app.js) e preserve
  a exportação do app sem iniciar o servidor durante imports dos testes.
- Siga o fluxo existente em
  [documentRoutes.js](../backend/src/routes/documentRoutes.js) e
  [documentService.js](../backend/src/services/documentService.js).
- Mantenha objetos Express e decisões de status HTTP fora de services e
  repositories; preserve o formato de erros definido na especificação.

## Armazenamento (restrição importante)

- Os arquivos enviados são gravados no filesystem local da aplicação, na pasta
  `backend/storage`, utilizando `multer` com `diskStorage`.
- Os metadados dos documentos (id, nome original, tamanho, data, dono) ficam em
  memória nesta fase inicial.
- Não utilize provedores de armazenamento externos ou serviços de upload de
  terceiros. O armazenamento é estritamente local à aplicação.
- Preserve a configuração por ambiente e os nomes físicos gerados pelo servidor
  em [middleware/upload.js](../backend/src/middleware/upload.js); nunca use um
  caminho fornecido pelo cliente para gravar ou baixar arquivos.
- Reiniciar o backend perde metadados, mas não remove arquivos do disco. Não
  limpe `backend/storage` indiscriminadamente para executar testes.
- `X-User-Id` identifica o dono no MVP, mas não autentica usuários. Preserve o
  filtro de listagem e a verificação de dono no download sem prometer segurança
  multiusuário em produção.

## Convenções do frontend

- Componentes funcionais com React Hooks
- Organização baseada em componentes: `components/`, `pages/`, `services/`
- A comunicação com o backend é feita via `fetch`, através do prefixo `/api`
  (proxy configurado no Vite)
- Reutilize componentes e evite duplicação
- Centralize requisições, identificação do usuário e tratamento de erros em
  [services/documentApi.js](../frontend/src/services/documentApi.js).
- Em uploads com `FormData`, deixe o navegador definir `Content-Type` e boundary.
- Preserve o cancelamento de consultas e a separação de estado ao trocar de
  usuário, como em [App.jsx](../frontend/src/App.jsx).
- O proxy de [vite.config.js](../frontend/vite.config.js) aponta para a porta
  3000 e remove `/api` no desenvolvimento. Alterar `PORT` no backend exige
  ajustar o destino do proxy; o build estático não oferece esse proxy.
- Reutilize `lucide-react` para ícones, labels acessíveis e estados de
  carregamento, erro e lista vazia nos componentes.

## Estilo de código

- Nomes descritivos em inglês para símbolos de código
- Mensagens ao usuário e comentários em português
- Funções pequenas e com responsabilidade única
- Trate erros nos limites do sistema (entrada HTTP, leitura/escrita de arquivos)

## Restrições gerais

- Não quebrar funcionalidades existentes
- Manter a implementação simples e evolutiva
- Preferir dependências já presentes no `package.json`
- Se a tarefa for apenas especificação ou planejamento, altere somente os
  documentos solicitados; não implemente automaticamente etapas futuras.
- Preserve mudanças locais do usuário; não faça commits ou pushes sem pedido.
