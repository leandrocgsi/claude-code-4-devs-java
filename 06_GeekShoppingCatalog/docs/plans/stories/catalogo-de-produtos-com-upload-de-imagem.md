# Catálogo de produtos: cadastro com upload de imagem e vitrine na Home

> Slug: `catalogo-de-produtos-com-upload-de-imagem` · Criada em: 25/10/2026 17:05 · Origem: macroplano (entregas 1 e 2) e pedido do usuário

✅ Concluído · ⏳ Pendente · 🚧 Bloqueado · ⚪ Não se aplica

| Estado | Etapa | Skill | Data |
|---|---|---|---|
| ✅ | Planejamento | /erudio:implement-story | 25/10/2026 17:10 |
| ✅ | Plano aprovado | /erudio:implement-story | 25/10/2026 17:13 |
| ✅ | Implementação do Backend | /erudio:dev-backend | 25/10/2026 17:36 |
| ✅ | Implementação do Frontend | /erudio:dev-frontend | 25/10/2026 17:55 |
| ✅ | Implementação dos testes de Backend | /erudio:dev-unit-tests | 25/10/2026 19:42 |
| ✅ | Implementação dos testes de Frontend | /erudio:dev-ui-tests | 25/10/2026 22:39 |
| ✅ | Implementação dos testes de Integração | /erudio:dev-integration-tests | 25/10/2026 22:59 |
| ✅ | Agente de Code Review | /erudio:agent-code-review | 25/10/2026 23:13 |
| ✅ | Agente de Review de Performance | /erudio:agent-perf-review | 25/10/2026 23:19 |
| ✅ | Agente de Review de Segurança | /erudio:agent-security-review | 25/10/2026 23:29 |
| ✅ | Plano Implementado | /erudio:complete-story | 25/10/2026 23:36 |

## Contexto

O catálogo é a base do e-commerce e as entregas seguintes (carrinho, checkout, pedido, cupom, pagamento) dependem dele. Hoje o back tem só um CRUD mínimo de produto, com `imageUrl` apontando para endereços fictícios, e o front roda inteiro sobre um mock (`USE_MOCK_PRODUCT_DATA`). Esta história reúne as **entregas 1 e 2** do macroplano (`docs/plans/macroplano-geek-shopping.md`) com um foco novo: o **cadastro de produtos com upload de imagem**, guardando tudo, imagem inclusive, em **uma única tabela**.

Entrega: o back com o cadastro, a imagem no banco, listagem com filtros, ordenação e facets e um catálogo novo de 14 produtos; e o front consumindo a API real na Home, em `/products`, em `/products/[id]` e numa tela de cadastro em `/admin/products`. Não há login: o cadastro fica aberto. Esta é a primeira história, sem dependências.

Aproveita o que já existe: `ProductController`, `ProductControllerDocs`, `ProductService`, `ProductRepository`, `Product`, `ProductDTO` e `DozerMapper` no back; `Home`, `Products`, `ProductCard`, `ShopSidebar`, `ProductDetails`, `Header`, `DataTable`, `Modal`, `useProducts` e `productsService` no front. Só se alinha o que a história precisa; o restante das divergências catalogadas em `docs/specs/*/07-*` fica como está.

### Decisões tomadas

| # | Decisão | Origem |
|---|---|---|
| D-1 | Todas as informações do produto, imagem incluída, ficam na tabela `products` (sem tabelas de categoria, cor, tamanho ou imagem) | usuário, 25/10/2026 |
| D-2 | Campos: os atuais mais preço antigo, destaque, data de criação, cor, tamanho (um valor cada), popularidade, rating e contagem de avaliações (nulos por ora) | usuário, 25/10/2026 |
| D-3 | Upload em uma requisição `multipart` (partes `product` e `image`); `GET /api/product/v1/{id}/image` devolve os bytes | usuário, 25/10/2026 |
| D-4 | Formatos aceitos: JPEG, PNG, WebP e GIF, até 5 MB; o crop é opcional e acontece no navegador, que converte para JPG | usuário, 25/10/2026 |
| D-5 | O cadastro devolve `201 Created` com `Location` | usuário, 25/10/2026 |
| D-6 | Front com `/admin/products` (lista e formulário), `/products` e `/products/[id]` além da Home; `/products` filtra no servidor | usuário, 25/10/2026 |
| D-7 | O carrinho local continua funcionando, buscando os produtos na API, até a entrega 3 | usuário, 25/10/2026 |
| D-8 | Catálogo novo de 14 produtos em 6 categorias (Caneca, Camiseta, Boneco de ação, Moletom, Livro, Acessório), substituindo os atuais; imagens gravadas no banco por migration SQL gerada por script Python | usuário, 25/10/2026 |
| D-9 | `00_no_image.jpg` é o placeholder de produto sem imagem, no front; não entra no seed | usuário, 25/10/2026 |
| D-10 | Toda migration Flyway é SQL puro (`V{N}__Descricao.sql`), nunca Java; vale para o projeto inteiro | usuário, 25/10/2026 |
| D-11 | Produto sem estoque continua listado e marcado como esgotado (produto 3) | usuário, 25/10/2026 |

## Escopo

### Inclui

- Back: cadastro, edição e exclusão de produto com imagem; endpoint da imagem; listagem paginada com filtros e `sortBy`; `facets`, `categories`, `featured` e `recent`; validação com erro por campo; migrations (esquema, catálogo novo e imagens); script Python gerador da migration de imagens.
- Front: Home, `/products` e `/products/[id]` na API real; `/admin/products` com lista, formulário, upload, crop e pré-visualização; placeholder de imagem; selo de esgotado; remoção do mock; carrinho local alimentado pela API.
- Os alinhamentos de `07-alinhamento-*` que esta história precisa tocar (ver Backend e Frontend).

### Fora do escopo

Carrinho no servidor, checkout, pedido, cupom, pagamento; avaliações (módulo `Review`); banners, newsletter e contato; frete; login e proteção dos endpoints de escrita; perfis dev/prod, CI e credenciais do `application.yml`; reindentação do `pom.xml`; troca de starters que a história não precisa; tabelas de categoria, cor e tamanho das specs; redimensionamento de imagem no servidor.

## Regras de negócio

| ID | Regra | Fonte |
|---|---|---|
| RN-1 | Produto e imagem vivem na tabela `products`: bytes (`image`), tipo (`image_content_type`) e tamanho em bytes (`image_size`) | D-1 |
| RN-2 | Campos e validação: `name` obrigatório (≤150); `description` obrigatória (≤255); `price` > 0, `BigDecimal` com 2 casas; `oldPrice`, se informado, > `price`; `category` obrigatória (≤100), texto livre; `quantity` ≥ 0; `color` (≤50) e `size` (≤20) opcionais; `featured` padrão falso | D-2; `backend/05-modulos.md` (Catálogo) |
| RN-3 | `createdAt`, `popularity`, `rating` e `reviewCount` são do servidor: aparecem na resposta e são ignorados no corpo de `POST`/`PUT`; `rating` nulo e `reviewCount` 0 até existirem avaliações | `backend/03-modelo-de-dados-e-migracoes.md` |
| RN-4 | Upload: `multipart` com as partes `product` (JSON) e `image` (arquivo); tipo verificado pelo conteúdo (JPEG, PNG, WebP, GIF); máximo de 5 MB; inválido devolve 400 com mensagem no campo `image`; `PUT` sem a parte `image` mantém a imagem atual | D-3, D-4 |
| RN-5 | `GET /api/product/v1/{id}/image` devolve os bytes com o `Content-Type` guardado; 404 se o produto não existe ou não tem imagem; o DTO traz `imageUrl` quando há imagem e nulo quando não há; `imageUrl` é um caminho relativo à API, que o front compõe com a URL base da API (front e API têm origens diferentes); o endpoint declara `produces` de imagem (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) e responde com `ETag` e `Cache-Control` | D-3 |
| RN-6 | Crop e conversão para JPG ocorrem no navegador; o back guarda a imagem como chegou, sem processá-la | D-4 |
| RN-7 | Listagem, detalhe em JSON, destaques, recentes, facets e categorias **não carregam a coluna da imagem**; só o endpoint da imagem a lê | D-1; checklist de performance |
| RN-8 | Produto com `quantity` 0 continua listado (Home, `/products`, detalhe) e é marcado como esgotado; o botão de adicionar ao carrinho fica desabilitado | D-11; `backend/05-modulos.md` |
| RN-9 | Paginação: `page` (0), `size` (12, máximo 100), `direction` (`asc`/`desc`) e `sortBy` em `name`, `price`, `createdAt`, `popularity`, `rating` (padrão `name`); valor inválido devolve 400; desempate por `id`; sem nota vai ao fim; resposta em `PagedModel` HAL | `backend/04-contrato-da-api.md` |
| RN-10 | Filtros com E lógico: `q` (nome e descrição, sem diferenciar maiúsculas), `category` (nome), `minPrice`, `maxPrice`, `color` e `size` (repetíveis, valem como "ou") e `featured`; `direction` fora de `asc`/`desc` e `minPrice` maior que `maxPrice` devolvem 400; `%` e `_` em `q` valem como texto literal | `backend/04`; adaptado de ids para nomes por D-1 |
| RN-11 | `GET /facets` conta, sobre o conjunto filtrado, faixas de preço (de 100 em 100, a última aberta), cores, tamanhos e categorias | `backend/04` |
| RN-12 | As categorias são derivadas dos produtos: `GET /categories` devolve nome e contagem, nunca persistidos | D-1 |
| RN-13 | `GET /featured` (destaques) e `GET /recent` (por `createdAt` decrescente) são atalhos paginados | `backend/04` |
| RN-14 | Seed: 14 produtos em 6 categorias, ids de 1 a 14 coincidindo com o número do arquivo da imagem; produto 3 com estoque 0 e fora dos destaques; destaques 1, 4, 8, 9, 10 e 11; datas de criação de 01/10/2026 a 14/10/2026 às 10:00; popularidade fixa; rating nulo | D-8; proposta aprovada em 25/10/2026 |
| RN-15 | Migrations em SQL puro e nunca editadas depois de aplicadas (V1 e V2 intactas); a migration das imagens é gerada por script com um `UPDATE` por produto, localizado pelo nome, gravando `image` como literal hexadecimal, `image_content_type` e `image_size` | D-10 |
| RN-16 | Nenhuma tela lê `app/core/mocks`; busca, filtros, ordenação e página ficam na URL de `/products`; o menu de categorias do Header e a grade da Home vêm da API | D-6; `frontend/05-telas-e-modulos.md` |
| RN-17 | Produto sem imagem mostra o placeholder (`00_no_image.jpg`) | D-9 |
| RN-18 | O card omite as estrelas quando `rating` é nulo | `frontend/05-telas-e-modulos.md` |
| RN-19 | O carrinho local segue em memória, resolve cada produto por `GET /api/product/v1/{id}`, sem pré-semeio, até a entrega 3 | D-7 |
| RN-20 | Status: `POST` 201 com `Location`; `PUT` 200; `DELETE` 204; `PUT` e `DELETE` de id inexistente 404; entrada inválida 400 em `ProblemDetail` com `errors{}`; o `PUT` traz o `id` na parte `product`, como hoje | D-5; `backend/04` |
| RN-21 | O cadastro (endpoints de escrita e `/admin/products`) é aberto, sem login | D-6; `backend/01-visao-e-stack.md` |

## Backend

Ordem de implementação, em `geek-shopping-api`, sem código:

1. **Dependência e configuração.** `spring-boot-starter-validation` no `pom.xml`; limites de `multipart` no `application.yml` (arquivo até 5 MB, requisição um pouco acima); `Location` exposto no CORS (`WebConfig`), para o front lê-lo.
2. **Migrations (SQL puro; V1 e V2 intactas):**
   - `V3__Alter_Table_Products_Add_Catalog_Columns.sql`: colunas novas, com nulabilidade e padrão que não quebram as linhas que ainda existem: `old_price` `decimal(65,2)` nulo; `featured` `bit(1)` não nulo, padrão `b'0'`; `created_at` `datetime(6)` não nulo, padrão `CURRENT_TIMESTAMP(6)`; `color` `varchar(50)` nulo; `size` `varchar(20)` nulo; `popularity` `int` não nulo, padrão 0; `rating` `decimal(3,2)` nulo; `review_count` `int` não nulo, padrão 0; `image` `longblob` nulo; `image_content_type` `varchar(50)` nulo; `image_size` `int` nulo. Remove `image_url` (que é `NOT NULL` e não teria valor no seed novo) e corrige os tipos sem *display width* (`bigint`, `int`). Roda antes da V4.
   - `V4__Replace_Products_With_Catalog_Seed.sql`: apaga os 10 produtos atuais, reinicia o `AUTO_INCREMENT` e insere os 14 produtos da proposta aprovada, com valores determinísticos. **É destrutiva** (substitui qualquer produto existente) e o `AUTO_INCREMENT` reiniciado é DDL, não transacional.
   - `V5__Populate_Product_Images.sql`: **gerada pelo script** (item 3), um `UPDATE` por produto.
3. **Script `scripts/generate_product_images_migration.py`** (Python). Recebe a pasta das imagens como argumento (`D:\Code\erudio-microservices-dotnet6\ShoppingImages`); mapeia cada arquivo `N_*.jpg` ao nome do produto; ignora `00_no_image.jpg`; falha se faltar um arquivo ou sobrar um não mapeado; confere o tipo pelos bytes (JPEG); descobre o próximo número em `db/migration`; escreve `V{N}__Populate_Product_Images.sql` (em que N é o número descoberto) com um `UPDATE products` por produto, que grava `image` como literal hexadecimal `X'...'`, `image_content_type` como `image/jpeg` e `image_size` em bytes, localizando a linha pelo nome do produto (aspas escapadas); nunca sobrescreve uma migration existente; opção de ensaio sem gravar. **O código do script é mostrado ao usuário antes de ser executado.**
4. **Entidade `Product`**: novos campos, `BigDecimal` no preço, `equals`/`hashCode` por getters formatados; **nenhuma leitura que não seja a da imagem carrega o BLOB**: listagem, detalhe, destaques, recentes, facets e categorias usam projeções para DTO sem a coluna `image`; a imagem sai de uma consulta dedicada que lê só o tipo e os bytes; o `getById` documentado fica restrito ao fluxo de escrita, e a gravação da imagem usa uma atualização dedicada, para que um `PUT` sem imagem não leia nem regrave o BLOB.
5. **`ProductRepository`**: consultas customizadas de listagem filtrada, facets, categorias e imagem; mantém o `getById` documentado.
6. **DTOs**: `ProductDTO` de resposta (HAL, `imageUrl` derivado); DTO de entrada com as constraints de RN-2; DTOs de facets e de categoria.
7. **`ProductService`**: regras de RN-2 e RN-3, validação da imagem (tipo pelo conteúdo, tamanho), filtros e `sortBy` com lista permitida, `PagedModel` com `PagedResourcesAssembler`, links HATEOAS no service. Payloads propostos: `GET /facets` devolve `priceRanges` (`min`, `max`, `count`; a última sem `max`), `colors`, `sizes` e `categories` (cada um com `name` e `count`); `GET /categories` devolve uma lista de `name`, `productCount` e `imageUrl`, este do produto mais recente da categoria que tem imagem (só o caminho, sem ler o BLOB).
8. **Exceções e handler**: `BadRequestException`; tratamento de validação (os dois ganchos) com `errors{}`; `type` `about:blank`; estouro do limite de upload (`MaxUploadSizeExceededException`) vira 400 `ProblemDetail` com `errors.image`, não 500; catch-all sem vazar a mensagem.
9. **Controller e `ProductControllerDocs`**: `POST` (201 com `Location`, via `ResponseEntity`) e `PUT` em `multipart`, `GET /{id}/image` (com `produces` de imagem, `ETag` e `Cache-Control`), `GET /facets`, `/featured`, `/recent`, `/categories`; `produces`/`consumes` em todos; `@Valid` só na interface; `@Tag` sem duplicar; Swagger com os status reais (201, 400, 404).

Alinhamentos de `backend/07-alinhamento-do-codigo-atual.md` tocados: `Double` → `BigDecimal`; `Page` → `PagedModel`; validação; handler; `serialVersionUID` das exceções; migration dos *display widths*; Swagger e `produces` dos endpoints tocados; `equals` das classes alteradas.

## Frontend

Em `geek-shopping-app`, sem código; segue `frontend/02`–`05` e o guardião `geek-shopping-app-visual-identity`.

1. **Modelos e dados**: `Product` com `oldPrice`, `featured`, `createdAt`, `color`, `size`, `popularity`, `rating?`, `reviewCount?`, `imageUrl?`; `PageResponse` via **adaptador HAL** (com e sem `_embedded`); `ApiError` lendo `ExceptionResponse` e `ProblemDetail` (`errors{}`) e o `Location` do `201`; um único caminho de acesso à API (hoje há rewrite e `baseURL`); o `imageUrl` relativo é composto com a URL base da API e as imagens da API usam o elemento `img` comum, sem `next/image`, então não exigem `remotePatterns`; o `Location` serve para abrir o produto recém-criado.
2. **Services**: `productsService` (listagem com filtros, detalhe, facets, featured, recent, categories, criar e editar com `FormData`, excluir); remove `USE_MOCK_PRODUCT_DATA` e `app/core/mocks`.
3. **Hooks**: `useProducts`, `useProduct`, `useFacets`, `useCategories`, `useFeaturedProducts`, `useRecentProducts` e as mutações de cadastro, edição e exclusão; chaves de query com os filtros; página volta a 0 ao mudar um filtro; invalidação após cada mutação.
4. **Estado**: dados do servidor no TanStack Query; filtros e página na URL; o carrinho local (Zustand, via hook-fachada) passa a resolver produtos pela API, sem pré-semeio (RN-19).
5. **Design system**: `Pagination`, `Spinner`, `EmptyState`, `InlineAlert`, `Toast`, `PriceTag` (preço atual e `oldPrice` riscado), `RatingStars` (omitido sem nota), selo de esgotado, e um **recorte de imagem** (crop) que gera JPEG no navegador; reaproveita `Button`, `Input`, `Select`, `Modal`, `DataTable`, `SectionTitle`.
6. **Telas** (cada uma com carregando, vazio e erro; páginas finas):
   - **Home**: grade de categorias com contagem, destaques e recentes da API; hero, banners, selos e vendors seguem estáticos; menu de categorias do Header vem da API.
   - **`/products`**: sidebar com facets (preço, cor, tamanho, categoria), busca, ordenação (Latest, Popularity, Best Rating, nome, preço), tamanho de página, grid/lista, paginação; quick view alimentado pelos dados carregados.
   - **`/products/[id]`** (nova): imagem, nome, `PriceTag`, estrelas se houver, descrição, quantidade e "Add to Cart"; 404 tratado; esgotado desabilita o botão. Sem equivalente no MultiShop: compõe com tokens e componentes existentes.
   - **`/admin/products`** (nova, aberta): lista (`DataTable` com miniatura, nome, categoria, preço, estoque, destaque, ações) e formulário (campos de RN-2, seleção de arquivo, recorte opcional, pré-visualização, validação do tipo e dos 5 MB antes de enviar, erros por campo), com confirmação de exclusão.
7. **Placeholder**: `00_no_image.jpg` vira asset público do app, usado quando `imageUrl` é nulo ou a imagem falha.
8. **Visual**: tokens, raio 0, `react-icons/fa` e atribuição do MultiShop; consultar os HTML de `MultiShop/` das telas existentes; atualizar o guardião visual se o inventário de componentes mudar; sem `npm run dev` (o usuário confere as telas).

Alinhamentos de `frontend/07-alinhamento-do-app-atual.md` tocados: mocks e flag (A1), caminho único da API (A2, A3), `ApiError` (A4), modelo de `Product` e usos (B4, B5), categorias e menu do Header (B6), filtros no servidor (B1 a B3, B15), detalhe (B13), imagens (B14), docs defasados (A9).

## Testes

- **Unitários de backend** (`dev-unit-tests`): regras de RN-2 e RN-3 no service; validação da imagem (tipo pelo conteúdo, tamanho); `sortBy` e filtros inválidos; montagem do `PagedModel` e dos links; mapper e `imageUrl` derivado; builders `MockProduct`.
- **Testes de UI** (`dev-ui-tests`): adaptador HAL (com e sem `_embedded`), normalização de erro e leitura do `Location`; hooks (chaves com filtros, reset de página, invalidação); `RatingStars`, `PriceTag`, selo de esgotado; formulário de cadastro (validação por campo, tipo e tamanho, recorte gerando JPEG); estados carregando, vazio e erro das telas novas.
- **Integração** (`dev-integration-tests`, exige Docker): REST Assured + Testcontainers MySQL; fluxo ordenado de cadastro, leitura da imagem, edição com e sem imagem e exclusão; caminhos de erro (400 de validação, 400 de tipo e tamanho, 404); filtros combinados, `sortBy`, paginação HAL, `facets`, `categories`, `featured` e `recent`; CORS expondo `Location`; teste de repositório das consultas customizadas; um teste de fumaça do seed (14 produtos, 6 categorias, todos com imagem, produto 3 sem estoque). Specs Playwright do fluxo Home → produto → cadastro de produto com imagem, **escritas aqui e executadas pelo usuário**.
- Cobertura complementar: **AC-16** (Swagger) por integração em `/v3/api-docs` e `/swagger-ui/index.html`; **AC-9** inclui um ensaio do script (modo sem gravar) e a checagem de que a migration gerada contém só `UPDATE` em SQL; **AC-15** por busca de `app/core/mocks` e de `USE_MOCK_PRODUCT_DATA` no código, além do `build`; **RN-3 e RN-9** (rating): o teste insere `rating` direto pelo repositório para provar a ordenação por nota e o envio de `createdAt`, `rating` e `popularity` no corpo; **RN-5**: 404 da imagem para produto inexistente e para produto sem imagem; **RN-8, RN-16, RN-17 e RN-19** nos testes de UI (selo e botão desabilitado, menu do Header vindo da API, placeholder, carrinho local resolvendo pela API).
- Dependências de teste a acrescentar: no back, Testcontainers MySQL, REST Assured e os starters de teste; no front, `msw` e `@playwright/test`.
- Cada `RN` tem pelo menos um teste; os testes criam seus próprios dados, sem depender de seed volátil. A única exceção declarada é o teste de fumaça do seed.

## Riscos

- **BLOB na tabela de produtos**: qualquer consulta que o carregue sem querer encarece listagens (por isso RN-7 e a revisão de performance); aumenta o banco e os backups.
- **Upload aberto sem login**: qualquer cliente pode enviar arquivos de até 5 MB; risco aceito por D-6/RN-21, a revisar quando o login for decidido.
- **Validação da imagem**: o tipo precisa ser conferido pelo conteúdo, não só pelo nome ou cabeçalho.
- **Memória no upload**: 5 MB por requisição, em memória, multiplicado pela concorrência.
- **Migration de imagens grande**: cerca de 2 MB de hexadecimal; depende do `max_allowed_packet` do MySQL (cada `UPDATE` tem até ~290 KB) e fica imutável depois de aplicada.
- **Localizar por nome no seed**: o `UPDATE` casa pelo nome; nomes repetidos (inexistentes no seed) atingiriam mais de uma linha.
- **Cor e tamanho de um valor só**: limita os filtros; a modelagem das specs era N:N.
- **Categoria como texto livre**: erros de digitação criam categorias novas; a grade da Home as reflete.
- **Remover o mock**: o carrinho local e o menu do Header dependiam dele; tratados em RN-16 e RN-19.
- **Specs defasadas**: tabela única diverge de `backend/03`–`05` e `frontend/03`; registrar para atualização.
- **Pasta das imagens fora do repositório**: o script só roda onde a pasta existe, mas a migration gerada é autossuficiente.
- **Leitura da imagem sem cache**: cada card baixaria o BLOB do banco a cada visita; mitigado por `ETag` e `Cache-Control` no endpoint da imagem.
- **V4 é destrutiva**: apaga qualquer produto existente; só é segura em base de desenvolvimento ou sem dados reais.
- **Validação por assinatura de bytes**: não confere dimensões nem GIF animado grande; o limite de 5 MB reduz, mas não elimina, o custo de uma imagem hostil.
- **`X-Content-Type-Options: nosniff` do app**: exige o `Content-Type` correto na resposta da imagem.

## Pontos em aberto

1. **Coluna `image_url`**: a remoção (V3) deriva de D-1/D-8 (imagem no banco) e será considerada confirmada quando o plano for aprovado.
2. **Nome original do arquivo**: o script grava só `image`, `image_content_type` e `image_size`; decidir se guarda o nome (coluna a mais).
3. **Remover só a imagem de um produto**: não definido; sugestão `DELETE /api/product/v1/{id}/image` (204). Sem isso, a imagem só pode ser substituída, nunca removida.
4. **Texto do selo de esgotado**: a UI é em inglês; sugestão "Sold out"; alternativa "Esgotado".
5. **Biblioteca de crop** do front: a escolher no `dev-frontend` (verificar a documentação atual).
6. **Payloads de `/facets` e `/categories`**: propostos no Backend (item 7), inclusive a imagem de cada categoria na Home; confirmar ao aprovar o plano.
7. **Estratégia do BLOB**: proposta no Backend (item 4), com projeções e consulta dedicada; o carregamento tardio com instrumentação de bytecode fica descartado, salvo decisão em contrário.
8. **Caminho único de acesso à API no front**: sugestão, chamada direta com CORS (removendo o rewrite).
9. **Unicidade do nome do produto**: o `UPDATE` do seed depende dela; decidir se vira índice único.
10. **`PUT` com id no corpo** (como hoje) ou `PUT /{id}`: manter o atual, salvo decisão em contrário.
11. **Specs a atualizar** para refletir a tabela única, categorias derivadas, filtros por nome e upload (`backend/03`, `04`, `05`; `frontend/03`).
12. **`ConflictException`/409**: não é necessária nesta história (sem exclusão bloqueada por referência).
13. **Plano a atualizar (origem: `dev-backend`, 25/10/2026):** RN-15, Backend itens 2 e 3, o AC-9, a seção Testes e o TD-5 ainda descrevem `V4__Replace_Products_With_Catalog_Seed.sql` e `V5__Populate_Product_Images.sql` com `UPDATE`. O que existe, por decisão do usuário, é `V4__Truncate_Table_Products.sql` e `V5__Insert_Data_In_Products_Catalog.sql` com `INSERT` e blobs, gerada pelo script. O teste "a migration gerada contém só `UPDATE`" do AC-9 deve passar a verificar `INSERT` com `image`, `image_content_type` e `image_size`. Atualizar via `/erudio:implement-story` ou pelo usuário.
14. **Teto de preço (origem: `dev-backend`):** `@Digits(integer = 9, fraction = 2)` limita preço e preço antigo a 999.999.999,99 para evitar estouro de inteiro nos facets (TD-17); confirmar o teto.
15. **Parte `product` do multipart (origem: `dev-backend`, para o `dev-frontend`):** o `FormData` precisa enviar a parte `product` como `Blob` com `type: application/json`; texto simples gera 415.
16. **Filtro `productSize` (origem: `dev-backend`):** o filtro de tamanho do produto se chama `productSize` na listagem e nos facets; `size` continua sendo o tamanho da página e o nome do campo no JSON. O front e as specs devem usar `productSize`.
17. **Banco já existente (origem: `dev-backend`):** `spring.flyway.baseline-on-migrate: true` e `baseline-version: 2` ficam ligados no `application.yml`; documentar em `backend/03`. Em banco não vazio e sem histórico, o Flyway assume as versões até a 2 como já aplicadas.
18. **Docs do app (origem: `dev-frontend`):** `README.md` e `ARCHITECTURE.md` do app ainda descrevem o modo mock e `useProductFilters`; atualizar no fechamento.
19. **Vulnerabilidades (origem: `dev-frontend`):** `npm audit` aponta 9 já existentes (1 crítica no `next` 16.3.5, 5 altas); `npm audit fix` não foi rodado por estar fora do escopo.
20. **Runtime não exercitado (origem: `dev-frontend`):** o multipart real do axios, o `Location` (não lido: o corpo já traz o produto) e a conferência visual dependem de rodar API e front juntos.
21. **Escolhas de UI (origem: `dev-frontend`):** cor e tamanho do filtro são seleção única; não há toast (feedback em `InlineAlert`); depois de excluir no admin a página volta a 0; produto removido do catálogo só sai do carrinho quando o carrinho é aberto.
22. **Teste de repositório adiantado (origem: `dev-unit-tests`):** a seção Testes desta história põe o teste de repositório na integração, mas a skill `dev-unit-tests` o manda para esta etapa; ele foi escrito aqui (`ProductRepositoryTest`, 27 testes) e a integração não precisa repeti-lo.
23. **Banco local migrado pelo `StartupTests` (origem: `dev-unit-tests`):** `./mvnw test` aplicou V3, V4 e V5 no banco local `geek-shopping` (a V4 apagou os produtos antigos). O `StartupTests` deve passar a usar o container na etapa de integração (TD-39).
24. **Container do teste de repositório (origem: `dev-unit-tests`):** o container do `ProductRepositoryTest` deve virar o do `AbstractIntegrationTest` (TD-38), e `unittests/file` e `unittests/validation` entram no spec `backend/06`.
25. **`msw` instalado com `--legacy-peer-deps` (origem: `dev-ui-tests`):** o `npm install -D msw` puro falhou com um erro interno do npm (`edgesOut`). O `package-lock.json` já vinha alterado por etapas anteriores; conferir ao fechar a história se uma instalação limpa (`npm ci`) funciona.
26. **`npm audit` (origem: `dev-ui-tests`):** de 9 para 8 vulnerabilidades depois da instalação; o `msw` não aparece na lista, que continua tendo `next`, `vitest` e outros já conhecidos (ponto 19). Nada foi corrigido com `npm audit fix`.
27. **Transporte dos testes (origem: `dev-ui-tests`):** os testes de UI usam o adapter `fetch` do axios; o upload multipart por XHR só será provado pelos specs do Playwright (TD-55).
28. **Specs Playwright escritos e não executados (origem: `dev-integration-tests`):** o usuário aceitou a etapa sem o E2E; AC-10 a AC-15 seguem sem prova em navegador. Para rodar quando quiser: `npm run e2e` (com API em `:8080`, app em `:3000` e `npx playwright install chromium` na primeira vez) e informar o resultado.
29. **`createdAt` do `POST` (origem: `dev-integration-tests`):** ver TD-59; decidir se o service passa a truncar para microssegundos.
30. **`rest-assured` e `@playwright/test` (origem: `dev-integration-tests`):** `rest-assured` 6.3.0 fica numa property do `pom.xml`; o `@playwright/test` foi instalado com `--legacy-peer-deps`, como o `msw` (ponto 25).

## Critérios de aceite

| ID | Critério | Regras |
|---|---|---|
| AC-1 | `POST` multipart cria o produto com imagem: 201, `Location` e corpo com `imageUrl`; `GET` da imagem devolve os bytes com o `Content-Type` guardado | RN-1, RN-4, RN-5, RN-20 |
| AC-2 | Dados inválidos (nome vazio, `price` ≤ 0, `oldPrice` ≤ `price`, `quantity` < 0) devolvem 400 `ProblemDetail` com `errors{}` por campo, nunca 500 | RN-2, RN-20 |
| AC-3 | Imagem de tipo não aceito ou maior que 5 MB devolve 400 com mensagem no campo `image` | RN-4 |
| AC-4 | `PUT` sem a parte `image` mantém a imagem; com `image` a substitui | RN-4 |
| AC-5 | `DELETE` devolve 204 e o `GET` seguinte devolve 404 | RN-20 |
| AC-6 | A listagem pagina e ordena; `sortBy` ou `direction` inválidos, `size` > 100, página negativa e `minPrice` > `maxPrice` devolvem 400; os filtros combinados retornam o conjunto correto | RN-9, RN-10 |
| AC-7 | `facets`, `categories`, `featured` e `recent` respondem conforme os payloads propostos no Backend (item 7) | RN-11, RN-12, RN-13 |
| AC-8 | Listagem e detalhe JSON não carregam o BLOB | RN-7 |
| AC-9 | As migrations aplicam do zero e deixam 14 produtos em 6 categorias, todos com imagem, produto 3 com estoque 0; V1 e V2 intactas; o script gera a migration seguinte em SQL puro | RN-14, RN-15 |
| AC-10 | O produto 3 aparece listado na Home e em `/products`, marcado como esgotado e sem botão de carrinho ativo | RN-8 |
| AC-11 | A Home mostra categorias com contagem, destaques e recentes vindos da API; sem imagem mostra o placeholder; sem `rating` não mostra estrelas | RN-16, RN-17, RN-18 |
| AC-12 | `/products` filtra, ordena e pagina no servidor, com tudo na URL e a sidebar vinda dos facets | RN-10, RN-11, RN-16 |
| AC-13 | `/products/[id]` mostra o produto, trata 404 e adiciona ao carrinho local, que busca o produto na API | RN-8, RN-19 |
| AC-14 | `/admin/products` lista, cria, edita e exclui; o formulário tem upload, recorte opcional que gera JPEG, pré-visualização e erros por campo | RN-2, RN-4, RN-6, RN-21 |
| AC-15 | Nenhuma tela lê `app/core/mocks` (a pasta deixa de existir); cada tela de dados tem carregando, vazio e erro | RN-16 |
| AC-16 | O Swagger descreve os status e corpos reais (multipart, 201, 400, 404) | RN-20 |
| AC-17 | Campos do servidor (`createdAt`, `popularity`, `rating`, `reviewCount`) enviados no corpo são ignorados; `sortBy=rating` coloca os produtos sem nota no fim | RN-3, RN-9 |

## Implementado

### Backend

Concluído em 25/10/2026 17:36, com todos os pré-requisitos em ✅ ou ⚪.

**Endpoints** (`/api/product/v1`, JSON; `POST` e `PUT` em `multipart/form-data`):

| Verbo e caminho | Sucesso | Observação |
|---|---|---|
| `GET` | 200 `PagedModel` HAL | `page`, `size` (1 a 100), `direction`, `sortBy`, `q`, `category`, `minPrice`, `maxPrice`, `color`, `productSize` (repetíveis), `featured` |
| `GET /featured` | 200 `PagedModel` | `page`, `size`; ordena por popularidade decrescente |
| `GET /recent` | 200 `PagedModel` | `page`, `size`; ordena por `createdAt` decrescente |
| `GET /facets` | 200 `FacetsDTO` | mesmos filtros da listagem |
| `GET /categories` | 200 lista de `CategoryDTO` | nome, contagem e `imageUrl` |
| `GET /{id}` | 200 `ProductDTO` | 404 se não existe |
| `GET /{id}/image` | 200 bytes | `Content-Type` guardado, `ETag`; 404 sem produto ou sem imagem |
| `POST` | 201 + `Location` | partes `product` (JSON) e `image` (opcional) |
| `PUT` | 200 | `id` dentro da parte `product`; sem `image` mantém a atual |
| `DELETE /{id}` | 204 | 404 se não existe |

**Arquivos criados:** `V3__Alter_Table_Products_Add_Catalog_Columns.sql`, `V4__Truncate_Table_Products.sql`, `V5__Insert_Data_In_Products_Catalog.sql` (gerada, 2.024.847 bytes); `scripts/generate_product_images_migration.py`; `model/ProductImage`; `repositories/ProductImageRepository`; `data/dto/CategoryDTO`, `FacetItemDTO`, `FacetsDTO`, `PriceRangeDTO`, `request/ProductRequestDTO`, `request/ProductFilter`; `exception/BadRequestException`, `InvalidImageException`; `file/ImageTypeDetector`; `validation/OldPriceGreaterThanPrice` e o validador.

**Arquivos alterados:** `pom.xml`, `application.yml`, `config/WebConfig`, `model/Product`, `data/dto/ProductDTO`, `repositories/ProductRepository`, `services/ProductService`, `controllers/ProductController`, `controllers/docs/ProductControllerDocs`, `exception/ResourceNotFoundException`, `exception/RequiredObjectIsNullException`, `exception/handler/CustomEntityResponseHandler`. V1 e V2 intactas.

**Verificação:**
- `./mvnw -q clean package -DskipTests`: sucesso (jar com a V5 dentro).
- Flyway CLI 12.4.0 (mesma versão do projeto) contra MySQL 9.1.0 em Docker, container temporário já removido: do zero, 5 migrations até a v5; num banco que já tinha V1 e V2 sem histórico, sem baseline o Flyway recusa e com `baselineOnMigrate` e `baselineVersion=2` aplica V3 a V5.
- Dados no banco: 14 produtos, 14 com imagem, 6 categorias, 6 destaques, produto 3 com estoque 0 e fora dos destaques, ids de 1 a 14, `image_size` igual ao tamanho do blob, soma de 1.009.491 bytes e **MD5 de cada blob idêntico ao do arquivo original (14 de 14)**.
- `dependency:tree`: `flyway-core` e `flyway-mysql` seguem em 12.4.0 (sem regressão); `spring-boot-flyway`, `spring-boot-hateoas` e `hibernate-validator` agora no classpath.
- Conformidade: sem Lombok, sem comentários nos Java alterados, sem migration em Java, sem *display width* nas migrations novas.
- Consulta ao Context7 (Spring Boot 4.1 e Flyway) confirmou a necessidade do módulo do Flyway no classpath e a semântica do `baselineOnMigrate`.

**Não verificado em execução** (a aplicação não foi iniciada): as consultas JPQL do `ProductRepository` (principalmente o atributo `size`, a função `FLOOR` e `nullsLast` no MySQL), o `PUT` multipart, o mapeamento do Dozer com `LocalDateTime`, o `UPDATE` de `@Lob` e os links HATEOAS com `methodOn`. O Spring Data valida os `@Query` na subida do contexto, então uma falha apareceria já ao iniciar a aplicação; os testes de integração (`/erudio:dev-integration-tests`) cobrem o restante.

**Regras e critérios cobertos pela implementação:** RN-1 a RN-15, RN-20 e RN-21 (lado do back); AC-1 a AC-9, AC-16 e AC-17, **sem testes ainda**; AC-10 a AC-15 são do front.

**Desvios do plano** (decididos durante a implementação):
- V4 virou uma migration só de `TRUNCATE`, e a V5 é a migration de dados **com os blobs no próprio `INSERT`**, gerada pelo script; **não existe V6 com `UPDATE`** (decisão do usuário em 25/10/2026, a migration nunca tinha sido aplicada).
- O script guarda o catálogo (dados e arquivo de cada produto) e gera uma instrução `INSERT` por produto.
- Estratégia do BLOB: uma segunda entidade `ProductImage` sobre a mesma tabela `products`; `Product` não mapeia a coluna `image`, então nenhuma leitura de produto carrega a imagem.
- O filtro de tamanho se chama `productSize`, porque `size` já é o tamanho da página (RN-10 usava `size`).
- `spring-boot-starter-flyway` e `spring-boot-starter-hateoas` substituem `flyway-core` e `spring-hateoas`; `spring.flyway.baseline-on-migrate: true` com `baseline-version: 2` e `hibernate.check_nullability: true` entram no `application.yml`.
- `@Digits(integer = 9, fraction = 2)` no preço e no preço antigo.

**Alinhamento (`backend/07`):** feitos os itens 1 (`BigDecimal`), 2 (`PagedModel`), 3 (validação), 4 (handler), 5 (`serialVersionUID` e `BadRequestException`), 6 (tipos sem *display width*, na V3), 8 (starter do Flyway), 9 (starter do HATEOAS), 14 (`check_nullability`), 15 e 16 (Swagger e `produces` dos endpoints tocados). O item 17 (`equals` em uma linha) **já está conforme a skill `code-style`**, que manda uma linha. Deixados como estão, por escopo: 10 (`starter-web`), 12 e 13 (TAB e metadados do `pom.xml`), 14 (senha do banco), 18 (testes, nas próximas etapas), 19 (`getById` mantido) e 11 (dependências de teste, na etapa de testes).

**Pré-requisitos:** nenhum pendente.

### Frontend
**Registrado em 25/10/2026 17:55.**

**Arquivos criados** (`geek-shopping-app/`):
- `app/core/api/hal.ts`, `app/core/models/{category,facets}.ts`, `app/core/utils/{apiUrl,imageFile,cropImage}.ts`.
- Hooks: `useProducts`, `useProduct`, `useFeaturedProducts`, `useRecentProducts`, `useFacets`, `useCategories`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`, `useProductSearchParams`, `useCartCount`, `useAddToCart`.
- UI: `ProductImage`, `Spinner`, `EmptyState`, `RatingStars`, `PriceTag`, `Textarea` (atoms); `Pagination`, `InlineAlert`, `QuantityStepper`, `ImageCropper` (molecules; `react-easy-crop` 6.2.4).
- Features: `ProductDetail`, `AdminProducts` (+ `ProductForm`); páginas `products/[id]` e `admin/products`; `public/assets/no-image.jpg`.

**Arquivos alterados:** `httpClient.ts` (`ApiError` com `fields`, `paramsSerializer`), `products.ts`, `queryKeys.ts`, `product.ts`, `useCartStore.ts` (sem pré-carga), `useCart`, `Home`, `Header` (busca e categorias pela API), `Products`, `ProductCard`, `ProductDetails`, `ShopSidebar` (facets e filtro por categoria), `Cart`, `products/page.tsx` (com `Suspense`), `next.config.ts` (rewrite removido), `package.json`, `CLAUDE.md` do app e o `SKILL.md` de identidade visual. **Removidos:** `app/core/mocks/`, `useProductFilters` e `useProductFiltersStore`.

**Telas e rotas:** `/` (categorias, destaques e recentes), `/products` (filtros, ordenação e página na URL), `/products/[id]`, `/admin/products` (lista, criar/editar em modal com upload, crop e prévia, excluir com confirmação), `/cart` (local, resolve produtos pela API). Todas as telas de dados têm carregando, vazio e erro.

**Endpoints consumidos** (`/api/product/v1`): `GET /`, `GET /featured`, `GET /recent`, `GET /facets`, `GET /categories`, `GET /{id}`, `GET /{id}/image` (via `<img>`), `POST /` e `PUT /{id}` (multipart), `DELETE /{id}`.

**Validação** (`geek-shopping-app/`):
| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ sem erros |
| `npm run lint` | ✅ 0 erros, 7 avisos (`<img>`) |
| `npm run build` | ✅ |
| `npx vitest run` (extra) | ✅ 3 testes |

Rodados de novo depois das correções do tech debt (TD-24, TD-25, TD-26 e TD-34).

**Conferência visual:** pendente. O servidor de desenvolvimento não foi iniciado e a API nunca rodou junto com o front.

**RN/AC cobertos:** listagem, filtros, ordenação e paginação pela API; detalhe; cadastro, edição e exclusão com upload (JPEG, PNG, WebP e GIF até 5 MB), crop no navegador com conversão para JPEG e placeholder; erros por campo; carrinho local mantido; esgotado listado e marcado. A comprovação em execução fica para as etapas de teste.

**Alinhamento (`frontend/07`):** feito nas áreas tocadas (mocks removidos, adaptador HAL, `ApiError`, stores sem pré-carga, estados de tela). Diferido: `README.md` e `ARCHITECTURE.md` do app ainda descrevem o modo mock.

**Diferenças entre spec e código do backend:** o filtro de tamanho é `productSize` (ponto 16); a parte `product` do multipart é `Blob` JSON (ponto 15); `imageUrl` chega relativo e o serviço o torna absoluto. O contrato foi conferido pelo tech-debt-reviewer sem divergências.

**Pré-requisitos:** nenhum pendente.

### Testes de Backend
**Registrado em 25/10/2026 19:42.** Pré-requisito "Implementação do Backend" ✅.

**Classes criadas** (`geek-shopping-api/src/test/java/br/com/erudio/`):

| Classe | Testes | O que cobre |
|---|---|---|
| `unittests/services/ProductServiceTest` | 73 | Todas as operações do `ProductService`, com Mockito: caminho feliz, `ResourceNotFoundException`, entrada nula, imagem, filtros, ordenação, facets, categorias e links |
| `unittests/validation/ProductRequestDTOValidationTest` | 34 | Bean Validation da `ProductRequestDTO`, campo por campo, nos limites |
| `unittests/file/ImageTypeDetectorTest` | 15 | Tipo da imagem pelo conteúdo (JPEG, PNG, GIF87a/89a, WebP) e rejeições |
| `unittests/mapper/DozerMapperTest` | 8 | Entidade ↔ DTO, lista, `rating` nulo, campos do servidor vazios |
| `unittests/mapper/mocks/MockProduct` | — | Builder `mockEntity`, `mockEntityWithImage`, `mockRequest`, `mockEntityList` |
| `repository/ProductRepositoryTest` | 27 | `@DataJpaTest` + Testcontainers MySQL 9.1.0: `search` (padrão com `ESCAPE`, categoria, faixa de preço, cor e tamanho repetíveis, destaque, E lógico, paginação, desempate por `id`, `nullsLast` do `rating`), `countByColor`, `countBySize`, `countByCategoryFiltered`, `countByPriceBucket`, `countProductsByCategory`, `findLatestImageProductIdByCategory` e `updateImage` |

**Arquivos alterados:** `pom.xml` (`spring-boot-starter-data-jpa-test`, `testcontainers-mysql`, `maven-dependency-plugin` com o goal `properties` e `maven-surefire-plugin` com o agente do Mockito no `argLine`). Nenhum arquivo de `src/main` foi alterado nesta etapa.

**Mapeamento RN → teste:**

| Regra | Onde está coberta |
|---|---|
| RN-1 | `ProductServiceTest` (`createStoresTheImage`, `createSavesTheProductBeforeTheImage`); `ProductRepositoryTest` (`updateImage...`) |
| RN-2 | `ProductRequestDTOValidationTest` (todos); `ProductServiceTest` (`featured` padrão falso em `create` e `update`) |
| RN-3 | `ProductServiceTest` (`createAppliesTheServerValues`, `updateKeepsTheServerFields`); `DozerMapperTest` (campos do servidor vazios); `ProductRepositoryTest` (`searchRoundTripsTheRatingAndTheServerFields`) |
| RN-4 | `ProductServiceTest` (tipo, 5 MB exatos aceitos, mais de 5 MB recusado sem ler, leitura que falha, parte vazia, `PUT` com e sem imagem); `ImageTypeDetectorTest` |
| RN-5 | `ProductServiceTest` (`findImage` e 404, `imageUrl` derivado, link `image` só com imagem) |
| RN-6 | `ProductServiceTest.createStoresTheImage` (os bytes gravados são os recebidos) |
| RN-7 | `ProductRepositoryTest.theProductEntityDoesNotMapTheImageColumn`; o SQL do log de `search` não seleciona `image` |
| RN-8 | `ProductRepositoryTest.searchKeepsTheProductsWithoutStock`; o selo e o botão são do front |
| RN-9 | `ProductServiceTest` (`sortBy` e `direction` válidos e inválidos, `nullsLast`, desempate por `id`, página e tamanho); `ProductRepositoryTest` (ordem, paginação, `rating`) |
| RN-10 | `ProductServiceTest` (normalização de `q` com `%`, `_` e `!` literais, filtros repassados, `minPrice` > `maxPrice` recusado); `ProductRepositoryTest` (cada filtro e a combinação) |
| RN-11 | `ProductServiceTest` (6 faixas, a última aberta, cores, tamanhos, categorias, filtros repassados às 4 consultas); `ProductRepositoryTest` (4 consultas de contagem) |
| RN-12 | `ProductServiceTest.findCategories*`; `ProductRepositoryTest` (`countProductsByCategory`, `findLatestImageProductIdByCategory`) |
| RN-13 | `ProductServiceTest.findFeatured` e `findRecent` |
| RN-20 | `ProductServiceTest`: 404 em `findById`, `update`, `delete` e `findImage`, `RequiredObjectIsNullException` e `BadRequestException` sem `id`. Os status HTTP ficam para a integração |
| RN-14, RN-15, RN-21 | Não são de unidade: seed e migrations vão na integração (teste de fumaça do seed) |
| RN-16 a RN-19 | São do front (`/erudio:dev-ui-tests`) |

**AC cobertos em parte, no nível de unidade:** AC-2 (validação), AC-3 e AC-4 (imagem), AC-6 (`sortBy`, `direction` e `minPrice` > `maxPrice` inválidos; `page` negativa e `size` > 100 são `@Min`/`@Max` do controller e ficam na integração), AC-7 (facets, categorias, destaques e recentes), AC-8 (entidade sem a coluna da imagem) e AC-17 (valores do servidor). AC-1, AC-5, AC-9 e AC-16 dependem de HTTP e de migrations e ficam na integração.

**Comando e resultado** (`geek-shopping-api/`, com Docker disponível e um MySQL local em `localhost:3306`):

| Comando | Resultado |
|---|---|
| `./mvnw test` | ✅ 158 testes, 0 falhas, 0 erros, 0 ignorados (157 novos + o `StartupTests` existente) |

**O que não foi executado:** nada ficou de fora. O `StartupTests` rodou contra o MySQL local, não contra um container.

**Defeito de produção encontrado:** nenhum. Os pontos que a etapa do Backend deixou "não verificados em execução" agora têm prova: a consulta JPQL com o atributo `size`, `FLOOR` para as faixas de preço, `nullsLast` no MySQL, o `UPDATE` do campo `@Lob` e o mapeamento do Dozer com `LocalDateTime`, além de o contexto completo subir (`StartupTests`).

**Efeito colateral a conhecer:** o `StartupTests` usa o `application.yml` principal, então o `./mvnw test` aplicou as migrations V3, V4 e V5 no banco local `geek-shopping` (o log do Flyway mostra "Successfully applied 3 migrations"). A V4 faz `TRUNCATE` em `products`, e a V5 grava os 14 produtos do catálogo novo. É a mudança prevista na história, mas aconteceu no banco local do usuário.

### Testes de Frontend
**Registrado em 25/10/2026 22:39.** Pré-requisito "Implementação do Frontend" ✅.

**Arquivos criados** (`geek-shopping-app/`, Vitest + Testing Library + MSW 3; nomes de teste em inglês, sem comentários):

| Arquivo | Testes | O que cobre |
|---|---|---|
| `app/core/api/__test__/hal.test.ts` | 10 | Adaptador HAL com e sem `_embedded`, `first`/`last`, página vazia, corpo sem `page` |
| `app/core/api/__test__/httpClient.test.ts` | 9 | `ApiError`: `ExceptionResponse`, `ProblemDetail` com `errors{}`, corpo que não é objeto, sem resposta (status 0), parâmetros repetidos sem colchetes |
| `app/core/api/__test__/products.test.ts` | 25 | `productsService`: parâmetros de listagem (`productSize`, `color` repetido), URLs de imagem absolutas, atalhos, detalhe 404, facets, categorias, multipart de criar/editar (parte `product` como Blob JSON, parte `image`), exclusão |
| `app/core/utils/__test__/utils.test.ts` | 28 | `toApiUrl`, `formatPrice`, `validateImageFile` (tipos, 5 MB exatos, 5 MB + 1), `toJpegFileName`, `cropImageToJpeg` (JPEG, área, fundo branco, falhas) |
| `app/store/modules/__test__/stores.test.ts` | 17 | `useCartStore` e `useWishlistStore` |
| `hooks/__test__/dataHooks.test.tsx` | 30 | Chaves de query com filtros, estados de carregando e erro, `retry`, 404 sem repetição, invalidação das mutações |
| `hooks/__test__/useProductSearchParams.test.tsx` | 27 | Leitura da URL com valores inválidos, serialização, página volta a 0 ao mudar filtro ou ordenação |
| `hooks/__test__/useCart.test.tsx` | 14 | Carrinho resolvendo produtos pela API, teto no estoque, produto removido do catálogo, erro com nova tentativa, hooks-fachada |
| `components/ui/atoms/__test__/atoms.test.tsx` | 22 | `RatingStars`, `PriceTag`, `ProductImage` (placeholder e falha de carga), `Spinner`, `EmptyState` |
| `components/ui/molecules/__test__/molecules.test.tsx` | 28 | `InlineAlert`, `Pagination`, `QuantityStepper`, `ImageCropper` |
| `components/feature/Products/__test__/` (`ProductCard`, `ShopSidebar`, `Products`) | 17 + 12 + 24 | Card, quick view, sidebar de facets, `/products` com filtros, ordenação, página, lista/grade, vazio e erro |
| `components/feature/ProductDetail/__test__/ProductDetail.test.tsx` | 16 | Detalhe: carregando, sucesso, 404, id inválido, erro com nova tentativa, quantidade e estoque |
| `components/feature/Home/__test__/Home.test.tsx` | 14 | Categorias, destaques e recentes da API, placeholder, vazio e erro por seção |
| `components/feature/Header/__test__/Header.test.tsx` | 13 | Menu de categorias da API, busca, contadores |
| `components/feature/Cart/__test__/Cart.test.tsx` | 11 | Carrinho local: vazio, carregando, totais, quantidade, remoção, erro |
| `components/feature/AdminProducts/__test__/` (`AdminProducts`, `ProductForm`) | 21 + 51 | Lista, criar, editar e excluir com multipart; validação por campo; tipo e tamanho da imagem; recorte |

Já existia `components/ui/atoms/Button/__test__/Button.test.tsx` (3 testes).

**Infraestrutura de teste:** `test/fixtures.ts`, `test/msw/{handlers,server,serveProductsById}.ts` (handlers com o contrato HAL real, compartilhados), `test/renderWithProviders.tsx` (`QueryClient` sem repetição e com `gcTime` 0). O `vitest.setup.ts` sobe o servidor MSW com `onUnhandledFrame: 'error'` (requisição sem handler falha o teste) e força o adapter `fetch` do axios.

**Configuração e dependências alteradas:**
- `msw` ^3.0.3 como devDependency, com a autorização do usuário.
- `vitest.config.ts`: `env.NEXT_PUBLIC_API_URL` de teste e as exclusões de cobertura `app/core/api/**` e `app/store/**` removidas, como o spec 06 manda (entrou `test/**`).
- `vitest.setup.ts`: servidor MSW e `axios.defaults.adapter = 'fetch'`.

**Mapeamento RN/AC → teste:**

| Regra | Onde está coberta |
|---|---|
| RN-2 | `ProductForm.test` (validação por campo e limites); `AdminProducts.test` (erros por campo vindos do servidor) |
| RN-3 | `ProductForm.test` ("does not send the server fields") |
| RN-4 | `utils.test` (`validateImageFile`); `ProductForm.test` (tipo, 5 MB, recorte); `products.test` (multipart); `AdminProducts.test` (editar com e sem imagem) |
| RN-5 | `products.test` e `dataHooks.test` (`imageUrl` absoluto); `atoms.test` e `ProductCard.test` (placeholder) |
| RN-6 | `utils.test` (`cropImageToJpeg`); `molecules.test` (`ImageCropper`); `ProductForm.test` (arquivo recortado é o enviado) |
| RN-8 | `ProductCard.test`, `ProductDetail.test`, `Home.test`, `Products.test`, `Cart.test` |
| RN-9, RN-10 | `products.test` (parâmetros); `Products.test` (ordenação, filtros e `sortBy=rating`); `useProductSearchParams.test` |
| RN-11 | `products.test` (facets); `Products.test` e `ShopSidebar.test` |
| RN-12, RN-13 | `products.test`, `dataHooks.test`, `Home.test` |
| RN-16 | `Home.test`, `Header.test`, `Products.test`, `useProductSearchParams.test` (busca, filtros e página na URL); a pasta `app/core/mocks` e `USE_MOCK_PRODUCT_DATA` não existem mais (busca no código, sem ocorrências) |
| RN-17 | `atoms.test`, `ProductCard.test`, `Home.test`, `ProductDetail.test`, `AdminProducts.test` |
| RN-18 | `atoms.test`, `ProductCard.test`, `ProductDetail.test`, `Home.test` |
| RN-19 | `useCart.test`, `Cart.test` (sem chamada com o carrinho vazio, produto resolvido por `GET /{id}`, produto removido sai do carrinho) |
| RN-20 (lado do front) | `httpClient.test`, `products.test`, `AdminProducts.test` (400 com campos, 404, 500) |
| RN-21 | `AdminProducts.test` (a tela funciona sem login) |
| RN-1, RN-7, RN-14, RN-15 | São do back; ver testes de Backend e de Integração |

AC cobertos no nível de componente: AC-10, AC-11, AC-12, AC-13 e AC-14 (o recorte é testado com o `react-easy-crop` simulado e `cropImageToJpeg` com canvas simulado). AC-15: estados carregando, vazio e erro testados em Home, Products, ProductDetail, Cart e AdminProducts; a ausência de `app/core/mocks` foi conferida por busca no código. Fluxos reais de navegador ficam para os specs do Playwright, na etapa de integração.

**Comandos** (`geek-shopping-app/`):

| Comando | Resultado |
|---|---|
| `npx vitest run` | ✅ 20 arquivos, 392 testes, 0 falhas (389 novos + os 3 do `Button`) |
| `npx tsc --noEmit` | ✅ sem erros |
| `npm run lint` | ✅ 0 erros, 7 avisos (os mesmos `<img>` de antes; nenhum nos testes) |

**O que não foi executado:** Playwright (é da etapa de integração); `npm run build` (não faz parte desta etapa); cobertura (`npm run test:coverage`).

**Defeito de produção encontrado:** nenhum. O `Location` do `201` não é lido pelo front (o corpo já traz o produto), então o teste só confere que o fluxo de criação funciona com a resposta do back; não há leitura de `Location` para testar.

**Limites a conhecer:**
- O jsdom não conversa com o MSW por XHR, então os testes forçam o adapter `fetch` do axios; em produção o navegador usa XHR (TD-55).
- O `npm install -D msw` falhou com o erro do npm `Cannot read properties of null (reading 'edgesOut')` e só funcionou com `--legacy-peer-deps`. O `package.json` e o `package-lock.json` já estavam com muitas mudanças das etapas anteriores.
- O MSW 3 renomeou `onUnhandledRequest` para `onUnhandledFrame`; a primeira versão do setup usava o nome antigo, que era ignorado em silêncio, e foi corrigida.

### Testes de Integração
**Registrado em 25/10/2026 22:56.** Pré-requisitos (Backend, Frontend e os dois de testes) ✅. Docker 29.5.3 disponível. **Fechada em 25/10/2026 22:59 por decisão explícita do usuário ("por mim os testes de integração OK"), sem que os specs Playwright tenham sido executados; o resultado do E2E não existe.**

**Classes criadas** (`geek-shopping-api/src/test/java/br/com/erudio/`), só JSON, em MySQL 9.1.0 de Testcontainers (imagem com tag fixa, `mysql-default-conf`), porta 8888:

| Classe | Testes | O que cobre |
|---|---|---|
| `integrationtests/testcontainers/AbstractIntegrationTest` | — | Container MySQL uma vez por JVM, injetado por `ApplicationContextInitializer` |
| `integrationtests/ApiIntegrationTest` | — | `@SpringBootTest(DEFINED_PORT)` base das classes que chamam a API |
| `controllers/withjson/ProductControllerJsonTest` | 12 | Fluxo ordenado: criar com imagem (201, `Location`, `imageUrl`), campos do servidor ignorados, ler, links HATEOAS, imagem com `Content-Type`, `ETag` e 304, editar sem imagem (mantém), editar com imagem (troca), listar, excluir (204), 404 depois |
| `controllers/withjson/ProductControllerErrorsJsonTest` | 47 | 400 de validação com `ProblemDetail` e `errors{}` por campo, `oldPrice`, limites de nome, descrição e preço, parte `product` ausente, texto simples (415), JSON malformado, imagem inválida pelo conteúdo, mais de 5 MB, exatamente 5 MB, os 4 formatos, PUT com imagem recusada mantém a atual, 404 de PUT, DELETE, GET e imagem, id não numérico, `sortBy`, `direction`, `minPrice` > `maxPrice`, `size` e `page` fora dos limites, atalhos |
| `controllers/withjson/ProductControllerQueryJsonTest` | 31 | Filtros combinados, `q` sem diferenciar maiúsculas, `%` e `_` literais, preço inclusivo, cor repetida como "ou", `productSize`, destaques, `sortBy` nas 5 colunas nos dois sentidos com desempate por `id`, nota inserida direto no banco e `nullsLast`, paginação HAL (`prev` ausente na primeira página, `next` na última), página além do fim, links de cada item, listagem sem coluna da imagem, `facets`, `featured`, `recent`, `categories` |
| `controllers/withjson/ProductSeedJsonTest` | 8 | Teste de fumaça do seed (exceção declarada): 14 produtos, 6 categorias, todos com imagem JPEG servida, produto 3 sem estoque e fora dos destaques, destaques 1, 4, 8, 9, 10 e 11, datas de 01 a 14/10 às 10:00, nota vazia |
| `controllers/cors/withjson/CorsJsonTest` | 8 | Origem permitida, fora da lista (403 `Invalid CORS request`), preflight do POST, `Location` exposto, DELETE do front |
| `swagger/SwaggerIntegrationTest` | 7 | Swagger UI, só `/api/product/v1/**` documentado, multipart, 201, 400, 404, tipos de imagem |
| `StartupTests` e `repository/ProductRepositoryTest` (existentes, editados) | 1 + 27 | Passaram a estender `AbstractIntegrationTest`: **um único container para a suíte** e o `StartupTests` não usa mais o MySQL local (TD-38 e TD-39) |

Também criados: `config/TestConfigs`, `integrationtests/ProductApi` (cliente REST Assured), `integrationtests/TestImages`, `integrationtests/dto/ProductDTO` e `dto/wrappers/json/{WrapperProductDTO,ProductEmbeddedDTO}`, `src/test/resources/application.yml` (cópia do principal sem url, usuário e senha do banco, com porta 8888). Facets e categorias são lidos por `jsonPath`, sem espelho.

**Arquivos alterados:** `pom.xml` (`rest-assured` 6.3.0 em property, fora do BOM). No app: `@playwright/test` ^1.64.1 (autorizado pelo plano), script `e2e`, `playwright.config.ts`, `.gitignore` (`/test-results/`, `/playwright-report/`) e `e2e/catalog.spec.ts`.

**Mapeamento RN/AC → teste:**

| Regra | Onde está coberta |
|---|---|
| RN-1, RN-6 | `ProductControllerJsonTest` (bytes devolvidos iguais aos enviados) |
| RN-2 | `ProductControllerErrorsJsonTest` |
| RN-3, AC-17 | `ProductControllerJsonTest` (campos do servidor no corpo ignorados); `ProductControllerQueryJsonTest` (`sortBy=rating`, sem nota no fim) |
| RN-4, AC-3, AC-4 | `ProductControllerErrorsJsonTest` e `ProductControllerJsonTest` |
| RN-5 | `ProductControllerJsonTest` (`Content-Type`, `ETag`, `Cache-Control`, 304, 404 sem imagem); `SwaggerIntegrationTest` (tipos de imagem) |
| RN-7, AC-8 | `ProductControllerQueryJsonTest` (listagem sem a propriedade da imagem); o SQL sem a coluna foi provado na etapa de testes de Backend |
| RN-8 | `ProductControllerQueryJsonTest` (esgotado continua listado); `ProductSeedJsonTest` |
| RN-9, RN-10, AC-6 | `ProductControllerQueryJsonTest` e `ProductControllerErrorsJsonTest` |
| RN-11, RN-12, RN-13, AC-7 | `ProductControllerQueryJsonTest` |
| RN-14, RN-15, AC-9 | `ProductSeedJsonTest` e `StartupTests` (migrations do zero no container). **Não coberto:** V1 e V2 intactas e o ensaio do script Python |
| RN-20, RN-21, AC-1, AC-2, AC-5 | `ProductControllerJsonTest` e `ProductControllerErrorsJsonTest` (todas as requisições são anônimas) |
| AC-16 | `SwaggerIntegrationTest` |
| CORS (`Location` exposto) | `CorsJsonTest` |
| AC-10 a AC-15 | `e2e/catalog.spec.ts` (8 cenários), **escritos, não executados** |

**Comandos:**

| Comando | Resultado |
|---|---|
| `./mvnw test` (`geek-shopping-api/`) | ✅ 271 testes, 0 falhas, 0 erros, 0 ignorados (113 novos de integração, 157 de unidade e de repositório, 1 `StartupTests`) |
| `npx playwright test --list` (`geek-shopping-app/`) | ✅ 8 testes em 1 arquivo |
| `npx tsc --noEmit` (app) | ✅ sem erros |
| `npx vitest run` (app) | ✅ 392 testes |
| `npm run lint` (app) | ✅ 0 erros, 7 avisos que já existiam |

**O que não foi executado:** o Playwright de verdade. Para rodar: API em `http://localhost:8080` (com o MySQL local) e o app em `http://localhost:3000`, ambos iniciados por você, e `npx playwright install chromium` na primeira vez, depois `npm run e2e` em `geek-shopping-app/`. Variáveis opcionais `E2E_BASE_URL` e `E2E_API_URL`. O ensaio do script Python e a conferência de V1 e V2 intactas também não foram feitos.

**Defeito de produção encontrado:** o `createdAt` da resposta do `POST` sai com precisão de nanossegundos (`LocalDateTime.now()` da entidade, nunca relida) e o `GET` devolve o valor gravado pelo MySQL em microssegundos, arredondado; o mesmo produto mostra dois `createdAt` diferentes. Não corrigi: é código de produção. Os testes comparam os dois com tolerância de 1 µs (TD-59 e TD-60); a tolerância deve sair quando o service truncar o valor.

**Efeito no banco local:** esta execução não tocou o MySQL local; `StartupTests` agora usa o container.

## Resultados dos reviews

### Code Review
**Registrado em 25/10/2026 23:08.** Agente `erudio:code-reviewer`. Escopo: arquivos de produção do backend e do frontend listados em `## Implementado` (testes só como contexto), specs `backend/02, 04, 07` e `frontend/02, 03, 04, 05, 07`, `CLAUDE.md` da raiz, da API e do app. **Resultado: 15 achados novos (CR-1 a CR-15), nenhum de severidade alta; 3 precisam corrigir (CR-1, CR-2, CR-9) e 12 são toleráveis.** Já conhecidos e não repetidos: TD-14, 16, 19, 21, 22 (estendido pela CR-5), 26 (nova evidência na CR-11), 32, 33, 35, 55, 59, 60, 66.

**Aderência à história:** RN-1 a RN-21 implementadas, com os desvios já registrados (`productSize` em vez de `size`; V4 `TRUNCATE` e V5 `INSERT`; entidade `ProductImage`; seleção única de cor e tamanho; sem `Toast`). O seed confere com a RN-14 (destaques 1, 4, 8, 9, 10 e 11; produto 3 sem estoque e fora dos destaques). Nada de "Fora do escopo" foi implementado.

**Grupos checados sem achados:** migrations (V3 a V5 em SQL puro e sequenciais, V1 e V2 intactas, nulabilidade confere com a entidade, script recusa sobrescrever e escapa `\` e `'`); testes presentes (nenhum `@Disabled`, `.skip(`, `xit(`, `.todo` ou `test.fixme`); camadas e estilo do backend fora dos achados (sem Lombok, sem comentários, `equals`/`hashCode` por getters, links HATEOAS só no service, Dozer, `getById` mantido); contrato da API (rotas, verbos, status, `produces`/`consumes`, `@Valid` só na interface, `type` `about:blank`, catch-all sem vazar a mensagem, tipo da imagem pelo conteúdo, limite de 5 MB); arquitetura do frontend (direção `page → feature → ui/hooks → core/store`, nenhum componente lê store direto, dados do servidor só no Query, página volta a 0 ao mudar filtro, HAL e `ApiError` em `core/api`, sem `app/core/mocks`/`USE_MOCK_PRODUCT_DATA`); guardrails visuais (só `react-icons/fa`, sem `next/image`, raio 0, `SectionTitle`, `ProductImage` com placeholder, atribuição do HTML Codex no `Footer.tsx`, inventário do guardião atualizado).

**Não verificado pelo revisor:** não rodou testes, build nem a aplicação; a CR-2 é inferida do código; o conteúdo hexadecimal da V5 (só a estrutura) e a conferência visual contra `MultiShop/` não foram feitos; o `/v3/api-docs` gerado não foi lido (só as anotações); os arquivos de teste não foram lidos, apenas varridos por marcadores de desativação.

#### CR-1 · Swagger sem o corpo real das listagens e sem o header `Location` no 201
- Severidade: média
- Veredito: precisa corrigir
- Local: `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/ProductControllerDocs.java:40` (também `:74`, `:90`, `:177-178`)
- Evidência: `@ApiResponse(..., responseCode = "200", content = @Content)` em `findAll`, `findFeatured` e `findRecent` apaga o esquema do `PagedModel`; o 201 de `create` não declara `headers = @Header(name = "Location")`. O AC-16 pede "status e corpos reais".
- Correção sugerida: Remover o `content = @Content` vazio (ou apontar um esquema do `PagedModel`) e declarar o header `Location` no 201 (skill `swagger`; spec `backend/04:127`).
- Se nada for feito: Prós: os status estão certos. Contras: AC-16 cumprido só em parte; quem consome pelo Swagger não vê o formato HAL nem onde ler o id criado.

#### CR-2 · `MultipartException` genérica cai no catch-all e vira 500
- Severidade: média
- Veredito: precisa corrigir
- Local: `geek-shopping-api/src/main/java/br/com/erudio/exception/handler/CustomEntityResponseHandler.java:73-82`
- Evidência: Só `MaxUploadSizeExceededException` é tratada (`:65-71`). Um `multipart/form-data` malformado (sem boundary) cai em `@ExceptionHandler(Exception.class)` e devolve 500. Spec `backend/02:82`: erro de input do cliente é 4xx. **Inferido do código; não exercitado em execução.**
- Correção sugerida: Acrescentar `@ExceptionHandler(MultipartException.class)` devolvendo 400 `ProblemDetail` e um teste de integração com corpo multipart inválido.
- Se nada for feito: Prós: caso raro que o front nunca gera. Contras: viola a regra de 4xx para erro do cliente e gera 500 no log a cada requisição malformada.

#### CR-3 · DTOs novos como `record` e `ProductFilter` sem o sufixo `DTO`
- Severidade: média
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/data/dto/CategoryDTO.java:3` (idem `FacetItemDTO:3`, `FacetsDTO:5`, `PriceRangeDTO:3`, `request/ProductFilter:6`)
- Evidência: `public record CategoryDTO(String name, long productCount, String imageUrl) {}`. Spec `backend/02:41` pede classes com construtor sem argumentos; `:47` pede `RepresentationModel` com `@Relation`; `:28` pede sufixo `*DTO`.
- Correção sugerida: Converter para classes (como `ProductDTO`) e renomear `ProductFilter` para `ProductFilterDTO`, ou registrar a exceção (records de leitura sem links) na spec `backend/02`.
- Se nada for feito: Prós: records são concisos e imutáveis, JSON idêntico. Contras: dois padrões de DTO no projeto; a regra da spec vira letra morta.

#### CR-4 · Lógica de cache (MD5/ETag/`CacheControl`) no controller, que recebe a entidade `ProductImage`
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/controllers/ProductController.java:110-117`
- Evidência: O controller calcula `DigestUtils.md5DigestAsHex(image.getImage())`; `ProductService.java:163` devolve a entidade JPA. Spec `backend/02:48,84,85`: controller só delega e nenhum endpoint devolve entidade.
- Correção sugerida: O service devolve um `record` com `bytes`, `contentType` e `eTag` calculados; o controller só monta o `ResponseEntity`.
- Se nada for feito: Prós: funciona e é testado (ETag e 304). Contras: precedente de regra no controller e de entidade fora do service; custo do MD5 já no TD-21.

#### CR-5 · O 400 documentado não cobre o `ExceptionResponse` real (estende TD-22)
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/ProductControllerDocs.java:194-195`
- Evidência: `update` documenta só `ProblemDetail`, mas `PUT` sem `id` lança `BadRequestException` (`ProductService.java:191`) respondida como `ExceptionResponse`. `findAll` e `findFacets` (`:41-42`, `:108-109`) documentam só `ExceptionResponse`, mas `size`, `page` e preço negativo geram `ProblemDetail`.
- Correção sugerida: Documentar os dois esquemas (`oneOf`) nos 400 de `findAll`, `findFacets` e `update`; atualizar o TD-22.
- Se nada for feito: Prós: o front já normaliza os dois formatos. Contras: o Swagger mente sobre o corpo de parte dos 400.

#### CR-6 · Sem anotações compostas e sem exemplos de erro no Swagger (estende `backend/07` item 15)
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/ProductControllerDocs.java:35-217`
- Evidência: Cada endpoint repete o `@ApiResponse` 500. Não existe `controllers/docs/annotations/` (spec `backend/04:126-127`). A história dá o item 15 como feito.
- Correção sugerida: Criar `ApiNotFoundResponse`, `ApiValidationResponse` etc. (skill `swagger-advanced`) com `examples`.
- Se nada for feito: Prós: resultado no Swagger equivalente. Contras: repetição em 10 endpoints e o "item 15 feito" fica impreciso.

#### CR-7 · Pacote `validation` fora do layout documentado
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/validation/OldPriceGreaterThanPrice.java:1`
- Evidência: A tabela de pacotes da spec `backend/02:9-22` e a skill `code-organization` não têm `validation`.
- Correção sugerida: Acrescentar `validation` à tabela da spec `backend/02`.
- Se nada for feito: Prós: nome claro. Contras: pacote não documentado; o próximo validador pode cair em outro lugar.

#### CR-8 · Chamadas com vários argumentos por linha
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:124-126` (também `:135-143`, `:267-270`)
- Evidência: `repository.countByPriceBucket(` com `p.pattern(), p.category(), p.minPrice(), p.maxPrice(),` na mesma linha. A skill `code-style` pede um argumento por linha.
- Correção sugerida: Um argumento por linha, ou resolver junto com o TD-14 (`SearchParams`/`Specification`).
- Se nada for feito: Prós: compacto. Contras: desvio de estilo que agrava a repetição do TD-14.

#### CR-9 · `Textarea` usa o token inexistente `--surface-primary` e perde o anel de foco
- Severidade: média
- Veredito: precisa corrigir
- Local: `geek-shopping-app/components/ui/atoms/Textarea/Textarea.module.css:25` (copiado de `Input.module.css:23` e `Select.module.css:23`)
- Evidência: `outline: 2px solid var(--surface-primary);` — o token não existe em `styles/tokens/_colors.css`; o `outline` cai para `none` e o campo focado fica sem indicador. Regra do `CLAUDE.md` do app e `frontend/04:52`: cores só de tokens.
- Correção sugerida: Trocar por token real (ex.: `var(--brand-primary)`) no `Textarea` e também em `Input` e `Select`.
- Se nada for feito: Prós: nenhum. Contras: foco invisível nos campos do formulário de cadastro (acessibilidade); o defeito se propaga a cada novo campo.

#### CR-10 · Erro 400 de parâmetro em `/products` só oferece "Try again", que falha de novo
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-app/components/feature/Products/Products.tsx:174-183`
- Evidência: Com `?minPrice=500&maxPrice=100` ou `minPrice` negativo (aceitos por `useProductSearchParams.ts:58-59`) o back devolve 400 e `refetch()` repete o 400. Spec `frontend/05:32` pede resetar filtros; `clearFilters` só aparece no estado vazio.
- Correção sugerida: Quando `error.status === 400`, oferecer "Clear filters".
- Se nada for feito: Prós: só ocorre com URL editada à mão. Contras: o usuário fica preso num erro sem saída pela própria tela.

#### CR-11 · Carrinho mantém a quantidade de produto que esgotou (nova evidência no TD-26)
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-app/hooks/useCart/useCart.ts:54`
- Evidência: `product.quantity > 0 ? Math.min(...) : quantities[id]` — com estoque 0 o item entra em `subtotal` e `total`; `Cart.tsx:88` desabilita o "+" mas não mostra selo de esgotado.
- Correção sugerida: Com `quantity === 0`, marcar como esgotado e tirar dos totais, ou remover do store como no 404.
- Se nada for feito: Prós: carrinho local provisório até a entrega 3. Contras: soma produto indisponível ao total, contra o espírito da RN-8.

#### CR-12 · Menu de categorias do Header sem estado de carregando, erro ou vazio
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-app/components/feature/Header/Header.tsx:128-140`
- Evidência: `useCategories` só desestrutura `data` (`:31`); com falha ou em curso o painel abre vazio. Spec `frontend/04:59` pede estados explícitos.
- Correção sugerida: Tratar `isLoading`/`isError` com uma linha "Loading…" / "Categories unavailable".
- Se nada for feito: Prós: Header é casca, não tela; AC-15 não violado. Contras: painel vazio parece defeito.

#### CR-13 · O `Location` do 201 não é usado no front, ao contrário do plano
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-app/app/core/api/products.ts:133-138`
- Evidência: `create` devolve só `toProduct(data)`; o item 1 do Frontend da história diz que o `Location` abre o produto criado. `AdminProducts.tsx:75-84` fecha o modal e volta à página 0. Desvio só no ponto em aberto 20; sem TD.
- Correção sugerida: Registrar a decisão no plano (`/erudio:implement-story`) ou ler `headers.location` e navegar para `/products/{id}`.
- Se nada for feito: Prós: o corpo do 201 já traz o produto. Contras: plano e código divergem; o CORS `exposedHeaders("Location")` fica sem consumidor no front.

#### CR-14 · Chaves de query divergem da fábrica da spec
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-app/app/core/api/queryKeys.ts:3-11`
- Evidência: Código usa `['products','detail',id]`, `['products','facets',params]`, `['products','categories']`; a spec `frontend/03:73` fixa `['product',id]`, `['facets',params]`, `['categories']`. O agrupamento permite invalidação única (`useCreateProduct.ts:15`).
- Correção sugerida: Atualizar a spec `frontend/03` para a hierarquia adotada.
- Se nada for feito: Prós: invalidação simples e correta. Contras: a próxima entrega pode seguir a spec e misturar dois estilos.

#### CR-15 · O "Implementado" do Frontend descreve `PUT /{id}`, mas o código usa `PUT` na raiz
- Severidade: baixa
- Veredito: tolerável
- Local: `docs/plans/stories/catalogo-de-produtos-com-upload-de-imagem.md:265`
- Evidência: A linha lista "`POST /` e `PUT /{id}`"; `products.ts:141` faz `api.put(PRODUCTS_PATH, …)`, correto pela RN-20 e por `ProductController.java:129`.
- Correção sugerida: Corrigir o texto para `PUT /` no fechamento (`/erudio:complete-story`).
- Se nada for feito: Prós: nenhum impacto em execução. Contras: a documentação induz a um contrato errado.

**Resumo:** alta 0 · média 4 (CR-1, CR-2, CR-3, CR-9) · baixa 11 (CR-4 a CR-8, CR-10 a CR-15). Precisa corrigir 3 · tolerável 12.

**Passada de débito técnico (25/10/2026 23:13):** agente `erudio:tech-debt-reviewer` sobre o mesmo escopo. 19 achados novos (TD-67 a TD-85): média 2 (TD-74, TD-80), baixa 17; precisa corrigir 3 (TD-74, TD-80, TD-81). Nenhum alta. Detalhes (evidência, correção e prós/contras) nas linhas da tabela abaixo e no relatório do agente. Checados sem achados: TODO/FIXME/HACK, exceções engolidas além do TD-80, dependências (`rest-assured` fora do BOM justificado) e testes desativados.

### Performance
**Registrado em 25/10/2026 23:19.** Agente `erudio:perf-reviewer`. Escopo: backend (`application.yml`, migrations V1, V3, V4 e estrutura da V5, controller, service, repositórios, entidades, `ImageTypeDetector`, `WebConfig`, script gerador) e frontend (providers, `core/api`, `core/utils`, stores, hooks, features de Products, AdminProducts, ProductDetail, Home, Header, Cart, `ProductImage`, `ImageCropper`, `Modal`). **Resultado: 9 achados novos (PF-1 a PF-9), nenhum alta; 2 média e precisam corrigir (PF-2, PF-8); 7 baixa e toleráveis.** Conhecidos tocados e não repetidos: TD-21, CR-4 e TD-74 (ETag por MD5 e `no-cache` lendo o BLOB; versionar a URL da imagem, por exemplo `?v=<image_size>`, com `max-age` longo e `immutable`, também resolve o TD-28) e TD-14 (`FILTERS` repetido).

**Grupos checados sem achados:** fetch e N+1 (`Product` sem associações e sem a coluna `image`; `ProductImage` só em `findImage`; `toDto` não dispara consulta por item; atualização da imagem por `UPDATE` JPQL dedicado); dados e consultas pesadas (RN-7 cumprida: listagens, detalhe, destaques, recentes, facets e categorias não carregam bytes; facets e categorias agregados no banco); paginação (todas as listagens com `@Min(0)`, `@Min(1) @Max(100)`, `sortBy` em whitelist, desempate por `id`); renderização e bundle (chaves estáveis, seletores Zustand estreitos, ícones por nome, `react-easy-crop` só no chunk de `/admin/products`, `Modal` fechado não monta); query keys (incluem todos os parâmetros, busca no submit, filtros na URL com `keepPreviousData`, `categories` compartilhada entre Header e Home, invalidação ampla mas só nas queries ativas). O `GET /{id}` por item do carrinho é intencional (RN-19, D-7).

**Não verificado (exige medição ou sistema rodando):**
- `EXPLAIN` das 6 consultas com `FILTERS`, em especial se um índice novo de `category` ou `price` é usado com os predicados `(:category = '' OR ...)`, já que o Connector/J inlina parâmetros por padrão.
- `ROW_FORMAT` da tabela (DYNAMIC esperado) e se o LONGBLOB fica fora da página, do que depende o custo da varredura (PF-2) não incluir os bytes.
- O SQL real do `nullsLast` no MySQL (PF-1) e a collation de `name`/`description` (PF-3).
- CPU de `linkTo(methodOn(...))` com `size=100` e o tamanho real do JSON por página (PF-6).
- Tamanho do JPEG gerado pelo crop a partir de fotos grandes e peso real das imagens nas telas (PF-8, DevTools).
- `max_allowed_packet` frente ao maior `INSERT` da V5 (cerca de 289 KB; já em Riscos) e memória do heap com uploads de 5 MB simultâneos (Riscos).
- Comportamento do 304 com `If-None-Match` atrás de CDN ou proxy (TD-21).

#### PF-1 · `sortBy=rating` com `nullsLast` não aproveita índice (filesort sempre)
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:255`
- Evidência: `order.nullsLast()`: o MySQL não tem `NULLS LAST`, o Hibernate emula com `CASE WHEN rating IS NULL` no `ORDER BY` e nenhum índice serve essa ordem. **Inferência sobre o SQL gerado; o log do SQL não foi lido.**
- Correção sugerida: Se a ordenação por nota ficar quente: coluna gerada `rating_is_null` indexada com `rating, id`, ou ordenar por `review_count` antes de `rating`.
- Se nada for feito: Prós: nenhum produto tem nota hoje e o catálogo tem 14 linhas. Contras: com avaliações, a ordenação por nota vira filesort da tabela filtrada a cada página.

#### PF-2 · Nenhum índice secundário nas colunas filtradas, agrupadas e ordenadas
- Severidade: média
- Veredito: precisa corrigir
- Local: `geek-shopping-api/src/main/resources/db/migration/V3__Alter_Table_Products_Add_Catalog_Columns.sql:1-15` (também `ProductRepository.java:17-25,46,58,70,82,94,97`; `ProductService.java:105,113,256`)
- Evidência: Só existe a `PRIMARY KEY (id)` (V1); a V3 cria `featured`, `created_at`, `color`, `size` e `popularity` sem índice e não há V6. `WHERE`: `category`, `price`, `color`, `size`, `featured`. `ORDER BY`: `name`, `price`, `created_at` (`/recent`), `popularity` (`/featured`). `GROUP BY`: `category`, `color`, `size`. Toda listagem, contagem e faceta varre a tabela e ordena com filesort. A spec `backend/03:3` deixa os índices para o plano de cada entrega e a história não os definiu.
- Correção sugerida: Nova migration `V6__Create_Indexes_On_Products.sql` (nunca editar V1–V5) com `idx_products_category (category)`, `idx_products_price (price)`, `idx_products_created_at (created_at, id)`, `idx_products_featured_popularity (featured, popularity, id)`, `idx_products_name (name, id)` e, opcionalmente, `color` e `size`; confirmar com `EXPLAIN`.
- Se nada for feito: Prós: com 14 linhas a varredura custa microssegundos. Contras: o custo cresce linearmente nas rotas mais quentes (Home: `/featured`, `/recent`, `/categories`; `/products`: listagem, contagem e 4 facets).

#### PF-3 · Predicado de texto com `LOWER()` aplicado sempre, mesmo sem busca
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/repositories/ProductRepository.java:18` (também `ProductService.java:289`)
- Evidência: Sem `q` o padrão vira `"%"`, mas `LOWER(p.name) LIKE :pattern OR LOWER(p.description) LIKE :pattern` continua no `WHERE` das 6 consultas, inclusive `/featured` e `/recent`. Se a collation for `_ci` (não verificado), o `LOWER` é redundante.
- Correção sugerida: Predicado condicional (`:pattern = '%' OR ...` ou `:pattern IS NULL OR ...`); sem `LOWER` se a collation for `_ci`; `FULLTEXT` se a busca crescer.
- Se nada for feito: Prós: só CPU por linha; o PF-2 resolve os outros filtros. Contras: trabalho inútil em toda listagem; padrão se repete em cada consulta nova (TD-14).

#### PF-4 · Quatro varreduras com o mesmo filtro em cada `/facets`
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:124-143`
- Evidência: `countByPriceBucket`, `countByColor`, `countBySize` e `countByCategoryFiltered` repetem o `WHERE` (`FILTERS`) em consultas separadas; com `search` e `count`, cada mudança de filtro em `/products` gera 6 consultas, sem transação somente leitura envolvendo as 4.
- Correção sugerida: Uma consulta `SELECT category, color, size, FLOOR(price/100), COUNT(*) ... GROUP BY` somada no service; mínimo: `@Transactional(readOnly = true)` em `findFacets`.
- Se nada for feito: Prós: código simples, cada contagem testada sozinha. Contras: 4 vezes o custo de varredura por requisição, agravado pelo PF-2.

#### PF-5 · Transação (e conexão do pool) aberta enquanto o upload é lido e validado
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:170-174` (também `:188-193`)
- Evidência: `create` e `update` são `@Transactional` e chamam `readImage(image)` dentro dela: `getBytes()` lê até 5 MB e o `ImageTypeDetector` roda antes do primeiro SQL, com a conexão presa.
- Correção sugerida: Ler e validar a imagem antes de abrir a transação (método sem `@Transactional` chamando outro bean, ou `TransactionTemplate` só em volta do `save` e do `updateImage`).
- Se nada for feito: Prós: upload raro, admin pouco usado. Contras: com uploads concorrentes o Hikari fica ocupado sem SQL; soma ao risco "Memória no upload".

#### PF-6 · Links HATEOAS idênticos recalculados para cada item da página
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:309-346`
- Evidência: `toDto` faz 6 a 7 `linkTo(methodOn(...))` por produto; `findAll`, `create` e `update` são iguais em todos os itens. Com `size=100` são cerca de 700 proxies/URIs por requisição e os mesmos 3 links no JSON de cada item.
- Correção sugerida: Montar os links constantes uma vez por requisição e reaproveitar os `Link`; se a spec permitir, só `self` e `image` nos itens.
- Se nada for feito: Prós: segue a convenção HATEOAS e o teto de 100 limita o custo. Contras: CPU e payload proporcionais ao `size` em toda listagem.

#### PF-7 · `staleTime: 0` global para dados que quase não mudam
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-app/app/providers.tsx:11` (também `hooks/useCategories/useCategories.ts:5-10`, `useFacets.ts:5-11`, `useFeaturedProducts.ts:5-10`, `useRecentProducts.ts:5-10`)
- Evidência: Todas as queries usam `staleTime: 0` e `refetchOnMount: true`; cada ida a Home ou `/products` refaz `/categories`, `/featured`, `/recent`, `/facets` e a listagem. As mutações já invalidam `productKeys.all`, então um `staleTime` maior não deixaria dado velho após edição na mesma aba.
- Correção sugerida: `staleTime` de 1 a 5 min em categorias, facets, destaques e recentes, ou padrão de 30 a 60 s no `QueryClient`.
- Se nada for feito: Prós: dados sempre frescos. Contras: requisições e varreduras repetidas a cada navegação, multiplicando PF-2 e PF-4.

#### PF-8 · O crop não limita a dimensão nem revalida o tamanho, e a imagem original é servida nas miniaturas
- Severidade: média
- Veredito: precisa corrigir
- Local: `geek-shopping-app/app/core/utils/cropImage.ts:37-38` (também `ProductForm.tsx:239-241`; `ProductCard.tsx:25`; `AdminProducts.tsx:103`)
- Evidência: O canvas usa as dimensões do recorte na origem (`Math.round(area.width)`) sem teto; JPEG a 0.9; `onApply` chama `selectImage(file)` sem `validateImageFile`. Uma foto grande pode passar de 5 MB e só falhar no 400, depois do upload inteiro. Sem redimensionamento no servidor (fora do escopo), o arquivo enviado (até 5 MB) é o mesmo baixado por cards, miniaturas de 64 px do admin e grade de categorias.
- Correção sugerida: Limitar o lado maior em `cropImageToJpeg` (ex.: 1200 px) escalando o `drawImage`; validar o resultado com `validateImageFile`; opcionalmente redimensionar também sem crop.
- Se nada for feito: Prós: o seed tem cerca de 72 KB por imagem. Contras: cada upload pode pôr vários MB em todas as listagens, com cada revalidação lendo o BLOB (TD-21); o crop pode gerar arquivo que o próprio app recusa.

#### PF-9 · `<img>` das listagens sem `loading="lazy"`, `decoding` e dimensões
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-app/components/ui/atoms/ProductImage/ProductImage.tsx:16`
- Evidência: Sem `loading`, `decoding`, `width` ou `height`, e nenhum chamador os passa. A Home pede 6 imagens de categoria e até 16 de produto de uma vez; `/products` até 36.
- Correção sugerida: `loading="lazy"` e `decoding="async"` como padrão em `ProductImage`, sobrescrevíveis; `width`/`height` ou `aspect-ratio` para evitar layout shift.
- Se nada for feito: Prós: poucas imagens pequenas hoje. Contras: imagens abaixo da dobra competem com as de cima e o layout pula.

**Resumo:** alta 0 · média 2 (PF-2, PF-8) · baixa 7 (PF-1, PF-3, PF-4, PF-5, PF-6, PF-7, PF-9). Precisa corrigir 2 · tolerável 7.

**Passada de débito técnico (25/10/2026 23:19):** agente `erudio:tech-debt-reviewer`. 5 achados (TD-86 a TD-90): média 2 (TD-89, TD-90), baixa 3; precisa corrigir 1 (TD-89). Nenhum alta. **Sobreposições com itens já registrados:** TD-86 com TD-14, TD-88 com TD-77 e TD-89 com TD-68, TD-78 e TD-83 (o agente os classificou como novos). **Cobertura:** o próprio agente informa que não leu por inteiro `ImageCropper`, `ProductImage`, Home, Header, Cart, `ProductController` nem as migrations; "checado, sem achados" vale só para o que foi varrido por grep.

### Segurança
**Registrado em 25/10/2026 23:27.** Agente `erudio:security-reviewer`, somente leitura (sem tráfego, scanner nem aplicação; nenhum valor de segredo registrado). Escopo: `pom.xml`, `application.yml`, migrations V3–V5 (estrutura), `WebConfig`, controller e docs, DTOs de request, validação, handler de exceções, `ImageTypeDetector`, entidades, repositórios, service, script gerador, `next.config.ts`, `core/api` e `utils`, stores, hooks, `ProductForm`, `ProductImage`, `.env*` (só nomes); o código-fonte do Connector/J 9.7.0 foi consultado para a SEC-1. **Resultado: 5 achados novos (SEC-1 a SEC-5); nenhum alta, nenhum expõe segredo e nenhum permite adulterar preço ou total (sem marcador `[segurança]`). Média 1 (SEC-1); baixa 4. Precisa corrigir 2 (SEC-1, SEC-2); tolerável 3.**

**Grupos checados sem achados:** mass assignment (`ProductRequestDTO` sem campos do servidor; `create` zera o `id`; `update` copia campo a campo; tipo da imagem vem do detector); injeção (todos os `@Query` com parâmetros vinculados, `sortBy` em whitelist, `%`, `_` e `!` escapados com `ESCAPE '!'`, `UPDATE` da imagem vinculado, script Python escapa `\` e `'`); erros e vazamento (catch-all genérico, `ProblemDetail` genérico, `show-sql` desligado; CR-2 conhecido); CORS (origens de `cors.originPatterns`, sem `*`, só `exposedHeaders("Location")` acrescentado, origem fora da lista recebe 403); upload (tipo por conteúdo, SVG recusado, 5 MB conferido de novo no service, nenhum nome de arquivo guardado, `Content-Type` detectado); regras de negócio (`price > 0`, `oldPrice > price`, `quantity >= 0` impostos no servidor; escrita anônima é a RN-21/D-6; carrinho só `{id: quantidade}` em memória; total do servidor é requisito da entrega 3); segredos (credenciais do banco: TD-77/TD-88, não alteradas pela história; `.env.local` ignorado pelo Git); frontend (sem `dangerouslySetInnerHTML`/`innerHTML`, sem `localStorage`/`sessionStorage`/`persist`, `imageUrl` derivado no servidor e prefixado por `apiUrl`, `encodeURIComponent` na URL, `blob:` com `revokeObjectURL`); dependências (`npm audit` com 8 vulnerabilidades, 1 crítica no `next`, é o ponto em aberto 19/26; `react-easy-crop` só em `/admin/products`).

**Conhecidos tocados e não repetidos:** CR-2, TD-21, TD-74, TD-77, TD-88, PF-2, PF-4, PF-5, PF-8 e os Riscos de upload aberto, memória, dimensões da imagem.

**Não verificado:** execução (SEC-1 e SEC-2 são inferidas e precisam de teste de integração); scanner de dependências (OWASP, `npm audit`) e CVEs transitivas do `dozer-core` 7.0.0 (`commons-beanutils`); conteúdo hexadecimal da V5; comportamento de cada navegador com o polyglot (SEC-4); headers que um proxy/CDN de produção adicionaria; `Home`, `Header`, `Cart`, `ProductDetail`, `ImageCropper` e `Products/*` não lidos por inteiro (busca dirigida a padrões de risco).

#### SEC-1 · `minPrice`/`maxPrice` sem teto nem escala: um GET pequeno faz o driver montar uma string enorme (DoS)
- Severidade: média
- Veredito: precisa corrigir
- Local: `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/ProductControllerDocs.java:60,62` (também `:119,121`; `ProductService.java:243-247,279-280`; `ProductRepository.java:20-21`)
- Evidência: Os parâmetros só têm `@PositiveOrZero BigDecimal`; o Spring aceita notação científica e o Connector/J 9.7.0 grava `DECIMAL` com `toPlainString()` (`NumberValueEncoder.java:80,139`, conferido no código-fonte do driver). `1E999999999` vira cerca de 1 bilhão de caracteres, nas 6 consultas. O corpo do POST/PUT tem `@Digits(integer = 9)`; a query string não. **Inferido do código; não exercitado.**
- Cenário: anônimo envia `GET /api/product/v1?minPrice=1e999999999` (ou `/facets?maxPrice=1e-500000000`, 4 consultas); cada requisição aloca centenas de MB a GB; poucas em paralelo causam `OutOfMemoryError` e derrubam a API.
- Correção sugerida: Acrescentar `@Digits(integer = 9, fraction = 2)` (ou `@DecimalMax("999999999.99")`) a `minPrice` e `maxPrice` em `findAll` e `findFacets`, mais teste de integração com `minPrice=1e999999999` esperando 400.
- Se nada for feito: Prós: nenhum. Contras: uma URL de 40 caracteres, sem login, derruba a API.

#### SEC-2 · `page` sem teto: página enorme vira 500 e stack trace no log
- Severidade: baixa
- Veredito: precisa corrigir
- Local: `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/ProductControllerDocs.java:48` (também `:82`, `:98`; `ProductService.java:105,113,256`; `CustomEntityResponseHandler.java:73-82`)
- Evidência: `page` só tem `@Min(0)`. Com `page=2147483647&size=100` o offset passa de `Integer.MAX_VALUE`; o Spring Data recusa com `InvalidDataAccessApiUsageException`, sem handler próprio, e o catch-all responde 500 com `logger.error` e stack trace. **Inferido; não exercitado.**
- Cenário: anônimo repete `GET /api/product/v1/recent?page=2147483647&size=100` em laço; cada chamada gera 500 e stack trace, poluindo o log e escondendo erros reais.
- Correção sugerida: `@Max` em `page` nas três assinaturas (ex.: `@Max(10000)`) e teste de integração esperando 400.
- Se nada for feito: Prós: a mensagem devolvida é genérica e não vaza nada. Contras: 500 por input do cliente (contra `backend/02:82`) e log amplificável por qualquer um.

#### SEC-3 · `color`/`productSize` repetíveis sem limite de quantidade (`IN` com milhares de parâmetros)
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/ProductControllerDocs.java:64,66` (também `:123,125`; `ProductRepository.java:22-23`; `ProductService.java:124-143,267-270`)
- Evidência: `List<String> colors` e `productSizes` sem `@Size`; entram em `p.color IN :colors` em 6 consultas por tela e cada tamanho de lista gera um SQL diferente no cache de planos do Hibernate. O único limite é o cabeçalho do Tomcat (cerca de 8 KB, 2 a 3 mil valores). `q` também não tem `@Size`.
- Cenário: `?color=a&color=b&…` com ~2.500 valores e quantidade diferente a cada chamada: `IN` gigante em 6 consultas e cache de planos inflado.
- Correção sugerida: `@Size(max = 20)` nas listas e `@Size(max = 50)`/`@Size(max = 20)` nos elementos; opcionalmente `@Size(max = 100)` em `q` e `hibernate.query.in_clause_parameter_padding: true`.
- Se nada for feito: Prós: custo limitado pelo cabeçalho de 8 KB. Contras: amplificação barata contra o banco, somada ao PF-2 e ao PF-4.

#### SEC-4 · Resposta da imagem sem `nosniff` nem CSP, e validação só pelos primeiros bytes (polyglot)
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/controllers/ProductController.java:112-116` (também `ImageTypeDetector.java:13-16`)
- Evidência: O detector aceita qualquer arquivo que comece com `FF D8 FF`, `GIF89a`, a assinatura do PNG ou `RIFF....WEBP`, e serve os bytes como chegaram (RN-6). A API não tem Spring Security, então não envia `X-Content-Type-Options: nosniff`, `Content-Security-Policy` nem `Content-Disposition`; o `nosniff` de `next.config.ts:12` vale só para a origem do app (`:3000`), não para a da API (`:8080`).
- Cenário: anônimo envia `GIF89a` + HTML/JS, passa na validação e é servido como `image/gif` sob o domínio da API. Navegadores atuais não reinterpretam `image/*` como HTML, então o XSS depende de cliente que faça sniffing ou proxy que reescreva o tipo; a API vira hospedagem de arquivos arbitrários.
- Correção sugerida: Em `findImage`, acrescentar `X-Content-Type-Options: nosniff` e `Content-Security-Policy: default-src 'none'; sandbox` (opcional `Content-Disposition: inline`); melhor, um filtro global com `nosniff`.
- Se nada for feito: Prós: risco real baixo nos navegadores atuais e o tipo devolvido está correto. Contras: depende só do comportamento do navegador; domínio confiável hospeda arquivos arbitrários (phishing).

#### SEC-5 · Metadados EXIF (GPS, aparelho) publicados quando o upload é feito sem recorte
- Severidade: baixa
- Veredito: tolerável
- Local: `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:217-228` (também `geek-shopping-app/components/feature/AdminProducts/ProductForm/ProductForm.tsx:151-161`)
- Evidência: O back grava os bytes como chegaram (RN-6); o front só passa pelo canvas (que descarta o EXIF) quando há recorte (`cropImage.ts:264-275`); sem recorte, `selectImage(file)` envia o original.
- Cenário: foto de celular enviada sem recortar publica GPS e modelo do aparelho; qualquer visitante baixa `GET /{id}/image` e lê o EXIF.
- Correção sugerida: No front, sempre reencodar pelo canvas (junto com o redimensionamento do PF-8), ou documentar a decisão em Riscos.
- Se nada for feito: Prós: o catálogo de demonstração não tem fotos pessoais. Contras: vazamento de privacidade de quem cadastra, sem aviso.

**Resumo:** alta 0 · média 1 (SEC-1) · baixa 4 (SEC-2 a SEC-5). Precisa corrigir 2 (SEC-1, SEC-2) · tolerável 3.

**Passada de débito técnico (25/10/2026 23:29):** agente `erudio:tech-debt-reviewer`. 9 achados (TD-91 a TD-99): média 2 (TD-91, TD-96), baixa 7; precisa corrigir 2 (TD-91, TD-97). Nenhum alta. **Sobreposições com itens já registrados:** TD-91 com TD-77 e TD-88, TD-93 com TD-83 e TD-89, TD-98 com TD-82 (o agente os classificou como novos). **Cobertura:** o agente não leu por inteiro `ProductForm.tsx`, os hooks, os DTOs de resposta, as entidades, as migrations, as specs nem o conteúdo dos testes (só grep e trechos); não leu `.env.local`.

## Alertas e débitos técnicos

| ID | Origem | Severidade | Veredito | Local | Resumo | Status |
|---|---|---|---|---|---|---|
| TD-1 | Tech debt (Planejamento) | média | precisa corrigir | Backend, item 4; `ProductRepository.getById` | Estratégia do BLOB indefinida; manter o `getById` contradizia RN-7 e AC-8 | Corrigido (estratégia definida no Backend, item 4) |
| TD-2 | Tech debt (Planejamento) | média | precisa corrigir | RN-5; Frontend, item 1 | `imageUrl` relativo conflitava com a remoção do rewrite do front | Corrigido (RN-5 e Frontend, item 1) |
| TD-3 | Tech debt (Planejamento) | média | precisa corrigir | RN-3, RN-9; Critérios de aceite | RN-3 sem critério de aceite e `rating` sem como ser provado | Corrigido (AC-17 e Testes) |
| TD-4 | Tech debt (Planejamento) | média | precisa corrigir | Backend, item 2 (V3 e V4) | V3 sem nulabilidade, padrão e tipos das colunas; V4 destrutiva e DDL não transacional | Corrigido |
| TD-5 | Tech debt (Planejamento) | baixa | tolerável | Backend, item 3 | O `UPDATE` da V5 localiza por nome, embora os ids já coincidam com o arquivo | Aberto (mantido por nome por instrução do usuário; ponto em aberto 9) |
| TD-6 | Tech debt (Planejamento) | baixa | precisa corrigir | RN-5; Backend, itens 8 e 9 | Estouro do limite sem erro no campo `image`; `produces` do endpoint de imagem não tratado | Corrigido |
| TD-7 | Tech debt (Planejamento) | média | precisa corrigir | Backend, item 7; AC-7 | Payloads de `facets` e `categories` indefinidos | Corrigido (propostos; confirmar ao aprovar) |
| TD-8 | Tech debt (Planejamento) | baixa | tolerável | RN-10; AC-6 | Casos de borda dos filtros sem regra | Corrigido |
| TD-9 | Tech debt (Planejamento) | média | precisa corrigir | Testes | AC-16, AC-15, AC-9 (script), RN-8, RN-16, RN-17, RN-19 e as dependências de teste sem cobertura descrita | Corrigido |
| TD-10 | Tech debt (Planejamento) | baixa | tolerável | RN-20; Pontos em aberto 3 | Contrato do `PUT` com id no corpo e remoção de imagem indefinidos | Aberto (remoção da imagem segue no ponto em aberto 3; o `PUT` foi esclarecido na RN-20) |
| TD-11 | Tech debt (Planejamento) | baixa | tolerável | Backend, itens 1 e 9; Frontend, item 1 | Uso do `Location` e exposição no CORS sem detalhe | Corrigido |
| TD-12 | Tech debt (Planejamento) | baixa | tolerável | Backend, item 2; Pontos em aberto 1 | Remoção de `image_url` tratada como decidida no Backend e como aberta nos pontos em aberto | Corrigido (considerada confirmada na aprovação do plano) |
| TD-13 | Tech debt (Planejamento) | média | precisa corrigir | Riscos | Riscos ausentes: cache da imagem, V4 destrutiva, imagem hostil e `nosniff` | Corrigido |
| TD-14 | Tech debt (Implementação do Backend) | média | tolerável | `ProductRepository.java:34-92`; `ProductService.java:124-143` | Lista de 9 parâmetros do filtro repetida em 5 consultas e 4 chamadas; cada novo filtro exige várias edições | Aberto (considerar `Specification` ou SpEL quando surgir o próximo filtro) |
| TD-15 | Tech debt (Implementação do Backend) | baixa | precisa corrigir | `ProductImageRepository.java:10` | O repositório de `ProductImage` expunha `save` e `deleteById` sobre uma entidade parcial (apagaria o produto) | Corrigido (passou a estender `Repository` com só `findById` e `updateImage`) |
| TD-16 | Tech debt (Implementação do Backend) | baixa | precisa corrigir | Plano da história (RN-15, Backend 2 e 3, AC-9, Testes, TD-5) | O plano ainda descreve a V5 como `UPDATE` e uma V4 que apaga e insere | Aberto (seção do `implement-story`; ver Pontos em aberto 13) |
| TD-17 | Tech debt (Implementação do Backend) | baixa | precisa corrigir | `ProductService.java:57,127,280`; `ProductRequestDTO.java:33` | `@Digits(63)` aceitava preço acima do teto da busca (1e12) e um preço enorme estourava o `intValue` dos facets | Corrigido (`@Digits(integer = 9)`; ver Pontos em aberto 14) |
| TD-18 | Tech debt (Implementação do Backend) | baixa | tolerável | `scripts/generate_product_images_migration.py` | Rodar o script de novo geraria uma V6 duplicada; `sql_string` não escapava a barra invertida | Corrigido (recusa descrição já usada e escapa `\`; verificado) |
| TD-19 | Tech debt (Implementação do Backend) | baixa | tolerável | `application.yml:12-14`; V5 | `baseline-on-migrate` permanente sem documentação; ids do seed dependem de `TRUNCATE` e da ordem dos `INSERT` | Aberto (ver Pontos em aberto 17; ids explícitos ficam como melhoria) |
| TD-20 | Tech debt (Implementação do Backend) | baixa | tolerável | `ProductService.java`; `CustomEntityResponseHandler.java:69`; `application.yml` | Limite de 5 MB e defaults de paginação duplicados; `SORTABLE_FIELDS` é mapa identidade | Aberto (centralizar quando o limite mudar) |
| TD-21 | Tech debt (Implementação do Backend) | média | tolerável | `ProductController.java:110-117`; `ProductService.java:163-168` | `ETag` por MD5 e `no-cache` ainda leem o BLOB a cada requisição; o ganho é só de banda | Aberto (tratar em `/erudio:agent-perf-review`) |
| TD-22 | Tech debt (Implementação do Backend) | baixa | tolerável | `ProductControllerDocs.java:41-42,75-76,91-92` | O 400 do `findAll` documenta só `ExceptionResponse`, mas parâmetros inválidos geram `ProblemDetail` | Aberto |
| TD-23 | Tech debt (Implementação do Backend) | baixa | tolerável | `ProductRepository.java:97`; `ProductService.java:148-161` | A imagem da categoria vem do produto de maior `id`, não de `createdAt`; grafias diferentes de categoria perdem a imagem | Aberto (aproximação documentada) |
| TD-24 | Tech debt (Implementação do Frontend) | alta | precisa corrigir | `ShopSidebar.tsx:56` | "All Price" não limpava `minPrice`/`maxPrice` da URL | Corrigido (passa `undefined` nos dois) |
| TD-25 | Tech debt (Implementação do Frontend) | média | precisa corrigir | `useCart.ts`; `Cart.tsx` | Carrinho sem estado de erro; produto excluído (404) ficava no store e no badge | Corrigido (`isError`, "Try again", 404 removido do store ao abrir o carrinho) |
| TD-26 | Tech debt (Implementação do Frontend) | média | precisa corrigir | `useCart.ts`; `Cart.tsx` | Carrinho ignorava o estoque | Corrigido (quantidade limitada ao estoque e "+" desabilitado); card e detalhe ainda somam sem teto no store |
| TD-27 | Tech debt (Implementação do Frontend) | média | tolerável | `Products.tsx:44-60` | Facets filtrados pela própria dimensão: com uma cor escolhida só ela aparece; trocar exige voltar a "All" | Aberto. Prós: custo zero. Contras: troca em dois cliques |
| TD-28 | Tech debt (Implementação do Frontend) | média | tolerável | `ProductImage.tsx:16`; `AdminProducts.tsx:103` | Depois de trocar a imagem, miniatura e prévia ficam velhas até recarregar (mesma URL) | Aberto. Prós: só no admin. Contras: parece que o upload falhou |
| TD-29 | Tech debt (Implementação do Frontend) | baixa | tolerável | `Cart.tsx:66-84` | Stepper inline duplica o `QuantityStepper` | Aberto |
| TD-30 | Tech debt (Implementação do Frontend) | baixa | tolerável | `Products.tsx`, `Header.tsx`, `RatingStars.tsx`, `ShopSidebar.tsx`, `ProductForm.tsx` | Selects, busca e rádios sem rótulo acessível; erros do formulário fora de `aria-describedby` | Aberto |
| TD-31 | Tech debt (Implementação do Frontend) | baixa | tolerável | `ProductForm.tsx:66-81`; `AdminProducts.tsx:44-47` | `quantity` sem teto (Integer); mensagem genérica quando a chave de `fields` não mapeia um campo | Aberto |
| TD-32 | Tech debt (Implementação do Frontend) | baixa | tolerável | `products.ts:89,135,142` | Header manual `multipart/form-data` depende do axios apagar o valor; não testado no navegador | Aberto. Prós: funciona hoje. Contras: frágil se o adaptador mudar |
| TD-33 | Tech debt (Implementação do Frontend) | baixa | tolerável | `Products.tsx`; `products/page.tsx`; `Header.tsx` | Erro de facets ignorado; sem indicador de `isFetching`; `Suspense` sem fallback; página além do total; "Clear search" não limpa o campo | Aberto |
| TD-34 | Tech debt (Implementação do Frontend) | baixa | tolerável | `ProductDetail.tsx:25-26` | Estado local persistia entre ids | Corrigido (`key={id}` na página) |
| TD-35 | Tech debt (Implementação do Frontend) | baixa | tolerável | `Home.tsx:17-18`; `httpClient.ts:22-24`; `README.md`; `ARCHITECTURE.md` | Import entre features, interceptor vazio, docs descrevendo o mock; features importam `ApiError` do core | Aberto (já existia antes da etapa) |
| TD-36 | Tech debt (Implementação do Frontend) | baixa | tolerável | `package.json`; `apiUrl.ts:1`; `httpClient.ts:37` | Dependências reordenadas no diff; `NEXT_PUBLIC_API_URL` lida em dois módulos | Aberto |
| TD-37 | Tech debt (Implementação do Frontend) | baixa | tolerável | `Checkout.tsx:27,53` | Sem `isLoading`: mostra carrinho vazio enquanto os produtos carregam | Aberto (tela fora do escopo) |
| TD-38 | Tech debt (Implementação dos testes de Backend) | média | precisa corrigir | `ProductRepositoryTest.java:35-47` | Container MySQL próprio e estático no teste de repositório; a integração criará outro no `AbstractIntegrationTest` | Corrigido (o `ProductRepositoryTest` estende `AbstractIntegrationTest`) |
| TD-39 | Tech debt (Implementação dos testes de Backend) | média | tolerável | `StartupTests.java:7-12` | `@SpringBootTest` depende de MySQL local e migra esse banco; o spec 06 pede só Docker | Corrigido (o `StartupTests` estende `AbstractIntegrationTest`) |
| TD-40 | Tech debt (Implementação dos testes de Backend) | baixa | precisa corrigir | `ProductRepositoryTest.java:472,495` | `assertTrue(!x)` e `assertTrue(x == null)` | Corrigido (`assertFalse` e `assertNull`) |
| TD-41 | Tech debt (Implementação dos testes de Backend) | baixa | tolerável | `ProductServiceTest.java`; `DozerMapperTest.java:32` | `assertEquals(true/false, Boolean)` em vez de `assertTrue/assertFalse` | Aberto |
| TD-42 | Tech debt (Implementação dos testes de Backend) | média | precisa corrigir | `ProductServiceTest.java` (`findFacetsAppliesTheFilters`, `searchedPageable`) | Só 1 das 4 consultas de facets tinha os argumentos conferidos; destaques e recentes aceitavam `q` e categoria quaisquer | Corrigido (as 4 consultas e os atalhos conferem os argumentos exatos) |
| TD-43 | Tech debt (Implementação dos testes de Backend) | baixa | tolerável | `ProductRepositoryTest.java` (helper `search`) | `PageRequest.of(0, 20, Sort.by("id"))` repetido; teto de preço repetido em 3 lugares | Aberto |
| TD-44 | Tech debt (Implementação dos testes de Backend) | baixa | tolerável | `ProductServiceTest.java` | Par de stubs de "não encontrado" repetido em 3 testes; `Mockito.mock` qualificado | Aberto |
| TD-45 | Tech debt (Implementação dos testes de Backend) | baixa | precisa corrigir | `MockProduct.java` | `mockDTO` e `mockDTOList` sem uso | Corrigido (removidos) |
| TD-46 | Tech debt (Implementação dos testes de Backend) | baixa | tolerável | `ProductRepositoryTest.java` | Dois testes fora de "só `@Query` customizado", um com nome enganoso | Aberto |
| TD-47 | Tech debt (Implementação dos testes de Backend) | baixa | tolerável | `unittests/file/`, `unittests/validation/`; sem `src/test/resources/application.yml` | Estrutura e recursos de teste divergem do spec 06 | Aberto (atualizar o spec; criar o `application.yml` de teste na integração) |
| TD-48 | Tech debt (Implementação dos testes de Backend) | baixa | tolerável | `ProductRepositoryTest.java`, `ProductRequestDTOValidationTest.java`, `DozerMapperTest.java` | Só o `ProductServiceTest` cita a RN no `@DisplayName` | Aberto |
| TD-49 | Tech debt (Implementação dos testes de Backend) | baixa | tolerável | vários | Lacunas menores: `getById` sem teste de repositório, `@Digits` de `oldPrice` e limites de `color` e `category` na validação, `Content-Type` em `findImage` | Aberto |
| TD-50 | Tech debt (Implementação dos testes de Frontend) | média | precisa corrigir | `useCart.test.tsx`, `Cart.test.tsx`, `ProductDetail.test.tsx` | Helper que serve produtos por id copiado em 3 arquivos | Corrigido (`test/msw/serveProductsById.ts` em `useCart` e `Cart`; a variante de um produto só do `ProductDetail` fica) |
| TD-51 | Tech debt (Implementação dos testes de Frontend) | baixa | tolerável | `products.test.ts`, `dataHooks.test.tsx`, `AdminProducts.test.tsx`, `ProductForm.test.tsx` | `NEW_PRODUCT` e `PRODUCT_INPUT` repetidos; stub de `URL.createObjectURL` sem restauração | Aberto |
| TD-52 | Tech debt (Implementação dos testes de Frontend) | baixa | precisa corrigir | `test/fixtures.ts`, `test/msw/handlers.ts` | Dois exports sem uso | Corrigido (removidos) |
| TD-53 | Tech debt (Implementação dos testes de Frontend) | média | tolerável | `Products.test.tsx`, `Cart.test.tsx`, `ShopSidebar.test.tsx`, `ProductForm.test.tsx` e outros | Seletores por `id` e por `closest(...)` em vez de papel e rótulo; os selects de ordenação e de página não têm rótulo acessível | Aberto |
| TD-54 | Tech debt (Implementação dos testes de Frontend) | baixa | tolerável | `dataHooks.test.tsx`, `ProductForm.test.tsx`, `stores.test.ts` | Testes que espelham a implementação (literal da chave de query, `maxlength`, chaves enviadas) | Aberto |
| TD-55 | Tech debt (Implementação dos testes de Frontend) | média | precisa corrigir | `vitest.setup.ts`, `test/renderWithProviders.tsx` | Os testes usam o adapter `fetch` do axios e `gcTime` 0; em produção é XHR e o cache dura mais. Um defeito só do XHR (multipart) passa no Vitest | Aberto (documentar o motivo no `ARCHITECTURE.md` do app; o Playwright prova o caminho XHR) |
| TD-56 | Tech debt (Implementação dos testes de Frontend) | média | precisa corrigir | `dataHooks.test.tsx`, `useCart.test.tsx`, `Cart.test.tsx`, `ProductDetail.test.tsx`, `Header.test.tsx`, `Home.test.tsx`, `molecules.test.tsx` | Asserts que não podem falhar: zero chamadas conferido antes de qualquer tick, `waitFor` já verdadeiro, teste repetido, zoom sem prova | Corrigido (espera de 50 ms antes de afirmar zero chamadas, estado final no Header, teste repetido removido, `data-zoom` no cropper simulado) |
| TD-57 | Tech debt (Implementação dos testes de Frontend) | baixa | tolerável | `useCart.test.tsx`, `Cart.test.tsx`, `ProductCard.test.tsx` | Fixam comportamento provisório (frete fixo de R$ 10, "Coupons are not available yet.", comparar desabilitado) que as próximas entregas vão trocar | Aberto |
| TD-58 | Tech debt (Implementação dos testes de Frontend) | baixa | tolerável | `test/msw/handlers.ts`, `test/fixtures.ts`, `dataHooks.test.tsx` | Catálogo fixo de 3 itens e `halPage` vazia ignora `totalElements` | Aberto |
| TD-59 | Tech debt (Implementação dos testes de Integração) | média | precisa corrigir | `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:178` | **Código de produção.** `create` grava `LocalDateTime.now()` e devolve a entidade em memória; o `POST` mostra `createdAt` com nanossegundos e o `GET` o valor arredondado a microssegundos pelo MySQL | Aberto (corrigir no service com `truncatedTo(ChronoUnit.MICROS)`; não corrigido nesta etapa) |
| TD-60 | Tech debt (Implementação dos testes de Integração) | média | precisa corrigir | `ProductControllerJsonTest.java:49-51,108-110,181` | O teste tolera 1 µs entre o `POST` e o `GET` e copia o campo antes do `assertEquals`, mascarando o TD-59 | Aberto (voltar à igualdade exata depois do TD-59) |
| TD-61 | Tech debt (Implementação dos testes de Integração) | baixa | tolerável | `ApiIntegrationTest.java`, `ProductApi.java` | Helpers sem uso (`PRODUCTS_PATH`, `api()`, `request()`) | Corrigido (removidos) |
| TD-62 | Tech debt (Implementação dos testes de Integração) | baixa | tolerável | `src/test/resources/application.yml` | Cópia completa do principal: pode divergir sem aviso | Aberto (é o formato do spec) |
| TD-63 | Tech debt (Implementação dos testes de Integração) | baixa | precisa corrigir | `ProductApi.java`, `ProductSeedJsonTest.java` | `read` não conferia o status e a contagem de 14 do seed era tautologia | Corrigido (`read` exige 200 ou 201; o seed confere os ids de 1 a 14) |
| TD-64 | Tech debt (Implementação dos testes de Integração) | baixa | tolerável | `CorsJsonTest.java`, `ProductControllerJsonTest.java` | Limpeza que não roda se a asserção falhar | Corrigido em parte (`CorsJsonTest` com categoria única e `finally`); o caso de erro de parse em `ProductControllerJsonTest` fica |
| TD-65 | Tech debt (Implementação dos testes de Integração) | baixa | tolerável | `ProductControllerQueryJsonTest.java` (`recent`, `featured`), `ProductSeedJsonTest.java` | Dependem de execução sequencial e da limpeza das outras classes | Aberto |
| TD-66 | Tech debt (Implementação dos testes de Integração) | média | tolerável | `e2e/catalog.spec.ts`, `playwright.config.ts` | Spec acoplado ao seed e ao back ativo, seletores por `id` e sem limpeza se falhar no meio | Aberto em parte (script `e2e` e `.gitignore` feitos) |
| CR-1 | Code Review | média | precisa corrigir | `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/ProductControllerDocs.java:40` | Swagger sem o corpo real das listagens e sem o header `Location` no 201 | Aberto |
| CR-2 | Code Review | média | precisa corrigir | `geek-shopping-api/src/main/java/br/com/erudio/exception/handler/CustomEntityResponseHandler.java:73-82` | `MultipartException` genérica cai no catch-all e vira 500 | Aberto |
| CR-3 | Code Review | média | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/data/dto/CategoryDTO.java:3` | DTOs novos como `record` e `ProductFilter` sem o sufixo `DTO` | Aberto |
| CR-4 | Code Review | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/controllers/ProductController.java:110-117` | Lógica de cache (MD5/ETag/`CacheControl`) no controller, que recebe a entidade `ProductImage` | Aberto |
| CR-5 | Code Review | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/ProductControllerDocs.java:194-195` | O 400 documentado não cobre o `ExceptionResponse` real (estende TD-22) | Aberto |
| CR-6 | Code Review | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/ProductControllerDocs.java:35-217` | Sem anotações compostas e sem exemplos de erro no Swagger (estende `backend/07` item 15) | Aberto |
| CR-7 | Code Review | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/validation/OldPriceGreaterThanPrice.java:1` | Pacote `validation` fora do layout documentado | Aberto |
| CR-8 | Code Review | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:124-126` | Chamadas com vários argumentos por linha | Aberto |
| CR-9 | Code Review | média | precisa corrigir | `geek-shopping-app/components/ui/atoms/Textarea/Textarea.module.css:25` | `Textarea` usa o token inexistente `--surface-primary` e perde o anel de foco | Aberto |
| CR-10 | Code Review | baixa | tolerável | `geek-shopping-app/components/feature/Products/Products.tsx:174-183` | Erro 400 de parâmetro em `/products` só oferece "Try again", que falha de novo | Aberto |
| CR-11 | Code Review | baixa | tolerável | `geek-shopping-app/hooks/useCart/useCart.ts:54` | Carrinho mantém a quantidade de produto que esgotou (nova evidência no TD-26) | Aberto |
| CR-12 | Code Review | baixa | tolerável | `geek-shopping-app/components/feature/Header/Header.tsx:128-140` | Menu de categorias do Header sem estado de carregando, erro ou vazio | Aberto |
| CR-13 | Code Review | baixa | tolerável | `geek-shopping-app/app/core/api/products.ts:133-138` | O `Location` do 201 não é usado no front, ao contrário do plano | Aberto |
| CR-14 | Code Review | baixa | tolerável | `geek-shopping-app/app/core/api/queryKeys.ts:3-11` | Chaves de query divergem da fábrica da spec | Aberto |
| CR-15 | Code Review | baixa | tolerável | `docs/plans/stories/catalogo-de-produtos-com-upload-de-imagem.md:265` | O "Implementado" do Frontend descreve `PUT /{id}`, mas o código usa `PUT` na raiz | Aberto |
| TD-67 | Tech debt (Code Review) | baixa | tolerável | `ProductService.java:127,152,158,300`; `ProductRepository.java:46-97` | Seis `@Query` devolvem `List<Object[]>` lidos por índice e cast; mudar a ordem das colunas só falha em execução (usar `SELECT new` ou projeção) | Aberto |
| TD-68 | Tech debt (Code Review) | baixa | tolerável | `ProductRepository.java:82`; `ProductService.java:55-56,123,130-133`; `ShopSidebar.tsx:23-27` | Largura da faixa de preço (100) duplicada entre JPQL, service e front (`PRICE_CENT`) | Aberto |
| TD-69 | Tech debt (Code Review) | baixa | tolerável | `AdminProducts.tsx:165-173`; `Products.tsx:174-183`; `ProductDetail.tsx:52-60`; `Cart.tsx:38-44` | Bloco "erro + Try again" copiado 4 vezes e checagem de 404 em 3 lugares (molécula `QueryError` e `isNotFound`) | Aberto |
| TD-70 | Tech debt (Code Review) | baixa | tolerável | `AdminProducts.tsx:98-114`; `Products.tsx:72-87`; `ProductDetails.tsx`; `ProductDetail.tsx` | Colunas do DataTable e quick view duplicam lista admin e página de detalhe | Aberto |
| TD-71 | Tech debt (Code Review) | baixa | tolerável | `ProductCard.tsx`; `ProductDetails.tsx`; `ProductDetail.tsx`; `AdminProducts.tsx:112`; `Products.tsx:86` | Regra de estoque e literal "Out of stock" em ~15 pontos, sem `isInStock` nem constante (estende TD-26) | Aberto |
| TD-72 | Tech debt (Code Review) | baixa | tolerável | `useWishlistStore.ts:21` | `has` do wishlist só é usado em testes | Aberto |
| TD-73 | Tech debt (Code Review) | baixa | tolerável | `useCategories.ts:9`, `useFacets.ts:10`, `useFeaturedProducts.ts:9`, `useRecentProducts.ts:9`, `useProducts.ts:10` | `retry: 1` repetido em hooks; o `QueryClient` já define o padrão | Aberto |
| TD-74 | Tech debt (Code Review) | média | precisa corrigir | `ProductController.java:110-117`; `ProductService.java:163-168` | Controller manipula a entidade `ProductImage` e calcula ETag; service deveria devolver um `record` (junto com CR-4 e TD-21) | Aberto |
| TD-75 | Tech debt (Code Review) | baixa | tolerável | `ProductService.java:28,171,189,217-229` | `MultipartFile` (tipo web) dentro do service | Aberto |
| TD-76 | Tech debt (Code Review) | baixa | tolerável | `ProductImage.java:23,26` | `@Column` sem `nullable` e `length` (spec `backend/02:46`) | Aberto |
| TD-77 | Tech debt (Code Review) | baixa | tolerável | `application.yml:9-11` | URL, usuário e senha do banco em texto puro (conhecido: `backend/07` item 14, fora do escopo da história) | Aberto |
| TD-78 | Tech debt (Code Review) | baixa | tolerável | `ProductService.java:57-58,273-285`; `ProductRepository.java:19-23` | Sentinelas no filtro (lista `[""]`, categoria `''`, preço máximo 1e12); estende TD-14 e TD-17 | Aberto |
| TD-79 | Tech debt (Code Review) | baixa | tolerável | `Header.tsx:21-25,55-95,157`; `ProductCard.tsx:45` | Controles decorativos sem comportamento (moeda, idioma, sign in, coração leva a `/products`); TD-57 cobre só frete, cupom e comparar | Aberto |
| TD-80 | Tech debt (Code Review) | média | precisa corrigir | `ProductService.java:220-225` | `IOException` do upload vira 400 "imagem inválida", sem causa e sem log; falha de servidor aparece como erro do cliente | Aberto |
| TD-81 | Tech debt (Code Review) | baixa | precisa corrigir | `ProductRequestDTO.java:48-52`; `ProductRepository.java:46,58` | API aceita `color`/`size` em branco e gera faceta de nome vazio (só o front normaliza) | Aberto |
| TD-82 | Tech debt (Code Review) | baixa | tolerável | `httpClient.ts:36-40` | Cliente axios sem `timeout`; com a API parada o spinner nunca chega ao estado de erro | Aberto |
| TD-83 | Tech debt (Code Review) | baixa | tolerável | `ProductForm.tsx:61-84,179-219`; `imageFile.ts:3,7` | Limites de validação repetidos (validação e `maxLength`) e mensagem "5 MB" fixa, separada da constante (TD-20, TD-31) | Aberto |
| TD-84 | Tech debt (Code Review) | baixa | tolerável | `Modal.tsx:14-26`; `DataTable.tsx`; `Textarea.tsx` | `Modal`, `DataTable` e `Textarea` sem teste direto (Escape, clique no fundo, `onRowClick`) | Aberto |
| TD-85 | Tech debt (Code Review) | baixa | tolerável | `scripts/generate_product_images_migration.py:25-68,196` | Script gerador sem ensaio automatizado (`--dry-run` do AC-9 não feito) e catálogo duplicado em script e V5; risco de reexecução | Aberto |
| PF-1 | Performance | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:255` | `sortBy=rating` com `nullsLast` não aproveita índice (filesort sempre) | Aberto |
| PF-2 | Performance | média | precisa corrigir | `geek-shopping-api/src/main/resources/db/migration/V3__Alter_Table_Products_Add_Catalog_Columns.sql:1-15` | Nenhum índice secundário nas colunas filtradas, agrupadas e ordenadas | Aberto |
| PF-3 | Performance | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/repositories/ProductRepository.java:18` | Predicado de texto com `LOWER()` aplicado sempre, mesmo sem busca | Aberto |
| PF-4 | Performance | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:124-143` | Quatro varreduras com o mesmo filtro em cada `/facets` | Aberto |
| PF-5 | Performance | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:170-174` | Transação (e conexão do pool) aberta enquanto o upload é lido e validado | Aberto |
| PF-6 | Performance | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:309-346` | Links HATEOAS idênticos recalculados para cada item da página | Aberto |
| PF-7 | Performance | baixa | tolerável | `geek-shopping-app/app/providers.tsx:11` | `staleTime: 0` global para dados que quase não mudam | Aberto |
| PF-8 | Performance | média | precisa corrigir | `geek-shopping-app/app/core/utils/cropImage.ts:37-38` | O crop não limita a dimensão nem revalida o tamanho, e a imagem original é servida nas miniaturas | Aberto |
| PF-9 | Performance | baixa | tolerável | `geek-shopping-app/components/ui/atoms/ProductImage/ProductImage.tsx:16` | `<img>` das listagens sem `loading="lazy"`, `decoding` e dimensões | Aberto |
| TD-86 | Tech debt (Performance) | baixa | tolerável | `ProductRepository.java:53-111`; `ProductService.java:124-143,267-270` | Lista de 9 parâmetros de filtro repetida em 5 queries e 5 chamadas (sobrepõe o TD-14; sugestão: record `SearchParams` com SpEL ou Specification) | Aberto |
| TD-87 | Tech debt (Performance) | baixa | tolerável | `ProductService.java:102-116` | `findFeatured` e `findRecent` quase idênticos (extrair helper de preset) | Aberto |
| TD-88 | Tech debt (Performance) | baixa | tolerável | `application.yml:8-10` | URL, usuário e senha do banco fixos, sem `${DB_...}` (sobrepõe o TD-77) | Aberto |
| TD-89 | Tech debt (Performance) | média | precisa corrigir | `ProductService.java:54-57,219,326`; `ProductRepository.java:101`; `application.yml:16-19`; `imageFile.ts:3,7`; `useProductSearchParams.ts:8,27` | Limites e buckets duplicados entre camadas (bucket 100 no JPQL e no service, 5 MB em 4 lugares, default de paginação no back e no front, sentinela 1e12) e sem `spring.datasource.hikari.*` nem timeout de query (relaciona PF-5; sobrepõe TD-68, TD-78 e TD-83) | Aberto |
| TD-90 | Tech debt (Performance) | média | tolerável | `ProductControllerQueryJsonTest.java`; `Cart.test.tsx:19`, `Header.test.tsx:56`, `ProductDetail.test.tsx:95`, `dataHooks.test.tsx:157`, `useCart.test.tsx:23` | Sem teste de regressão de performance/queries (PF-1, PF-2, PF-4) e cinco testes do front com espera fixa de 50 ms (trocar por `waitFor`/`findBy*`) | Aberto |
| SEC-1 | Segurança | média | precisa corrigir | `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/ProductControllerDocs.java:60,62` | `minPrice`/`maxPrice` sem teto nem escala: um GET pequeno faz o driver montar uma string enorme (DoS) | Aberto |
| SEC-2 | Segurança | baixa | precisa corrigir | `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/ProductControllerDocs.java:48` | `page` sem teto: página enorme vira 500 e stack trace no log | Aberto |
| SEC-3 | Segurança | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/controllers/docs/ProductControllerDocs.java:64,66` | `color`/`productSize` repetíveis sem limite de quantidade (`IN` com milhares de parâmetros) | Aberto |
| SEC-4 | Segurança | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/controllers/ProductController.java:112-116` | Resposta da imagem sem `nosniff` nem CSP, e validação só pelos primeiros bytes (polyglot) | Aberto |
| SEC-5 | Segurança | baixa | tolerável | `geek-shopping-api/src/main/java/br/com/erudio/services/ProductService.java:217-228` | Metadados EXIF (GPS, aparelho) publicados quando o upload é feito sem recorte | Aberto |
| TD-91 | Tech debt (Segurança) | média | precisa corrigir | `application.yml:9-11` | URL, usuário e senha do banco literais e versionados, sem `${ENV:default}` (valor omitido; sobrepõe TD-77 e TD-88) | Aberto |
| TD-92 | Tech debt (Segurança) | baixa | tolerável | `ProductControllerDocs.java:56-58,115-117`; `ProductService.java:288-295` | `q` e `category` sem `@Size`; o filtro aceita o que o cadastro não aceitaria (100 caracteres) e `q` vira LIKE com padrão ilimitado | Aberto |
| TD-93 | Tech debt (Segurança) | baixa | tolerável | `ProductService.java:54`; `CustomEntityResponseHandler.java:212`; `application.yml:15-18`; `imageFile.ts:3,11` | Limite de 5 MB repetido em cinco pontos, com mensagem escrita à mão (sobrepõe TD-83 e TD-89) | Aberto |
| TD-94 | Tech debt (Segurança) | baixa | tolerável | `src/test/resources/application.yml`; `src/main/resources/application.yml:12-14,35-39` | `application.yml` de teste é cópia do principal; sem perfis, `flyway.baseline-on-migrate` com `baseline-version: 2` e o Swagger na raiz valem para qualquer ambiente (relaciona TD-62) | Aberto |
| TD-95 | Tech debt (Segurança) | baixa | tolerável | `geek-shopping-api/pom.xml:25,68-72` | `dozer-core` 7.0.0 fixado fora do BOM, sem manutenção recente, com Java 25 e Boot 4.1.1 | Aberto |
| TD-96 | Tech debt (Segurança) | média | tolerável | `geek-shopping-app/next.config.ts:9-15` | Headers de segurança só no front, sem CSP; a API em `:8080` não envia nenhum; HSTS com `preload` em qualquer ambiente (relaciona SEC-4) | Aberto |
| TD-97 | Tech debt (Segurança) | baixa | precisa corrigir | `ImageTypeDetectorTest.java`; `ProductControllerErrorsJsonTest.java` | Faltam testes de segurança de upload e de parâmetros (polyglot, arquivo truncado, `q`/`category` longos, headers de `/image`, EXIF, preço e listas fora do limite); cada correção SEC deve entrar com o seu teste | Aberto |
| TD-98 | Tech debt (Segurança) | baixa | tolerável | `httpClient.ts:22-24,36-40` | Cliente axios sem `timeout` e `requestInterceptor` vazio (sobrepõe TD-82) | Aberto |
| TD-99 | Tech debt (Segurança) | baixa | tolerável | `WebConfig.java:23-27,32` | `cors.originPatterns:default` vira origem literal "default" quando falta; `allowCredentials(true)` ligado sem autenticação | Aberto |
| TD-100 | Tech debt (Complete Story) | baixa | tolerável | `ProductControllerErrorsJsonTest.java:71-118,359-365`; `ProductRequestDTOValidationTest.java:88-205` | Integração repete seis regras de limite que a validação unitária já cobre | Aberto |
| TD-101 | Tech debt (Complete Story) | baixa | tolerável | `ProductControllerJsonTest.java`; `ProductControllerErrorsJsonTest.java`; `ProductControllerQueryJsonTest.java`; `ProductSeedJsonTest.java:51`; `ProductApi.java:68-76` | `GET /{id}/image` copiado 13 vezes, id inexistente em linha e quatro estilos de limpeza (`ProductApi.image(id)`, `MISSING_ID`) | Aberto |
| TD-102 | Tech debt (Complete Story) | baixa | tolerável | `CorsJsonTest.java:62,68-69,103-117`; `TestConfigs.java:10` | Cleanup redundante, `x-cart-token` fixo (carrinho não existe nesta história) e `ORIGIN_LOCAL` na porta 8080 (estende TD-64) | Aberto |
| TD-103 | Tech debt (Complete Story) | baixa | tolerável | `ProductControllerErrorsJsonTest.java:185-209,346-357`; sufixo `Test` nos métodos | Classes de integração com nome e conteúdo desencontrados (casos de sucesso e de `page`/`size` no "Errors") e sufixo `Test` inconsistente | Aberto |
| TD-104 | Tech debt (Complete Story) | baixa | tolerável | `ImageTypeDetectorTest.java:66-76`; `ProductControllerErrorsJsonTest.java:155-165`; `ProductSeedJsonTest.java:33,91` | Testes com nome ou parametrização enganosos | Aberto |
| TD-105 | Tech debt (Complete Story) | baixa | tolerável | `ProductApi.java:78-93`; `ApiIntegrationTest.java:11`; `ProductControllerQueryJsonTest.java:417`; `SwaggerIntegrationTest.java:86` | Helpers de baixa qualidade (`record MultipartRequest` sem ganho, constante com nome de campo, `assertTrue(!x)` de volta) | Aberto |
| TD-106 | Tech debt (Complete Story) | média | precisa corrigir | `docs/specs/backend/03:28,31,55,85,95`; `backend/04:17-18,45-47,58-59`; `backend/05:13`; `frontend/03:24,53-54,63,67`; `frontend/05:9,24,29`; specs `07` | Specs de modelo, contrato e migrações descrevem outro desenho (categoria hierárquica, `categoryId`, `image_url`, V3–V6); os `07` ficaram como retrato antigo | Aberto |
| TD-107 | Tech debt (Complete Story) | baixa | tolerável | `docs/specs/frontend/06:17`; `atoms.test.tsx`, `molecules.test.tsx`, `dataHooks.test.tsx`, `utils.test.ts`, `stores.test.ts` | Testes do frontend agregados fora do padrão `<Name>.test.tsx` ao lado do código | Aberto |
| TD-108 | Tech debt (Complete Story) | baixa | tolerável | `vitest.config.ts:13`; `test/fixtures.ts:3`; `utils.test.ts:13` | `http://api.test` repetida em três lugares | Aberto |
| TD-109 | Tech debt (Complete Story) | média | precisa corrigir | `.gitignore:4` (raiz do repositório); `.claude/settings.json` | O ignore global `**/skills/` impede versionar as skills do plugin `erudio`, que o settings do projeto habilita; num clone o plugin fica sem skills | Aberto |
| TD-110 | Tech debt (Complete Story) | baixa | tolerável | `scripts/generate_product_images_migration.py:140-146,196-198` | Conhecido (atualiza o TD-85): o script já tem `--dry-run`; sem documentação de uso nem da origem das imagens; sem teto de 5 MB na leitura | Aberto |
| TD-111 | Tech debt (Complete Story) | baixa | tolerável | `ProductServiceTest.java:378-390` | Teste fixa o comportamento errado do `IOException` (TD-80); corrigir o TD-80 quebra este teste | Aberto |
| TD-112 | Tech debt (Complete Story) | baixa | tolerável | `V5__Insert_Data_In_Products_Catalog.sql:1-14`; `V3__Alter_Table_Products_Add_Catalog_Columns.sql:11,13` | V5 de 2 MB sem cabeçalho de origem, `longblob` para limite de 5 MB e `rating` sem faixa no banco (só em migration nova) | Aberto |
| TD-113 | Tech debt (Complete Story) | baixa | tolerável | `ProductServiceTest.java:710-729` | `findAllAcceptsMinPriceEqualToMaxPrice` só faz `assertDoesNotThrow` e `findAllWithoutFilters` repete o helper | Aberto |
| TD-114 | Tech debt (Complete Story) | média | precisa corrigir | `CLAUDE.md:45` (raiz do módulo) | `CLAUDE.md` da raiz ainda diz que o app roda em mock (`USE_MOCK_PRODUCT_DATA`) e não lista `erudio/`, `scripts/`, `docs/` nem o `extraKnownMarketplaces` do projeto | Aberto |
| TD-115 | Tech debt (Complete Story) | média | precisa corrigir | `geek-shopping-api/CLAUDE.md` (Commands, Architecture, Endpoints) | `CLAUDE.md` da API parou no estado anterior à história (endpoints, pacotes, multipart, `ProblemDetail`, Testcontainers, caminho do plugin) | Aberto |
| TD-116 | Tech debt (Complete Story) | média | precisa corrigir | `geek-shopping-app/README.md:29-40,80,93,102-104`; `ARCHITECTURE.md:5,20-27,59,68,119,121,184,186` | README e ARCHITECTURE do app: além do mock (TD-35), citam `useProductFilters` apagado, "Button.test.tsx é o único teste" e exclusões de cobertura removidas; omitem `/admin/products`, MSW, Playwright e `npm run e2e` | Aberto |

## Fechamento

**Encerrada em 25/10/2026 23:36** por decisão explícita do usuário ("Encerrar a história"), com todas as linhas da tabela ✅. As dez linhas anteriores estão ✅; nenhuma lacuna de etapa foi aceita. Duas etapas foram fechadas com ressalva do próprio registro: "Implementação dos testes de Integração" (✅ 25/10/2026 22:59) foi aceita pelo usuário **sem executar o Playwright E2E**, e as passadas de débito técnico dos reviews não leram todos os arquivos (cobertura declarada em cada seção).

### Critérios de aceite

| AC | Evidência | Situação |
|---|---|---|
| AC-1 | `ProductController` POST multipart; `ProductControllerJsonTest` (201, `Location`, `imageUrl`, bytes e `Content-Type` do `GET /{id}/image`) | evidenciado |
| AC-2 | `ProductRequestDTOValidationTest`; `ProductControllerErrorsJsonTest` (400 `ProblemDetail` com `errors{}` por campo) | evidenciado |
| AC-3 | `ImageTypeDetectorTest`; `ProductControllerErrorsJsonTest` (tipo pelo conteúdo, mais de 5 MB, exatamente 5 MB) | evidenciado |
| AC-4 | `ProductControllerJsonTest` (PUT sem `image` mantém, com `image` troca); `ProductServiceTest` | evidenciado |
| AC-5 | `ProductControllerJsonTest` (DELETE 204 e GET 404) | evidenciado |
| AC-6 | `ProductControllerQueryJsonTest` e `ProductControllerErrorsJsonTest` (filtros combinados, `sortBy`, `direction`, `size`, `page`, `minPrice` > `maxPrice`); `ProductRepositoryTest` | evidenciado |
| AC-7 | `ProductControllerQueryJsonTest` (`facets`, `categories`, `featured`, `recent`) | evidenciado |
| AC-8 | `ProductControllerQueryJsonTest` (listagem sem a propriedade da imagem); `ProductRepositoryTest`; Code Review confirmou que `Product` não mapeia `image` | evidenciado |
| AC-9 | `StartupTests` (migrations do zero no container) e `ProductSeedJsonTest` (14 produtos, 6 categorias, imagem JPEG servida, produto 3 sem estoque, destaques); V5 verificada por MD5 (14 de 14); V1 e V2 intactas conferido pelo Code Review (`git status`) | parcial: sem teste automatizado de V1/V2 intactas nem ensaio `--dry-run` do script (TD-85, TD-110) |
| AC-10 | `ProductCard.test`, `Products.test`, `Home.test` (selo "Out of stock" e botão desabilitado); `e2e/catalog.spec.ts`, cenário do produto esgotado | parcial: testado em componente; E2E escrito e não executado |
| AC-11 | `Home.test` (categorias com contagem, destaques, recentes, placeholder, sem estrelas sem `rating`); E2E da Home | parcial: componente; E2E não executado |
| AC-12 | `Products.test`, `ShopSidebar.test`, `useProductSearchParams.test`; E2E de filtro, ordenação e paginação | parcial: componente; E2E não executado |
| AC-13 | `ProductDetail.test`, `useCart.test`, `Cart.test`; E2E home → produto → carrinho e 404 | parcial: componente; E2E não executado |
| AC-14 | `AdminProducts.test`, `ProductForm.test`, `molecules.test` (cropper simulado), `cropImage`; E2E de criar, editar e excluir; o multipart real por XHR não foi provado (TD-55) | parcial: componente; E2E não executado |
| AC-15 | `app/core/mocks` removida (busca no código e Code Review); estados carregando, vazio e erro testados em Home, Products, ProductDetail, Cart e AdminProducts | evidenciado |
| AC-16 | `SwaggerIntegrationTest` (7 testes: UI, só `/api/product/v1/**`, multipart, 201, 400, 404, tipos de imagem) | parcial: CR-1 (listagens sem corpo e 201 sem header `Location` no Swagger) |
| AC-17 | `ProductControllerJsonTest` (campos do servidor ignorados); `ProductControllerQueryJsonTest` (`sortBy=rating` com nota nula no fim) | evidenciado |

**Resumo:** 10 evidenciados, 7 parciais, 0 sem evidência. Os parciais AC-10 a AC-14 dependem do `npm run e2e` (API em `:8080`, app em `:3000`, `npx playwright install chromium`) e da conferência visual, que não foram feitos.

### Achados e débitos em aberto (por severidade)

Contagem final: **alta 0**, **média 27**, **baixa 89** em aberto; corrigidos: média 14, baixa 14, alta 1 (TD-24). Nenhum `Aceito` nem `Contestado`. Nenhuma `alta` aberta.

- **Média em aberto (27):** TD-14, TD-21, TD-27, TD-28, TD-53, TD-55, TD-59, TD-60, TD-66, CR-1, CR-2, CR-3, CR-9, TD-74, TD-80, PF-2, PF-8, TD-89, TD-90, SEC-1, TD-91, TD-96, TD-106, TD-109, TD-114, TD-115, TD-116.
- **Baixa em aberto (89):** TD-5, TD-10, TD-16, TD-19, TD-20, TD-22, TD-23, TD-29, TD-30, TD-31, TD-32, TD-33, TD-35, TD-36, TD-37, TD-41, TD-43, TD-44, TD-46, TD-47, TD-48, TD-49, TD-51, TD-54, TD-57, TD-58, TD-62, TD-65, CR-4, CR-5, CR-6, CR-7, CR-8, CR-10, CR-11, CR-12, CR-13, CR-14, CR-15, TD-67, TD-68, TD-69, TD-70, TD-71, TD-72, TD-73, TD-75, TD-76, TD-77, TD-78, TD-79, TD-81, TD-82, TD-83, TD-84, TD-85, PF-1, PF-3, PF-4, PF-5, PF-6, PF-7, PF-9, TD-86, TD-87, TD-88, SEC-2, SEC-3, SEC-4, SEC-5, TD-92, TD-93, TD-94, TD-95, TD-97, TD-98, TD-99, TD-100, TD-101, TD-102, TD-103, TD-104, TD-105, TD-107, TD-108, TD-110, TD-111, TD-112, TD-113.
- **Dos abertos, com veredito "precisa corrigir" (22):** TD-16, TD-55, TD-59, TD-60, CR-1, CR-2, CR-9, TD-74, TD-80, TD-81, PF-2, PF-8, TD-89, SEC-1, SEC-2, TD-91, TD-97, TD-106, TD-109, TD-114, TD-115, TD-116. Os de produção que merecem atenção primeiro: SEC-1 (DoS por `minPrice`/`maxPrice` em notação científica), SEC-2 (`page` enorme vira 500), CR-2 (`MultipartException` vira 500), TD-80 (falha de I/O vira 400), TD-59 (`createdAt` do POST com nanossegundos), PF-2 (sem índices), TD-91 (credenciais do banco literais); de documentação: TD-106, TD-109 (skills do plugin ignoradas pelo `.gitignore`), TD-114, TD-115, TD-116.
- Detalhes (local, evidência, prós e contras) na tabela `## Alertas e débitos técnicos` e nas seções de `## Resultados dos reviews`. Sobreposições entre achados registrados (TD-86/TD-14, TD-88/TD-77/TD-91, TD-93/TD-83/TD-89, TD-98/TD-82) ficam como estão.

### Pontos em aberto do plano
Seguem abertos os pontos 2 (nome original do arquivo), 3 (remover só a imagem), 4 (texto do selo), 9 (unicidade do nome), 11 (specs a atualizar; ver TD-106), 13 (plano ainda descreve V4/V5 com `UPDATE`; TD-16), 14 (teto de preço), 17 (baseline do Flyway), 18 (README e ARCHITECTURE do app; TD-116), 19 e 26 (`npm audit`: 8 vulnerabilidades, 1 crítica no `next`), 20 (runtime não exercitado), 21 a 25 e 27 a 30 (ver a seção). Em especial: **o Playwright E2E nunca foi executado** (ponto 28), e `msw` e `@playwright/test` foram instalados com `--legacy-peer-deps` (ponto 25: conferir `npm ci` numa instalação limpa).

### Decisões do usuário durante o fechamento
- Encerrar a história mesmo com os achados médios e baixos acima abertos e com os ACs 10 a 14 sem prova em navegador.
- Antes do fechamento, o usuário havia aceito fechar os testes de integração sem rodar o Playwright (25/10/2026 22:59).
- As correções dos achados "precisa corrigir" não foram pedidas aqui; ficam para uma história de manutenção ou para as próximas entregas.

### Para o commit
O commit é do usuário. Atenção ao TD-109: o `.gitignore` da raiz ignora `**/skills/`, então as skills de `erudio/plugins/erudio/skills/` não entram no `git add`.
