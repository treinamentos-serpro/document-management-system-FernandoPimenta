# Especificação - Document Management System

## 1. Objetivo

Oferecer uma aplicação web para que usuários enviem, consultem e baixem seus documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos associados a um usuário.
- Download de um documento pelo identificador, restrito ao usuário associado.
- Identificação simples do usuário por requisição.
- Interface web para upload, listagem e download.
- Armazenamento dos arquivos em `backend/storage`, usando `multer` com `diskStorage`.
- Armazenamento dos metadados em memória durante a execução do processo.

### Fora do escopo

- Autenticação, cadastro ou gestão de credenciais.
- Persistência durável dos metadados.
- Armazenamento externo ou em nuvem.
- Versionamento, edição, exclusão ou compartilhamento de documentos.
- Busca avançada, pastas e permissões configuráveis.
- Garantia de preservação dos metadados após reinicialização do servidor.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar o upload de um único arquivo por requisição, usando `multipart/form-data` e o campo `file`. |
| RF-02 | O sistema deve associar o documento ao usuário identificado na requisição. |
| RF-03 | O sistema deve gerar um identificador único e um nome de armazenamento que não dependa do nome enviado pelo usuário. |
| RF-04 | O sistema deve devolver os metadados públicos do documento após um upload bem-sucedido. |
| RF-05 | O sistema deve listar somente os documentos associados ao usuário da requisição. |
| RF-06 | A listagem deve retornar os documentos ordenados por data de upload decrescente. |
| RF-07 | O sistema deve permitir o download de um documento pelo identificador, somente ao usuário associado. |
| RF-08 | O download deve ser entregue como anexo, usando o nome original como nome sugerido ao cliente. |
| RF-09 | O sistema deve responder com erro estruturado para arquivo ausente, arquivo acima do limite, documento inexistente ou falha de armazenamento. |
| RF-10 | A interface deve permitir enviar um documento, exibir a lista do usuário e iniciar o download de um documento. |
| RF-11 | A interface deve informar estados de carregamento e erros retornados pela API. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local usando `multer` com `diskStorage`. |
| RNF-02 | O diretório padrão de armazenamento deve ser `backend/storage`; o cliente não pode definir o caminho de destino. |
| RNF-03 | Os metadados devem permanecer em memória nesta versão e podem ser perdidos quando o processo reiniciar. |
| RNF-04 | O limite padrão de upload deve ser 10 MiB e configurável por variável de ambiente. |
| RNF-05 | Porta, diretório e limite de upload devem ser configuráveis por variáveis de ambiente. |
| RNF-06 | Nomes originais não devem ser usados como nomes físicos dos arquivos. O download deve ser servido como anexo. |
| RNF-07 | O backend deve manter a direção de dependência `routes -> controllers -> services -> repositories`. |
| RNF-08 | O frontend deve consumir a API via `fetch` pelo prefixo `/api`; o proxy Vite remove esse prefixo ao encaminhar a requisição. |
| RNF-09 | `X-User-Id` não constitui autenticação; a aplicação não deve ser considerada segura para uso multiusuário exposto sem autenticação confiável. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único gerado pelo servidor. |
| `originalName` | string | Nome original informado no upload, usado para apresentação e nome sugerido no download. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora UTC do upload, em formato ISO 8601. |
| `owner` | string | Identificador do usuário associado ao documento. |

### Dados internos do repositório

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `storedName` | string | Nome seguro gerado pelo servidor para localizar o arquivo no diretório local. Não deve ser exposto pela API. |

O repositório mantém os metadados em memória, indexados por `id`. O arquivo físico e seu registro são criados como parte do upload; em caso de falha, a operação deve evitar deixar arquivos órfãos sempre que possível.

## 6. Contratos de API

### Convenções

- Rotas do backend: `/upload` e `/documents...`.
- O frontend usa `/api/upload` e `/api/documents...`; o proxy de desenvolvimento remove `/api`.
- Operações de documentos exigem o cabeçalho `X-User-Id` com valor não vazio.
- `X-User-Id` serve apenas para associação e filtragem no MVP. Não autentica nem comprova a identidade do usuário.
- Erros retornam JSON neste formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

### `POST /upload`

Envia um documento.

**Cabeçalhos:** `X-User-Id: usuario-123` e `Content-Type: multipart/form-data`.

**Corpo:** um campo multipart `file` contendo o arquivo.

**Sucesso: `201 Created`**

```json
{
  "id": "identificador-gerado",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-06T12:00:00.000Z",
  "owner": "usuario-123"
}
```

**Erros:** `400 MISSING_FILE` se o arquivo não for enviado; `400 INVALID_USER` se o usuário estiver ausente ou vazio; `413 FILE_TOO_LARGE` se o limite configurado for excedido; `500 STORAGE_ERROR` para falha ao armazenar o arquivo ou os metadados.

### `GET /documents`

Lista os documentos do usuário informado em `X-User-Id`, ordenados do mais recente para o mais antigo.

**Sucesso: `200 OK`**

```json
[
  {
    "id": "identificador-gerado",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-10-06T12:00:00.000Z",
    "owner": "usuario-123"
  }
]
```

Uma lista sem documentos retorna `200 OK` com `[]`. Erros: `400 INVALID_USER` para cabeçalho ausente ou vazio; `500 INTERNAL_ERROR` para falha inesperada ao listar.

### `GET /documents/:id/download`

Baixa o documento indicado por `id`, desde que esteja associado ao usuário informado em `X-User-Id`.

**Sucesso: `200 OK`** com conteúdo binário e `Content-Disposition: attachment`; o nome original é sugerido ao cliente.

**Erros:** `400 INVALID_USER` para cabeçalho ausente ou vazio; `404 DOCUMENT_NOT_FOUND` se o documento não existir ou não pertencer ao usuário; `500 STORAGE_ERROR` para falha ao ler o arquivo local.

## 7. Decisões arquiteturais

- **Routes:** declaram endpoints e conectam middleware e controllers.
- **Controllers:** validam a entrada HTTP básica, chamam services e traduzem resultados para respostas HTTP.
- **Services:** aplicam regras de upload, associação ao usuário, listagem e autorização do download.
- **Repositories:** mantêm metadados em memória e localizam arquivos no filesystem.
- **Upload:** usar `multer` com `diskStorage`, campo único `file`, nome físico gerado no servidor e limite configurável.
- **Identificador:** UUID gerado pelo servidor.
- **Usuário:** `X-User-Id` obrigatório no MVP, com a limitação de segurança documentada.
- **Frontend:** componentes React para upload, listagem e download, com serviço compartilhado para chamadas `fetch`.
- **Configuração:** `PORT` (padrão `3000`), `UPLOAD_DIR` (padrão `backend/storage`) e `MAX_FILE_SIZE_BYTES` (padrão `10485760`).
- **Erros:** códigos estáveis e mensagens adequadas à interface; detalhes internos do filesystem não devem ser expostos.

## 8. Plano de execução

As etapas abaixo descrevem trabalho futuro. Esta entrega cria somente esta especificação; não implementa nem altera arquivos de backend ou frontend.

1. **Implementar a API de documentos.** Criar módulos nas pastas `backend/src/routes/`, `controllers/`, `services/` e `repositories/`; integrar as rotas em `backend/src/app.js`. Critério de aceite: upload local, listagem filtrada por usuário, download autorizado, validações e erros padronizados, com testes cobrindo sucessos e falhas principais.
2. **Implementar a interface.** Criar componentes em `frontend/src/components/`, serviço em `frontend/src/services/` e integrar em `frontend/src/App.jsx`. Critério de aceite: upload, listagem e download funcionam via `/api`, com estados de carregamento, lista vazia e erro.
3. **Integrar e validar ponta a ponta.** Ajustar testes de `backend/test/` e os arquivos de frontend previstos conforme necessário. Critério de aceite: o fluxo completo funciona pelo proxy local, arquivos são gravados em `backend/storage`, metadados são filtrados por usuário e testes/build passam.
4. **Documentar configuração e limitações.** Atualizar `README.md`. Critério de aceite: instruções descrevem variáveis de ambiente, execução local, perda de metadados após reinício e ausência de autenticação.

### Risco conhecido

Qualquer cliente pode declarar outro valor em `X-User-Id`. Esse mecanismo separa registros por identificador, mas não autentica usuários. Antes de expor a aplicação para uso multiusuário, deve ser adicionada uma camada confiável de autenticação e autorização.