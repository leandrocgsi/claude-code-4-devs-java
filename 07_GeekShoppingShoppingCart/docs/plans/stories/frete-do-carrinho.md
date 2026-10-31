# Frete do carrinho

> Slug: `frete-do-carrinho` · Criada em: 26/10/2026 23:02 · Origem: pedido do usuário durante o planejamento de `carrinho-de-compras-com-token-de-convidado`

✅ Concluído · ⏳ Pendente · 🚧 Bloqueado · ⚪ Não se aplica

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

## Contexto

História **reservada e pendente**. O roteiro da entrega 3 menciona frete no cálculo de totais, mas as specs dizem que não há frete (`total = subtotal − discount`) e o macroplano manda remover o frete fixo de 10 do front. Por decisão do usuário (26/10/2026), o frete sai da história `carrinho-de-compras-com-token-de-convidado` e fica aqui, sem planejamento por ora.

Este arquivo é só um marcador: o plano de verdade (escopo, regras, backend, frontend, testes e critérios) será escrito quando o usuário retomar a história com `/erudio:implement-story frete-do-carrinho`. Nada aqui foi aprovado.

## Escopo

### Inclui
_A definir._

### Fora do escopo
_A definir._

## Regras de negócio
_A definir._

## Backend
_A definir._

## Frontend
_A definir._

## Testes
_A definir._

## Riscos
_A definir._

## Pontos em aberto

1. Como o frete é calculado: valor fixo, por faixa de valor, por peso, por região ou grátis acima de um valor.
2. Onde o frete aparece: carrinho, checkout, pedido, ou só no pedido.
3. Se o frete é persistido no pedido (congelado) e como entra em `total`.
4. Impacto nas specs (`backend/03`, `04`, `05`; `frontend/05`, `07` B8) e no macroplano, que hoje dizem "sem frete".
5. Ordem em relação ao checkout e ao pedido (entregas 4 e 5).

## Critérios de aceite
_A definir._

## Implementado

### Backend
_Pendente._

### Frontend
_Pendente._

### Testes de Backend
_Pendente._

### Testes de Frontend
_Pendente._

### Testes de Integração
_Pendente._

## Resultados dos reviews

### Code Review
_Pendente._

### Performance
_Pendente._

### Segurança
_Pendente._

## Alertas e débitos técnicos

_Pendente._

## Fechamento

_Pendente._
