# Plano: plugin `erudio` (fluxo de histórias do GeekShopping)

## Context

O macroplano (10 km) e as specs de back e front já existem em `docs/`. Falta o elo entre uma entrega do macroplano e o código: a **história** (zoom de 5 km sobre uma feature), implementada por etapas com revisão e rastreio. Este plano define um plugin de projeto, `erudio`, em `erudio/` na raiz do workspace, com skills e agentes que conduzem esse fluxo. A skill de entrada é `/erudio:implement-story`. Cada etapa seguinte é uma skill que atualiza só a sua linha de uma tabela de estado no arquivo da história e sugere a próxima.

Esta etapa só produz o plano. Nenhum arquivo do plugin é criado agora.

## Decisões do usuário

| Tema | Decisão |
|---|---|
| Tech debt em auto mode | **Passo final obrigatório** em toda skill de etapa, antes de marcar ✅. Sem hook. |
| Modelos | **Todos sonnet** (code, perf, security e tech-debt). |
| `/erudio:complete-story` | Fecha a história **e** atualiza os documentos do projeto (macroplano, specs, ARCHITECTURE/README, guardião visual) **e** confere divergências entre o implementado e as specs, o plano e a arquitetura. Sugere o commit, sem commitar. |
| Idiomas | Skills e agentes em inglês; arquivo da história e achados em pt-BR. |
| Quem dispara | Todas as skills de etapa são manuais (`disable-model-invocation: true`). Skills não chamam outras skills: chamam o agente pela ferramenta Agent. |

## Estrutura do plugin

Segue o padrão dos cinco plugins existentes (um marketplace local com um plugin).

```
erudio/
  .claude-plugin/marketplace.json          name "erudio-marketplace"; plugin "erudio", source "./plugins/erudio"
  plugins/erudio/
    .claude-plugin/plugin.json             name "erudio", version "0.1.0", author leandrocgsi
    README.md
    skills/
      story-contract/                      user-invocable: false; contrato compartilhado
        SKILL.md
        story-template.md
        intentional-decisions.md           decisões intencionais que os agentes não apontam
      implement-story/SKILL.md
      dev-backend/SKILL.md
      dev-frontend/SKILL.md
      dev-unit-tests/SKILL.md
      dev-ui-tests/SKILL.md
      dev-integration-tests/SKILL.md
      agent-code-review/SKILL.md
      agent-perf-review/SKILL.md
      agent-security-review/SKILL.md
      agent-tech-debt/SKILL.md
      complete-story/SKILL.md
    agents/
      code-reviewer.md
      perf-reviewer.md
      security-reviewer.md
      tech-debt-reviewer.md
```

- **Registro e habilitação (comandos para o usuário rodar na implementação):** `claude plugin marketplace add D:\Code\Java\claude-code-4-devs-java\06_GeekShoppingCatalog\erudio` (o registro de marketplace é de escopo de usuário, como nos outros cinco) e `claude plugin install erudio@erudio-marketplace --scope project`, que grava `"erudio@erudio-marketplace": true` em `.claude/settings.json` do projeto. O plugin **não** é habilitado no escopo de usuário. Nenhum settings é editado sem confirmação.
- **Convenções herdadas:** frontmatter com `name` e `description` numa linha, em inglês; skills irmãs lidas por link relativo (`../story-contract/SKILL.md`), como `code-organization` faz hoje; agentes com `name`, `description`, `tools`, `model`.
- **Diferença deliberada:** as skills existentes usam `tools:`; o campo oficial é `allowed-tools`, que é o usado aqui. `permissionMode` e `hooks` não existem em agentes de plugin (são ignorados), então não são usados.
- **Validação:** `claude plugin validate erudio/` e `claude plugin validate erudio/plugins/erudio`.

## 1. Contrato compartilhado (`skills/story-contract/SKILL.md`)

Toda skill começa lendo o contrato (`Read ../story-contract/SKILL.md`). Ele define o que segue.

### 1.1 Como localizar a história

Pasta: `docs/plans/stories/`, a partir da raiz do workspace (onde existe `docs/plans/`). Slug: kebab-case ASCII sem acentos, até ~50 caracteres (ex.: `entrega-1-catalogo-de-produtos`).

Resolução do argumento, na ordem:
1. Termina em `.md` e o arquivo existe → usa.
2. `docs/plans/stories/<arg>.md` existe → usa.
3. Glob `docs/plans/stories/*<arg>*.md`: 1 resultado → usa; vários → pergunta qual; nenhum → para e diz que não achou, sugerindo `/erudio:implement-story`.
4. Argumento vazio → lista as histórias em que **a etapa desta skill está ⏳ e os pré-requisitos estão ✅/⚪**; 1 → confirma e usa; várias → pergunta; nenhuma → informa o motivo.

### 1.2 As 11 linhas (rótulos exatos, nesta ordem) e o dono de cada uma

Legenda, copiada literalmente na primeira linha após o título: `✅ Concluído · ⏳ Pendente · 🚧 Bloqueado · ⚪ Não se aplica`.

Tabela (emoji de estado na **primeira** coluna, data na última):

```
| Estado | Etapa | Skill | Data |
|---|---|---|---|
| ⏳ | Planejamento | /erudio:implement-story | — |
| ⏳ | Plano aprovado | /erudio:implement-story | — |
| ⏳ | Implementação do Backend | /erudio:dev-backend | — |
| ⏳ | Implementação do Frontend | /erudio:dev-frontend | — |
| ⏳ | Implementação dos testes de Backend | /erudio:dev-unit-tests | — |
| ⏳ | Implementação dos testes de Frontend | /erudio:dev-ui-tests | — |
| ⏳ | Implementação dos testes de Integração | /erudio:dev-integration-tests | — |
| ⏳ | Agente de Code Review | /erudio:agent-code-review | — |
| ⏳ | Agente de Review de Performance | /erudio:agent-perf-review | — |
| ⏳ | Agente de Review de Segurança | /erudio:agent-security-review | — |
| ⏳ | Plano Implementado | /erudio:complete-story | — |
```

| # | Etapa | Dono | Pré-requisitos (✅ ou ⚪) |
|---|---|---|---|
| 1 | Planejamento | implement-story | — |
| 2 | Plano aprovado | implement-story, **somente** após aprovação explícita do usuário | 1 |
| 3 | Implementação do Backend | dev-backend | 2 |
| 4 | Implementação do Frontend | dev-frontend | 2, 3 |
| 5 | Implementação dos testes de Backend | dev-unit-tests | 3 |
| 6 | Implementação dos testes de Frontend | dev-ui-tests | 4 |
| 7 | Implementação dos testes de Integração | dev-integration-tests | 3, 4, 5, 6 |
| 8 | Agente de Code Review | agent-code-review | 3 a 7 |
| 9 | Agente de Review de Performance | agent-perf-review | 3 a 8 |
| 10 | Agente de Review de Segurança | agent-security-review | 3 a 9 |
| 11 | Plano Implementado | complete-story | 3 a 10, sem alertas abertos |

O `tech-debt-reviewer` não tem linha: ele roda **dentro** de cada etapa (seção 5) e registra na seção "Débitos técnicos".

### 1.3 Regras de atualização

1. Cada skill edita **só a própria linha** da tabela (`Edit` com a linha inteira como `old_string`). Nunca reescreve o arquivo (`Write` só em `implement-story` na criação).
2. A **data** vem do relógio do sistema: `date +%Y-%m-%d` via Bash (Git Bash no Windows). Nunca de memória ou do contexto. A coluna Data guarda a data da última mudança de estado; `—` enquanto nunca mudou.
3. **✅ só depois da verificação da etapa passar.** O comando e o resultado resumido vão para o Registro. Sem verificação, a linha fica ⏳.
4. **⚪** só no planejamento (`implement-story`, a partir das respostas) ou por decisão explícita do usuário, registrada em "Histórico de decisões". Skill de etapa nunca marca ⚪ por conta própria.
5. **🚧** só por motivo **externo** (Docker indisponível, back fora do ar para o E2E, dependência de outra história, informação que só o usuário pode dar). O motivo vai numa linha logo abaixo da tabela: `> 🚧 <Etapa>: <motivo> (AAAA-MM-DD)`. A linha é removida quando o dono desbloqueia. Alerta `must-fix` aberto **não** é motivo externo: a linha fica ⏳ e o alerta fica na seção "Alertas".
6. ⏳ cobre "pendente" e "em andamento".
7. **Reabrir** (✅ → ⏳) só a pedido do usuário; o dono avisa quais etapas posteriores precisam rodar de novo e não altera as outras linhas.
8. Se a própria linha já está ✅, a skill para e pergunta se deve refazer. Se está ⚪, informa e para.
9. Tabela inconsistente (menos de 11 linhas, rótulo ou ordem diferente) → para e reporta, sem "consertar" em silêncio.

### 1.4 Pré-requisitos e o que fazer se estiverem pendentes

Algoritmo comum, antes de qualquer trabalho:
1. Resolver a história (1.1) e validar a tabela (1.3, item 9).
2. Para cada pré-requisito: ✅ ou ⚪ → ok; ⏳ → **parar**, sem escrever nada, dizendo qual etapa falta e qual skill a conclui; 🚧 → parar e mostrar a linha de motivo.
3. Alertas `Aberto` na seção "Alertas" → parar e listá-los (seção 6).
4. Exceção só se o usuário disser explicitamente para prosseguir; fica registrado em "Histórico de decisões".

### 1.5 Seções do arquivo da história (ordem fixa) e dono

Título `# <título>` + linha de metadados (slug, data de criação, origem), depois:

| # | Seção | Dono |
|---|---|---|
| — | Legenda, tabela de etapas, linhas de bloqueio | cada skill, só a sua linha |
| 1 | Contexto e objetivo | implement-story |
| 2 | Escopo (inclui / não inclui) | implement-story |
| 3 | Referências (macroplano, specs, histórias relacionadas) | implement-story |
| 4 | Regras de negócio (`RN-n`, cada uma com a fonte) | implement-story |
| 5 | Critérios de aceite (`AC-n`) | implement-story |
| 6 | Plano de implementação: 6.1 Backend, 6.2 Frontend | implement-story |
| 7 | Plano de testes: 7.1 Backend, 7.2 Frontend, 7.3 Integração | implement-story |
| 8 | Perguntas e decisões (pergunta, resposta, data) | implement-story |
| 9 | Pontos em aberto | implement-story; demais skills só acrescentam |
| 10 | Registro de implementação: 10.1 Backend, 10.2 Frontend, 10.3 Testes de Backend, 10.4 Testes de Frontend, 10.5 Testes de Integração, 10.6 Encerramento | a skill de cada etapa, só a sua subseção |
| 11 | Achados das revisões: 11.1 Code Review, 11.2 Performance, 11.3 Segurança | a skill `agent-*` correspondente |
| 12 | Débitos técnicos (`TD-n`) | passo de tech debt de cada skill (só acrescenta) |
| 13 | Alertas (`AL-n`) | quem detecta acrescenta; status muda por decisão do usuário |
| 14 | Histórico de decisões (append-only) | qualquer skill, a pedido do usuário |
| 15 | Resumo final | complete-story |

Seções 9, 12, 13 e 14 aceitam acréscimo de qualquer skill; as demais só do dono. `story-template.md` traz o arquivo inicial com todas as seções.

### 1.6 Regras operacionais globais (valem para todas as skills e agentes)

- **Nunca** `git add`, `commit`, `push`, `checkout`. Só leitura (`status`, `diff`, `log`). A mensagem de commit é sugerida via `erudio-git:commit-message` e o usuário comita (regra da memória do usuário).
- **Nunca** subir `spring-boot:run`, `npm run dev` ou qualquer servidor de longa duração; pedir ao usuário. `compile`, `test` e o gate do front são permitidos. Testes que exigem Docker (Testcontainers): perguntar antes de rodar.
- **Sem comentários** no código gerado; **sem Lombok**; nada de migration editada depois de aplicada; migrations **só SQL**.
- Não inventar regra: o que não está nas specs, no macroplano ou na história vira pergunta ao usuário ou "Pontos em aberto".
- Seguir `docs/specs/` e os `CLAUDE.md` dos projetos; as decisões de `intentional-decisions.md` são respeitadas, não "corrigidas".

## 2. `/erudio:implement-story`

**Frontmatter:** `name: implement-story`; `description` (inglês, com gatilhos); `argument-hint: [plan-file | slug | free text]`; `disable-model-invocation: true`; `allowed-tools: Read Glob Grep Write Edit AskUserQuestion Bash(date *) Bash(git status *)` (padrões a validar com `claude plugin validate`).

**Entrada:** caminho de um plano ou spec (macroplano, arquivo em `docs/specs/`), slug de história existente (retoma a aprovação), texto livre, ou vazio. Vazio ou ambíguo → pergunta o que implementar, oferecendo as entregas do macroplano que ainda não têm história.

**Carrega antes de planejar:** o contrato; o macroplano; as specs de `docs/specs/backend` e `frontend` relevantes (README, 01–05); os `CLAUDE.md` dos dois projetos; as histórias existentes (dependências e duplicidade). **Não** carrega as skills de código (não escreve código).

**Perguntas** (`AskUserQuestion`, até 4 por rodada, no máximo 3 rodadas; "usar os padrões" é resposta válida; cada pergunta traz um padrão derivado das specs):
1. Qual entrega/módulo/feature (padrão: a próxima entrega sem história), título e slug.
2. Quais camadas: backend, frontend ou ambos. A resposta fixa os ⚪ (só back → linhas 4 e 6; só front → 3, 5; sem fluxo de ponta a ponta → 7).
3. O que entra e o que fica **fora** do escopo (itens candidatos extraídos das specs).
4. Critérios de aceite propostos, para confirmar ou editar.
5. Decisões para cada **ponto em aberto** das specs que a história toca (201 vs 200, `ConflictException`/409, `checkout/validate`, substituição de cupom, imagens etc.).
6. Profundidade dos testes por camada (unitários, UI, integração e E2E) e se há Docker disponível.
7. Dependências de outras histórias ou de partes do back/front ainda não prontas.

**Processo:** resolver entrada → ler contexto → perguntar → montar o plano em zoom de 5 km (por camada: lista ordenada de artefatos, como migrations, entidades, DTOs, services, controllers, ou modelos, services, hooks, componentes, rotas; sem código) → escrever o arquivo novo (se já existir, não sobrescreve: pergunta entre retomar ou criar versão) → verificar → registrar → pedir aprovação.

**Verificação (para ✅ em Planejamento):** 11 linhas exatas e na ordem; legenda exata; todas as seções presentes; zero placeholders (`TODO`, `<...>`); `AC-n` numerados; toda `RN-n` com fonte; pontos em aberto listados; ⚪ coerentes com as camadas respondidas. Depois roda o passo de tech debt sobre o plano (consistência com as specs).

**Aprovação:** `AskUserQuestion` com Aprovar / Ajustar / Decidir depois. **Só "Aprovar" explícito** marca "Plano aprovado" ✅ com a data. Sugere `/erudio:dev-backend` (ou `dev-frontend` se o back for ⚪).

**Nunca:** escrever ou alterar código, specs ou migrations; inventar regra de negócio; aprovar sozinho (nem em auto mode: sem resposta do usuário, a linha 2 continua ⏳); marcar linhas além da 1 e da 2.

## 3. Esqueleto comum das skills de etapa

1. Ler o contrato; resolver a história; validar a tabela.
2. Verificar pré-requisitos (1.4) e o estado da própria linha (1.3, item 8).
3. **Carregar** as skills e specs da etapa (via ferramenta Skill, ex.: `erudio-spring-boot:code-organization`; se a chamada entre plugins falhar, ler o `SKILL.md` pelo caminho de `erudio-spring-boot-premium/plugins/erudio-spring-boot/skills/<nome>/` ou `erudio-frontend-premium/...`). **Nada é gerado antes de carregar.**
4. Implementar na ordem definida, só o que a história (seções 4–7) pede.
5. **Verificar** (comandos abaixo).
6. **Passo final obrigatório de tech debt (também em auto mode):** chamar o agente `erudio:tech-debt-reviewer` (ferramenta Agent) com a etapa, a lista de arquivos alterados e o caminho da história; registrar achados na seção 12; aplicar o protocolo de alerta (seção 6). **Não pode ser omitido nem adiado.**
7. Registrar na subseção própria do Registro: arquivos criados/alterados, comandos e resultados, desvios do plano, `AC-n`/`RN-n` cobertos, data.
8. Marcar **só a própria linha** ✅ (se a verificação passou e não há `must-fix` aberto) e sugerir a próxima skill. Sem `must-fix` resolvido, termina sem sugerir a próxima.

## 4. Skills de etapa

### 4.1 `/erudio:dev-backend`
- **Guardrails:** só `geek-shopping-api/` e a própria subseção da história; pacotes flat-by-layer em `br.com.erudio`; `@Autowired` em campo; DozerMapper; links HATEOAS só no service; Swagger só em `*ControllerDocs`; `@Valid`/constraints de parâmetro só na interface; `BigDecimal` para dinheiro; migrations **só SQL**, nunca editar V1/V2; regra ausente → pergunta; nunca tocar o front.
- **Carrega:** `erudio-spring-boot:code-organization` e `code-style` (sempre primeiro); depois, conforme a necessidade, `spring-data-jpa`, `flyway-migrations`, `exception-handling`, `bean-validation`, `pagination`, `hateoas`, `swagger` (+ `swagger-advanced`), `web-config`, `maven-config`; `docs/specs/backend` 02–05, 06 (ganchos de teste) e 07 (divergências atribuídas à entrega); `geek-shopping-api/CLAUDE.md`; seções 4–6 da história.
- **Ordem:** dependências/`pom.xml` → migrations SQL (DDL antes de DML, próximo `V{N}`) → enums e entidades → repositories → DTOs e constraints → services (regras, transações, links, `buildPagedModel`) → exceções e handler → controllers e `*ControllerDocs` → config (CORS, `application.yml`).
- **Verifica:** `./mvnw -q -DskipTests compile` e `test-compile`; testes unitários existentes que não usam banco; `Grep` de conformidade nos arquivos novos (sem Lombok, sem `//` ou `/*`, sem `bigint(`/`int(11)`, sem migration em Java). `StartupTests` exige MySQL local e **não** roda sem perguntar.
- **Registra (10.1):** arquivos, números de migration, endpoints implementados confrontados com `backend/04`, resultados dos comandos, `AC`/`RN` cobertos.

### 4.2 `/erudio:dev-frontend`
- **Guardrails:** só `geek-shopping-app/`; arquitetura e estado conforme specs; páginas finas; stores só por hook facade; nenhum arquivo não-rota chamado `page.ts(x)`; identificadores em inglês; ícones só de `react-icons/fa`; tokens (`--background` ≠ `--surface`), `SectionTitle`, raio 0; MultiShop é referência somente leitura; sem autenticação.
- **Carrega:** `erudio-frontend:scaffold` (e `scaffold-advanced` só para DataTable/Pagination/Toast), `erudio-frontend:visual-identity`, o guardião do projeto `geek-shopping-app-visual-identity` (obrigatório); `docs/specs/frontend` 02–05 e 07; `backend/04` (contrato); `geek-shopping-app/CLAUDE.md` e `ARCHITECTURE.md`; os arquivos do `MultiShop/` das telas tocadas; seções 4–6.
- **Ordem:** modelos → `core/api` (service, adaptador HAL, interceptors) → chaves de query e hooks → stores (com `persist` quando a spec manda) → lacunas do design system → componentes de feature (`.tsx` + `.module.css` + `index.ts`) → rotas → remoção de mocks previstos na história → atualização do guardião visual quando o visual mudar.
- **Verifica (gate, nesta ordem, todos devem passar):** `npx tsc --noEmit` → `npm run lint` → `npm run build` → `npx vitest run`. Sem `npm run dev`: o resultado visual é pedido ao usuário e registrado ("conferência visual: pendente/ok"); divergência apontada volta a ser corrigida.
- **Registra (10.2):** arquivos, saídas do gate, telas tocadas e conferência visual.

### 4.3 `/erudio:dev-unit-tests` (backend)
- **Guardrails:** só `src/test`; sem contexto Spring, sem `@SpringBootTest`/`@MockitoBean`; não testa controllers, handler nem métodos padrão do Data; não altera código de produção (bug encontrado vira alerta, não correção); sem comentários.
- **Carrega:** `erudio-spring-boot:testing`, `code-style`, e `pagination`/`hateoas` para as asserções; `backend/06`; seção 7.1.
- **Ordem:** builders `Mock*` com valores previsíveis → testes de service por regra (caminho feliz, `ResourceNotFoundException`, entrada nula, violações de regra, links via `anyMatch`) → mapper → ajuste mínimo de `pom.xml` (surefire com agente do Mockito) se faltar.
- **Verifica:** `./mvnw test -Dtest='*ServiceTest,*MapperTests'` verde; tabela de rastreio `RN-n → teste` sem regra descoberta.
- **Registra (10.3):** testes criados, rastreio, saída.

### 4.4 `/erudio:dev-ui-tests` (frontend)
- **Guardrails:** só `__test__/`, `vitest`/MSW e arquivos de teste; sem E2E (é da integração); preferir papéis acessíveis a `data-testid`; não alterar código de produção.
- **Carrega:** `erudio-frontend:scaffold` (seção de testes); `frontend/06` e `03`; seção 7.2.
- **Ordem:** handlers MSW com o contrato real (HAL, `ProblemDetail`, 404/409, `X-Cart-Token`) → wrapper de `QueryClient` → testes de utilitários/adaptador → hooks → componentes e telas; ajuste das exclusões de cobertura de `core/api` e `store` quando houver MSW.
- **Verifica:** `npx vitest run`, `npx tsc --noEmit`, `npm run lint`; `npm audit` se entrar dependência.
- **Registra (10.4):** testes, cobertura de `AC`/`RN`, saídas.

### 4.5 `/erudio:dev-integration-tests`
- **Guardrails:** Docker obrigatório para o back (perguntar antes de rodar); nunca subir back ou front; E2E é **escrito** aqui e **executado pelo usuário**; sem H2, tag fixa de imagem MySQL; fluxos ordenados rodam a classe inteira; não altera código de produção.
- **Carrega:** `erudio-spring-boot:integration-testing`, `spring-data-jpa` (testes de repository), `pagination`, `hateoas`, `swagger`; `backend/06`, `frontend/06`; seção 7.3.
- **Ordem:** `AbstractIntegrationTest` e `TestConfigs` → testes de repository (`@DataJpaTest`, só `@Query` customizado) → controllers `withjson` (fluxos CRUD ordenados, paginação, validação), CORS (incluindo `X-Cart-Token`), Swagger → specs Playwright (`e2e/*.spec.ts`, fluxo da história).
- **Verifica:** com Docker confirmado, `./mvnw test -Dtest='*IntegrationTest,*ControllerJsonTest,*RepositoryTest'`; `npx playwright test --list` e `tsc` para o E2E; resultado real do E2E informado pelo usuário. ✅ só com o back verde **e** o resultado do E2E recebido (ou história sem E2E). Docker ausente → 🚧 com motivo externo.
- **Registra (10.5):** testes, comandos, saídas, resultado do E2E.

### 4.6 `/erudio:agent-*` (skills finas)
`agent-code-review` (linha 8), `agent-perf-review` (9), `agent-security-review` (10): `disable-model-invocation: true`, `argument-hint: [story]`.
1. Contrato, pré-requisitos (incluindo a revisão anterior ✅/⚪ para 9 e 10), tabela.
2. **No thread principal** coleta os fatos (o agente é só leitura): `git status --porcelain`, `git diff --name-only HEAD`, a lista de arquivos do Registro, os caminhos da história, das specs e de `intentional-decisions.md`.
3. Delega pela ferramenta Agent ao subagente `erudio:code-reviewer` / `perf-reviewer` / `security-reviewer`, com esse pacote no prompt.
4. Valida o formato do relatório (seção 5.3), grava na seção 11.x, aplica a política de severidade e o protocolo de alerta.
5. Passo final de tech debt.
6. **Verificação para ✅:** relatório recebido no formato certo, todos os grupos do checklist reportados (achado ou "checado, sem achados"), nenhum `must-fix` aberto. `should-fix` e `note` não bloqueiam.

`/erudio:agent-tech-debt [story | path…]`: chamada manual a qualquer momento. Resolve a história (opcional) ou analisa os caminhos dados, delega ao `erudio:tech-debt-reviewer` e grava na seção 12. **Não altera nenhuma linha da tabela.**

### 4.7 `/erudio:complete-story`
- **Pré-requisitos:** linhas 3–10 em ✅/⚪, nenhum alerta `Aberto`, nenhum débito `must-fix` sem decisão.
- **Carrega:** contrato; a história inteira; macroplano; `docs/specs/**`; os `CLAUDE.md`, `ARCHITECTURE.md` e `README.md` dos projetos; o guardião visual; o diff da história.
- **Passos:**
  1. Integridade das 11 linhas e dos registros.
  2. Cada `AC-n` tem evidência (registro de implementação, teste ou resultado de verificação).
  3. **Conferência de divergências** entre o implementado e as specs, o plano e a arquitetura (endpoints, DTOs, migrations, rotas, componentes, estado): tabela `item | documento | código | tipo` com tipos "código fora da spec", "spec desatualizada" e "decisão nova"; o usuário decide item a item entre corrigir o código (volta à skill dona), atualizar o documento ou aceitar.
  4. **Atualização dos documentos**, só com base nos registros da história: status da entrega no macroplano; "pontos em aberto" resolvidos e tabelas de alinhamento (`backend/07`, `frontend/07`) nas specs; `ARCHITECTURE.md`/`README.md` do app; guardião visual; `CLAUDE.md` se algum comando mudou. Cada edição é pequena e resumida; nada é inventado.
  5. Seção "Resumo final" e mensagem de commit sugerida via `erudio-git:commit-message` (sem comitar).
  6. Passo final de tech debt sobre o conjunto da história.
- **Verificação para ✅:** passos 1–3 sem pendência, divergências resolvidas ou aceitas, documentos atualizados. Marca "Plano Implementado" ✅ com a data.
- **Guardrails:** edita documentos listados no passo 4 e a própria história; **nunca código**.

## 5. Agentes

Todos: `tools: Read, Grep, Glob` (somente leitura por construção, sem Bash/Write/Edit), `model: sonnet`, sem `permissionMode`/`hooks`. Descrição em inglês, uma linha, "Use this agent when…", dizendo o que **não** é e apontando o vizinho. Corpo na estrutura dos agentes existentes: título e parágrafo ("é auditor, não gerador"); **What this agent does NOT do** (nunca edita; nunca inventa regra que não esteja numa skill/spec — vira "pergunta em aberto"; nunca aponta decisão intencional); **When invoked** (passos); **checklist** em grupos, cada item "Flag X if Y — motivo — fonte"; **Known intentional**; **Output format**.

### 5.1 Decisões intencionais (arquivo único `intentional-decisions.md`, lido por todos)
`ProductRepository.getById` customizado; escrita aberta e sem login (provisório); compra como convidado, `customer_id` nulo, pedido por número UUID; `X-Cart-Token`; só JSON; `DozerMapper` e pacote `repositories`; `@Autowired` em campo; `sortBy` com whitelist (desvio da skill `pagination`); `rating` nulo e `reviewCount` 0 sem módulo de avaliações; sem frete; pagamento simulado; cupom no pedido; estoque único; textos em inglês; migrations só SQL e V1/V2 intocadas; sem perfis dev/prod e sem CI; no front: `react-icons/fa`, tokens e fidelidade ao MultiShop, raio 0, exceção do prefixo `/api/<recurso>/v1`, atribuição do MultiShop no rodapé. Dívidas já catalogadas (`backend/07`, `frontend/07`) entram como `note` "conhecido" e só viram `should-fix`/`must-fix` se o código novo as **ampliar**. O arquivo é atualizado quando as specs mudarem.

### 5.2 Checklists

- **code-reviewer** (correção e conformidade): cada `AC-n`/`RN-n` implementado (e testado); contrato real vs `backend/04` e `frontend/03`; convenções erudio (camadas, Dozer, links no service, `*ControllerDocs`, `@Valid` na interface, `BigDecimal`, exceções e status); migrations (SQL, tipos, nunca editada); estado e dados no front (Query × Zustand, facade, adaptador HAL); tratamento de erro e estados de tela; testes presentes e com asserções reais; código morto, comentários, Lombok, mocks remanescentes.
- **perf-reviewer:** N+1 e `LAZY` com `open-in-view: false`; índices para filtros e ordenações (`name`, `price`, `created_at`, `category_id`); paginação sem teto de `size`; consultas de contagem e de facets; `JOIN FETCH`; escopo de transação; baixa de estoque por update condicional; no front: chaves de query e `refetch`, `staleTime`, re-renders, importações de ícones, imagens, debounce da busca, listas grandes.
- **security-reviewer:** validação de entrada e mass assignment (`rating`/`reviewCount` ignorados em `PUT`); preço e total sempre calculados no servidor; adivinhação do número do pedido e entropia do token do carrinho; injeção em `@Query`; CORS; vazamento de mensagens de erro (500 genérico); corridas em cupom e estoque; segredos no repositório; PII em logs (endereços, e-mails); no front: `dangerouslySetInnerHTML`, o que vai ao `localStorage`, variáveis `NEXT_PUBLIC_*`, dependências. Cada achado traz **cenário de falha concreto** (o que um cliente poderia fazer).
- **tech-debt-reviewer:** duplicação, classes/componentes grandes, números mágicos, abstrações vazando, violação de camadas, `TODO`/`FIXME`, código comentado, nomes inconsistentes, configuração hardcoded, *test smells*, acoplamento a mocks, antipráticas de Spring/JPA e de React/Query/Zustand. Escopo: arquivos da etapa e seus vizinhos diretos. Classifica cada débito como **novo** ou **conhecido** (com o número em `backend/07`/`frontend/07`).

### 5.3 Formato dos achados (pt-BR, igual para os quatro)

```
### <ID> · <must-fix|should-fix|note> · confiança <alta|média|baixa>
- Local: `caminho:linha`
- O que: <fato verificável>
- Por quê: <skill/spec e seção que documentam o correto>
- Correção: <passo concreto>
- Cenário: <só segurança: o que poderia acontecer>
- Classe: <só tech-debt: novo | conhecido (backend/07 #n)>
```

Prefixos: `CR-`, `PF-`, `SEC-`, `TD-`. Cada grupo do checklist termina em "checado, sem achados" ou em achados (nunca em branco). Fecha com `Resumo: N must-fix, N should-fix, N note`. Sem enchimento: sem achado, diz isso. Só afirma o que leu; achado sem linha lida tem confiança `baixa`.

## 6. Política de severidade e protocolo de alerta

**Severidade** (mesma escala dos agentes existentes):

| Nível | Quando |
|---|---|
| `must-fix` | Viola `AC`/`RN`/spec; bug de correção; vulnerabilidade explorável; perda de dados; quebra de regra inviolável (segredo novo, Lombok, migration aplicada editada, commit) |
| `should-fix` | Viola convenção ou degrada desempenho/manutenção sem mudar o comportamento |
| `note` | Observação, oportunidade ou débito já catalogado |

**Confiança:** `alta` (li a linha e a regra é documentada), `média` (depende de algo não confirmado), `baixa` (suspeita para olho humano; **nunca bloqueia**, vai para "Pontos em aberto").

**Bloqueio:** `must-fix` com confiança alta ou média impede o ✅ da etapa em que surgiu e de qualquer etapa seguinte, até ser resolvido.

**Protocolo de alerta:**
1. A skill **para a cadeia**: não marca ✅, não sugere a próxima etapa.
2. Registra na seção 13: `AL-n | origem | severidade | resumo | local | data | status`, com status `Aberto`.
3. A primeira linha da resposta final é `🚨 ALERTA AL-n: <resumo> (<local>)`, seguida de todos os alertas abertos. Achado de segurança leva a marca `[segurança]` e interrompe qualquer outra etapa.
4. O usuário decide: **corrigir** (reexecutar a skill dona em modo de correção para o alerta; depois reexecutar o agente que o achou; status `Corrigido` com a evidência), **aceitar** (decisão explícita registrada na seção 14; status `Aceito`) ou **contestar** (falso positivo registrado; status `Contestado`; se for caso geral, acrescenta-se a `intentional-decisions.md`).
5. **Em auto mode** (ou sem resposta do usuário): a skill nunca aceita nem contesta sozinha; encerra o turno deixando a linha ⏳ e o alerta `Aberto`.
6. `should-fix` e `note` entram na seção 12/11 sem bloquear e são resumidos na resposta final.

## 7. Pontos não verificados e mitigação

| Ponto | Mitigação no desenho |
|---|---|
| Chamar skill de outro plugin pela ferramenta Skill | Fallback: ler o `SKILL.md` pelo caminho no workspace |
| `context: fork` + `agent: erudio:<nome>` | Não usado; delegação pela ferramenta Agent |
| `AskUserQuestion` dentro de subagente | Agentes não perguntam; só as skills no thread principal |
| Padrões de `allowed-tools` com `Bash(...)` | Validar com `claude plugin validate` e na primeira execução |
| Auto mode e `allowed-tools` | Padrões estreitos; regras amplas são removidas no auto mode |
| `CLAUDE.md` da API cita `../erudio-spring-boot-core` (desatualizado) | Skills usam `erudio-spring-boot-premium` |

## Ordem de implementação (quando aprovado)

1. Manifestos e `README.md` do plugin.
2. `story-contract` (SKILL, template, `intentional-decisions.md`).
3. `implement-story`.
4. Os 4 agentes.
5. `agent-code-review`, `agent-perf-review`, `agent-security-review`, `agent-tech-debt`.
6. `dev-backend`, `dev-frontend`, `dev-unit-tests`, `dev-ui-tests`, `dev-integration-tests`.
7. `complete-story`.
8. Comandos de registro e habilitação para o usuário rodar (e proposta da mudança em `.claude/settings.json`).

## Verificação

1. `claude plugin validate` no marketplace e no plugin, sem erro.
2. Instalar com os comandos do usuário e `/reload-plugins`; confirmar que as 11 skills e os 4 agentes aparecem como `erudio:*` e que o plugin está habilitado só no projeto.
3. Rodar `/erudio:implement-story` com uma história descartável: conferir legenda e 11 linhas exatas, ⚪ coerentes, ausência de código, e que o plano **não** é aprovado sem resposta explícita.
4. Rodar `/erudio:dev-backend` com "Plano aprovado" ⏳: deve recusar, sem escrever nada, indicando a skill dona.
5. Conferir a data gravada contra o relógio do sistema.
6. Pedir a um agente para editar um arquivo: não deve ter ferramenta para isso.
7. Simular um `must-fix`: a cadeia para, o alerta é gravado e a linha não vira ✅; repetir sem interação (auto mode) e confirmar que nada é aceito sozinho.
8. Confirmar que cada skill de etapa registra o passo de tech debt antes do ✅.
9. `Grep` nos arquivos do plugin por `git commit`, `git push` e `Lombok` fora de trechos de proibição.
10. Apagar a história descartável ao final.
