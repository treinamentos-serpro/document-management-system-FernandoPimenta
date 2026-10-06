---
name: "documentar-execucao"
description: "Atualiza o README do DMS com instalação, execução, configuração, exemplos de API e limitações verificadas no código; altera somente documentação."
argument-hint: "backend | frontend | projeto completo (padrão)"
agent: "agent"
tools: ["read", "search", "edit"]
---

# Documentar execução do DMS

Atualize o [README.md](../../README.md) para documentar como instalar, configurar
e executar a implementação atual do DMS.

## Entrada e escopo

- Use o foco informado na mensagem de invocação: `backend`, `frontend` ou
  `projeto completo`. Se não houver foco, use `projeto completo`.
- Se o foco for ambíguo ou diferente desses valores, peça esclarecimento antes
  de editar. Não use o arquivo aberto no editor como destino alternativo.
- Altere somente o README. Não implemente funcionalidades, não modifique código,
  testes, dependências ou configurações e não faça commits ou pushes.
- Não execute comandos, instale dependências ou inicie servidores. Documente
  comandos com base nos scripts reais, sem afirmar que foram executados.

## Fontes

- Siga as [instruções do projeto](../copilot-instructions.md).
- Consulte a [especificação do DMS](../../docs/specs/dms-spec.md) para os contratos
  e limites previstos. Para comportamento já disponível, confirme no código;
  não apresente planos futuros como funcionalidades implementadas.
- Backend: [package.json](../../backend/package.json),
  [app.js](../../backend/src/app.js),
  [roteador](../../backend/src/routes/documentRoutes.js) e
  [upload](../../backend/src/middleware/upload.js).
- Frontend: [package.json](../../frontend/package.json),
  [proxy Vite](../../frontend/vite.config.js),
  [App.jsx](../../frontend/src/App.jsx) e
  [cliente de API](../../frontend/src/services/documentApi.js).
- Leia arquivos adicionais somente quando necessários para confirmar um detalhe.
  Havendo divergência entre especificação e implementação, registre-a, sem tentar
  corrigi-la nesta tarefa.

## Conteúdo esperado

Acrescente ou atualize as seções pertinentes ao foco, usando português conciso,
comandos em blocos de código e caminhos relativos à raiz do repositório:

1. **Pré-requisitos e instalação:** versão de Node e comandos por pacote,
   conforme `engines`, scripts e lockfiles existentes. Indique o diretório de
   execução; não sugira um comando npm na raiz sem pacote correspondente.
2. **Execução local:** comandos, terminais separados quando necessário, portas
   e URLs padrão. No foco frontend, explique a dependência de um backend ativo
   e o funcionamento do prefixo `/api` sem expandir a documentação do backend.
3. **Configuração:** variáveis realmente usadas, padrões e unidades. Não
   prometa carregamento automático de `.env` se o código não o implementar.
   Explique que mudar a porta do backend exige ajustar o destino do proxy.
4. **Uso:** no foco backend, inclua exemplos `curl` de upload, listagem e
   download, com `X-User-Id`, campo `file` e placeholders explícitos para
   arquivo e identificador. No foco frontend, descreva seleção de usuário,
   envio, listagem e download conforme os controles existentes.
5. **Validação:** comandos de teste do backend e build do frontend pertinentes
   ao foco. Diferencie build de teste de interação; não invente scripts ausentes.
6. **Limitações:** armazenamento local via multer, metadados em memória e perda
   desses metadados após reinício, sem exclusão automática dos arquivos; ausência
   de autenticação em `X-User-Id`; proxy de desenvolvimento indisponível no build
   estático. Inclua apenas detalhes relevantes ao foco.

## Critérios de entrega

- Preserve o conteúdo do exercício, links, créditos e seções fora do foco.
- Atualize seções existentes em vez de criar duplicações a cada execução.
- Linke a especificação para requisitos completos, sem reproduzi-la no README.
- Confira os scripts, defaults e caminhos citados nas fontes; não declare
  resultados de testes, instalação ou execução sem evidência.
- Ao finalizar, informe quais seções foram atualizadas e dúvidas ou divergências
  encontradas. Não apresente a edição documental como validação do sistema.