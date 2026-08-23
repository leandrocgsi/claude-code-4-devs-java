# [Formação Spring Boot 2026: do Zero ao Continuous Deployment](https://pub.erudio.com.br/formacao-spring-boot-2026-do-zero-ao-continuous-deployment-na-aws-e-gcp-com-java-docker-e-kubernetes?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo-oficial)

### [REST APIs RESTful com Java, Spring Boot, Maven, MySQL, JPA, Hibernate, Flyway, Jakarta Validation, Swagger/OpenAPI e Testes](https://pub.erudio.com.br/formacao-spring-boot-2026-do-zero-ao-continuous-deployment-na-aws-e-gcp-com-java-docker-e-kubernetes?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo-oficial)

![GitHub forks](https://img.shields.io/github/forks/leandrocgsi/claude-code-4-devs-java?style=social) ![GitHub Repo stars](https://img.shields.io/github/stars/leandrocgsi/claude-code-4-devs-java?style=social) ![GitHub last commit](https://img.shields.io/github/last-commit/leandrocgsi/claude-code-4-devs-java) [![Donate with PayPal](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate/?hosted_button_id=ZJ4NQJXEKQ63A)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/07-rest-java.png "Formação Spring Boot 2026")](https://pub.erudio.com.br/formacao-spring-boot-2026-do-zero-ao-continuous-deployment-na-aws-e-gcp-com-java-docker-e-kubernetes?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo-oficial)

## 📚 Módulo 04: Evoluindo uma Aplicação Spring Boot e Java

Este é o repositório do **Módulo 04** da Formação Spring Boot 2026. Aqui você encontra todo o código-fonte do módulo completo, com as 12 aulas progressivas (0403–0414) que ensinam como evoluir uma aplicação Spring Boot do zero à produção, utilizando Claude Code para gerenciar as mudanças de forma segura e rastreável.

**O módulo cobre:**
- ✅ Persistência MySQL com JPA/Hibernate
- ✅ Repository Pattern com Spring Data JPA
- ✅ DTOs e mapeamento com ModelMapper
- ✅ Validações com Jakarta Validation
- ✅ Migrations de schema com Flyway
- ✅ Documentação automática com Swagger/OpenAPI
- ✅ Paginação, ordenação e filtros avançados
- ✅ Relacionamentos entre entidades
- ✅ Soft delete e auditoria automática
- ✅ Queries customizadas (@Query JPQL e SQL nativo)
- ✅ Testes unitários com Mockito
- ✅ Testes de controller com @WebMvcTest

---

## 🗂️ Estrutura do Repositório

| Aula | Tópico | Feature Adicionada |
|------|--------|-------------------|
| `0403` | Conectando ao MySQL | Dependências JPA + MySQL + Entidade @Entity |
| `0404` | Persistência com Spring Data JPA | PersonRepository + Refactor Service |
| `0405` | DTOs e Separação de Camadas | PersonDTO + ModelMapper Config |
| `0406` | Validações e Exception Handling | Jakarta Validation + @Valid + Handler expandido |
| `0407` | Versionamento com Flyway | Migrations SQL + DDL automático |
| `0408` | Documentação com Swagger/OpenAPI | OpenAPI Config + @Operation no Controller |
| `0409` | Paginação e Filtros | Pageable + Page<T> + Query Methods |
| `0410` | Relacionamentos entre Entidades | Address Entity + @ManyToOne + DTOs aninhados |
| `0411` | Soft Delete e Auditoria | Timestamps automáticos + Soft Delete Logic |
| `0412` | Queries Customizadas | @Query JPQL + SQL Nativo + novos endpoints |
| `0413` | Testes Unitários da Service | Unit Tests com Mockito + 3 cenários |
| `0414` | Testes de Controller e Checkpoint | @WebMvcTest + Regressão de testes completa |

---

## 📝 Prompts das Aulas

### **Aula 0403** — Conectando ao MySQL e Criando a Primeira Entidade JPA

**Objetivo:** Sair do mock em memória e preparar a base para persistência real.

#### Prompt 1: Adicionar Dependências
Adicione as seguintes dependências ao `pom.xml` do projeto Spring Boot:
1. `spring-boot-starter-data-jpa` (para trabalhar com JPA)
2. `mysql-connector-j` (driver oficial do MySQL para Java)

Não adicione nenhuma outra dependência, não altere código Java, mantenha apenas o `pom.xml`.

#### Prompt 2: Configurar Conexão com MySQL
Edite `src/main/resources/application.yml` para configurar a conexão com MySQL:
- `url: jdbc:mysql://localhost:3306/claude-code-4-devs-java`
- `username: root`, `password: admin123`
- `spring.jpa.hibernate.ddl-auto: update`
- `spring.jpa.show-sql: true` (para acompanharmos o SQL gerado durante o curso)

Mantenha as demais configurações existentes, não crie o banco.

#### Prompt 3: Transformar Person em Entidade JPA
Refatore a classe `Person` (`src/main/java/br/com/erudio/model/Person.java`) para virar uma entidade JPA:
1. Adicione `@Entity` e `@Table(name = "person")`
2. Adicione `@Id` e `@GeneratedValue(strategy = GenerationType.IDENTITY)` no campo `id`
3. Mantenha todos os campos e métodos existentes (getters, setters, equals, hashCode)

Não crie novos campos, não mude nomes, não altere nenhuma lógica.

---

### **Aula 0404** — Persistindo Dados de Verdade com Spring Data JPA

**Objetivo:** Trocar o `PersonServices` mockado por persistência real via repository.

#### Prompt 1: Criar Repository Interface
Crie uma nova interface `PersonRepository` que estenda `JpaRepository<Person, Long>` no pacote `br.com.erudio.repository`.

Salve em: `src/main/java/br/com/erudio/repository/PersonRepository.java`

Não adicione métodos customizados neste momento, apenas a herança do `JpaRepository`.

#### Prompt 2: Refatorar Service para Usar Repository
Refatore a classe `PersonServices` para:
1. Injetar `PersonRepository` via `@Autowired`
2. Substituir todos os mocks (`findAll`, `findById`, `create`, `update`, `delete`) para usar o repository
3. Manter a mesma assinatura de métodos e tipos de retorno

Não mude nomes de métodos, não altere exceções lançadas, implemente CRUD padrão sem lógica extra.

#### Prompt 3: Verificação Manual
Suba a aplicação e me ajude a validar manualmente pelo Postman/Insomnia que os dados de `Person` agora persistem de verdade no MySQL: crie uma pessoa, reinicie a aplicação e confirme que ela ainda existe no `GET /person`.

Não altere nenhum código nesse prompt — apenas rode e valide.

---

### **Aula 0405** — Separando API e Persistência com DTOs e ModelMapper

**Objetivo:** Parar de expor a entidade JPA diretamente na API.

#### Prompt 1: Criar DTO
Crie a classe `PersonDTO` no pacote `br.com.erudio.dto` com campos: `id`, `firstName`, `lastName`, `address`, `gender`.

Este DTO será usado tanto para entrada (request) quanto para saída (response). POJOs simples, sem validações neste momento.

#### Prompt 2: Configurar ModelMapper
Adicione `org.modelmapper:modelmapper` (versão 3.1.1 ou maior) ao `pom.xml`.

Crie uma classe `ModelMapperConfig` no pacote `br.com.erudio.config` que exponha o `ModelMapper` como `@Bean`.

#### Prompt 3: Integrar com Service e Controller
Refatore `PersonServices` e `PersonController` para usar `PersonDTO` em vez da entidade `Person` diretamente, convertendo com o `ModelMapper` injetado.

Mantenha a assinatura pública dos endpoints (mesmos paths e verbos HTTP), apenas troque os tipos de entrada/saída.

---

### **Aula 0406** — Validando Entradas e Tratando Erros Profissionalmente

**Objetivo:** Rejeitar dados inválidos antes de chegarem ao banco, com mensagens claras.

#### Prompt 1: Adicionar Anotações de Validação
1. Adicione `spring-boot-starter-validation` ao `pom.xml` (inclui Jakarta Validation)
2. Anote `PersonDTO` com `@NotBlank(message="...")` no `firstName` e `lastName`, `@NotNull(message="...")` no `gender`, `@Size(min=5, message="...")` no `address`.

Use mensagens customizadas em cada anotação.

#### Prompt 2: Aplicar @Valid no Controller
Adicione a anotação `@Valid` ao parâmetro `PersonDTO` nos endpoints `POST` e `PUT` do `PersonController`.

Não altere nenhuma outra lógica dos endpoints, apenas adicione a anotação.

#### Prompt 3: Expandir Exception Handler para Validações
Expanda a classe `CustomEntityResponseHandler` (`@RestControllerAdvice`) para sobrescrever o método `handleMethodArgumentNotValid`.

Retorne um `ExceptionResponse` com uma lista de mensagens de validação para cada campo que foi inválido.

---

### **Aula 0407** — Versionando o Schema do Banco com Flyway

**Objetivo:** Trocar `ddl-auto: update` por controle explícito e versionado do schema.

#### Prompt 1: Adicionar Dependências e Configuração
1. Adicione `org.flywaydb:flyway-core` e `org.flywaydb:flyway-mysql` ao `pom.xml`
2. Em `application.yml`, adicione `spring.flyway.enabled: true` e troque `spring.jpa.hibernate.ddl-auto` para `validate` (em vez de `update`)

Não crie migrations neste prompt, apenas prepare a configuração.

#### Prompt 2: Criar Primeira Migration
Crie o arquivo `src/main/resources/db/migration/V1__Create_Person_Table.sql` com o script SQL para criar a tabela `person` com as colunas equivalentes aos campos da entidade (`id`, `first_name`, `last_name`, `address`, `gender`).

Não crie migrations adicionais, apenas a V1 para a tabela já existente.

#### Prompt 3: Verificar Aplicação da Migration
Suba a aplicação e confirme que o Flyway aplicou a migration V1 com sucesso (cheque a tabela `flyway_schema_history` no MySQL). Se der erro de tabela já existente (porque o `ddl-auto` já tinha criado a tabela antes), me explique a causa e sugira a correção.

---

### **Aula 0408** — Documentando a API com Swagger/OpenAPI

**Objetivo:** Gerar documentação interativa e testável da API.

#### Prompt 1: Adicionar Dependência e Criar Configuração
1. Adicione `org.springdoc:springdoc-openapi-starter-webmvc-ui` (versão 2.x) ao `pom.xml`
2. Crie `OpenApiConfig` no pacote `br.com.erudio.config` com `@Bean OpenAPI` configurando título `"Person API"`, descrição curta e versão `"v1"`

Não altere nenhum endpoint neste prompt.

#### Prompt 2: Documentar Endpoints
Adicione anotações `@Operation(summary = "...")` e `@ApiResponse` nos métodos do `PersonController`, descrevendo o que cada endpoint faz e os possíveis status HTTP retornados.

Não altere a lógica dos endpoints, apenas as anotações de documentação.

#### Prompt 3: Verificação no Swagger
Suba a aplicação e acesse `/swagger-ui.html` — confirme que todos os endpoints de `Person` aparecem documentados corretamente, incluindo os DTOs de request/response.

---

### **Aula 0409** — Paginação, Ordenação e Filtros de Busca

**Objetivo:** Tornar `GET /person` pronto para bases de dados grandes.

#### Prompt 1: Implementar Paginação
Refatore o endpoint `GET /person` (findAll) para:
1. Aceitar `Pageable` como parâmetro (padrão Spring: `?page=0&size=10&sort=firstName,asc`)
2. Retornar `Page<PersonDTO>` em vez de `List`

Não mude os outros endpoints (`GET by id`, `POST`, `PUT`, `DELETE`).

#### Prompt 2: Adicionar Query Methods no Repository
Adicione dois métodos customizados ao `PersonRepository` usando query methods:
- `Page<Person> findByFirstNameContainingIgnoreCase(String firstName, Pageable pageable)`
- `Page<Person> findByGenderIgnoreCase(String gender, Pageable pageable)`

Não implemente lógica manual, apenas a assinatura reconhecida pelo Spring Data.

#### Prompt 3: Combinar Filtros no Endpoint
Refatore `GET /person` para aceitar parâmetros opcionais `?firstName=X` e `?gender=Y`, chamando o método de repository correspondente quando informados, e o `findAll` paginado padrão quando nenhum filtro for passado.

Não crie novos endpoints, mantenha `POST`/`PUT`/`DELETE` como estão.

---

### **Aula 0410** — Modelando Relacionamentos entre Entidades

**Objetivo:** Introduzir uma segunda entidade relacionada (Address) e mapear a associação.

#### Prompt 1: Criar Entidade Address
Crie a entidade `Address` em `src/main/java/br/com/erudio/model/Address.java` com:
- `@Entity`, `@Table(name="address")`
- Campos: `id`, `street`, `city`, `state`, `zipCode`
- Getters/setters e `@Id/@GeneratedValue` no `id`, seguindo o mesmo padrão de `Person`

Não relacione com `Person` ainda, apenas crie a entidade isolada.

#### Prompt 2: Mapear Relacionamento
Adicione o relacionamento entre as entidades: cada `Person` tem um `Address` (`@ManyToOne` em `Person` apontando para `Address`, com `@JoinColumn(name="address_id")`).

Não altere DTOs ou controllers neste prompt, apenas o mapeamento JPA nas duas entidades.

#### Prompt 3: Criar Repository e Migration
1. Crie `AddressRepository` estendendo `JpaRepository<Address, Long>`
2. Crie a migration `V2__Create_Address_Table.sql` com a tabela `address` e a foreign key `address_id` na tabela `person`

Não altere a V1 existente, apenas adicione a V2.

#### Prompt 4: Expor Relacionamento nos DTOs
Atualize `PersonDTO` para incluir os dados de endereço (um objeto `AddressDTO` aninhado, com os mesmos campos da entidade `Address`), e ajuste o `ModelMapper`/service para converter esse relacionamento corretamente.

Não mude o formato dos outros campos já existentes no DTO.

---

### **Aula 0411** — Soft Delete e Auditoria Automática

**Objetivo:** Parar de apagar registros de verdade e rastrear criação/atualização.

#### Prompt 1: Adicionar Campos de Auditoria
Adicione à entidade `Person` os campos:
- `createdAt` (`LocalDateTime`, `@CreationTimestamp`, não atualizável)
- `updatedAt` (`LocalDateTime`, `@UpdateTimestamp`)
- `deletedAt` (`LocalDateTime`, nullable, sem anotação de timestamp automático)

Use anotações do Hibernate para os timestamps automáticos, não crie lógica manual.

#### Prompt 2: Implementar Soft Delete
Altere o método `delete()` da `PersonServices` para preencher `deletedAt` com a data atual em vez de remover o registro. Ajuste `findAll` e `findById` (e os métodos de filtro criados na aula de paginação) para ignorar registros com `deletedAt` preenchido.

Não altere a assinatura pública dos métodos.

#### Prompt 3: Criar Migration para Campos de Auditoria
Crie a migration `V3__Add_Audit_Fields_To_Person.sql` adicionando as colunas `created_at`, `updated_at` e `deleted_at` na tabela `person`, com os defaults apropriados.

Não altere as migrations V1 e V2 já existentes.

---

### **Aula 0412** — Queries Customizadas com @Query (JPQL e SQL Nativo)

**Objetivo:** Ir além dos query methods automáticos para casos mais específicos.

#### Prompt 1: Implementar Query JPQL
Adicione ao `PersonRepository` o método:
```java
@Query("SELECT p FROM Person p WHERE p.firstName LIKE %:firstName% AND p.deletedAt IS NULL")
List<Person> findActiveByFirstName(@Param("firstName") String firstName);
```

Não crie um endpoint para ele ainda, apenas o método no repository.

#### Prompt 2: Implementar Query SQL Nativa
Adicione ao `PersonRepository` o método:
```java
@Query(value = "SELECT * FROM person WHERE YEAR(created_at) = ?1 AND deleted_at IS NULL",
       nativeQuery = true)
List<Person> findByCreationYear(Integer year);
```

Não crie mais queries além dessas duas.

#### Prompt 3: Expor Query no Endpoint e Testar
Crie um endpoint `GET /person/search/by-year?year=2026` no `PersonController` que use `findByCreationYear`, retornando `List<PersonDTO>`. Teste manualmente no Postman/Insomnia e confirme o resultado.

---

### **Aula 0413** — Testes Unitários da Camada de Service com Mockito

**Objetivo:** Garantir que a lógica de negócio da service continue correta com o tempo.

#### Prompt 1: Setup de Teste
Crie `PersonServicesTest` em `src/test/java/br/com/erudio/PersonServicesTest.java` usando `@ExtendWith(MockitoExtension.class)`, mockando `PersonRepository` e `ModelMapper`.

Não use `@SpringBootTest`, não crie builders ou fixtures auxiliares.

#### Prompt 2: Implementar Testes
Implemente três testes:
1. `create()` chama `repository.save()` e retorna o DTO esperado
2. `findById()` lança exceção quando o id não existe
3. `delete()` atualiza `deletedAt` em vez de chamar `repository.deleteById()`

Use `Mockito.when()`/`verify()` para as asserções.

#### Prompt 3: Rodar e Revisar Resultados
Rode `mvn test` e me mostre o resultado. Se algum teste falhar, explique a causa antes de propor qualquer correção — não altere código de produção sem eu confirmar.

---

### **Aula 0414** — Testes de Controller e Checkpoint Final

**Objetivo:** Testar a camada web isoladamente e fechar o módulo com a suíte de testes saudável.

#### Prompt 1: Setup de Teste de Controller
Crie `PersonControllerTest` em `src/test/java/br/com/erudio/controllers/PersonControllerTest.java` usando `@WebMvcTest(PersonController.class)` e `MockMvc`, mockando `PersonServices` com `@MockBean`.

Não use `@SpringBootTest`.

#### Prompt 2: Implementar Testes Principais
Implemente três testes com `MockMvc`:
1. `GET /person` retorna 200
2. `POST /person` com body válido retorna 200
3. `POST /person` com body inválido (campos obrigatórios ausentes) retorna 400

Não teste os outros endpoints neste prompt.

#### Prompt 3: Checkpoint Final de Regressão
Rode `mvn test` em todo o projeto. Se algum teste anterior (`StartupTests` ou `PersonServicesTest`) estiver quebrado por causa das mudanças das últimas aulas (DTOs, validação, soft delete), me explique cada quebra e corrija apenas o necessário para os testes passarem novamente — sem mudar o comportamento da aplicação.

---

## 🎯 Como Usar Este Repositório

Cada aula possui seu próprio branch ou tag versionado. Você pode clonar o repositório e navegar para a aula desejada:

```bash
# Clonar o repositório completo
git clone https://github.com/leandrocgsi/claude-code-4-devs-java.git
cd claude-code-4-devs-java/04_ClaudeCodeAndSpringBoot

# Ou, se preferir clonar apenas este subdiretório (usando sparse-checkout)
git clone --depth=1 --filter=blob:none --sparse https://github.com/leandrocgsi/claude-code-4-devs-java.git
cd claude-code-4-devs-java
git sparse-checkout set 04_ClaudeCodeAndSpringBoot
```

**Build e execução:**

```bash
# Build completo (clean + package)
mvn clean package

# Executar a aplicação
mvn spring-boot:run

# Rodar todos os testes
mvn test

# Rodar uma classe de teste específica
mvn test -Dtest=PersonControllerTest
```

A aplicação iniciará em `http://localhost:8080`

---

## 🚀 Cursos Relacionados

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/01-hm-claude-code-java.png "Formação Claude Code para DEVs Java e Spring Boot")](https://pub.erudio.com.br/formacao-dev10x-claude-code-para-devs-java-e-spring-boot?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/31-spring-ai-java.png "Formação Spring AI 2026")](https://pub.erudio.com.br/formacao-spring-ai-2026-inteligencia-artificial-com-java-spring-boot-chatgpt-deepseek-claude-e-mcp?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/14-microservices-java.png "Formação Microsserviços 2026")](https://pub.erudio.com.br/formacao-microsservicos-2026-do-zero-ao-deploy-na-google-cloud-com-spring-boot-kubernetes-e-docker?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/24-tests-java.png "Formação Java Testing 2026")](https://pub.erudio.com.br/formacao-java-testing-2026-testes-automatizados-com-junit-mockito-spring-boot-tdd-e-testcontainers?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/10-docker-to-aws.png "Docker e Kubernetes 2026 — Deploy Profissional")](https://pub.erudio.com.br/docker-e-kubernetes-2026-do-zero-ao-deploy-profissional-na-aws-azure-e-gcp-com-github-actions?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/09-docker.png "Docker e Kubernetes 2026 — IA com MCP")](https://pub.erudio.com.br/formacao-docker-kubernetes-do-zero-a-inteligencia-artificial-com-mcp?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/29-cdpl-java-gcp.png "Formação Continuous Deployment — GCP")](https://pub.erudio.com.br/formacao-continuous-deployment-java-kubernetes-gcp-github-actions?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/27-cicd-java-aws.png "Formação CI/CD — AWS")](https://pub.erudio.com.br/formacao-continuous-integration-delivery-java-aws-github-actions?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/28-cicd-java-azure.png "Formação CI/CD — Azure")](https://pub.erudio.com.br/formacao-continuous-integration-delivery-java-azure-github-actions?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/18-rest-spring-kotlin.png "Formação Spring Boot com Kotlin")](https://pub.erudio.com.br/formacao-spring-boot-com-kotlin-rest-apis-profissionais-do-zero-ao-deploy-na-aws-com-docker-e-kubernetes?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/32-code-ai-kspring.png "Formação Spring AI 2026 — Kotlin")](https://pub.erudio.com.br/formacao-spring-ai-2026-inteligencia-artificial-com-kotlin-spring-boot-chatgpt-deepseek-claude-e-mcp?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/22-ms-kotlin.png "Formação Microsserviços com Kotlin")](https://pub.erudio.com.br/formacao-microsservicos-com-spring-cloud-spring-boot-kotlin-docker-e-zookeeper?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/20-kotlin.png "Kotlin para DEV's Java")](https://pub.erudio.com.br/kotlin-para-desenvolvedores-java-domine-sintaxe-lambdas-generics-reflections-programacao-funcional-e-spring-boot?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/01-rest-asp-net.png "Formação ASP.NET 2026")](https://pub.erudio.com.br/asp-net-2026-do-0-a-azure-e-gcp-com-asp-net-10-docker-e-kubernetes?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/33-dotnet-ai.png "Inteligência Artificial com .NET AI")](https://pub.erudio.com.br/inteligencia-artificial-com-dotnet-ai-e-dotnet-10-apps-inteligentes-com-chatgpt-openai-deepseek-e-ollama?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/15-microservices-asp-net.png "Formação Microsserviços ASP.NET")](https://pub.erudio.com.br/meus-cursos?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/30-jasper.png "Crie Relatórios com JasperReports")](https://pub.erudio.com.br/crie-relatorios-profissionais-com-jasperreports-java-spring-boot-e-jaspersoft-studio?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

[![Image](https://raw.githubusercontent.com/leandrocgsi/blog-images/refs/heads/main/formacoes_github/13-career.png "Carreira em TI")](https://pub.erudio.com.br/carreira-em-ti-do-zero-ao-exterior-curriculo-entrevistas-negociacao-e-crescimento-profissional?utm_source=github&utm_medium=organic&utm_campaign=readme&utm_content=repo)

---

## 🎬 Vídeos de Configuração de Ambiente

### [Como Configurar Ambiente de DEV Spring Boot no Windows: Java, Maven, IntelliJ e MySQL Guia Completo](https://www.youtube.com/watch?v=M-0HxNoUeNE)

[![Como Configurar Ambiente de DEV Spring Boot no Windows: Java, Maven, IntelliJ e MySQL Guia Completo](https://img.youtube.com/vi/M-0HxNoUeNE/maxresdefault.jpg)](https://www.youtube.com/watch?v=M-0HxNoUeNE)

### [Como Configurar Ambiente de DEV Spring Boot no Linux: Java, Maven, IntelliJ e MySQL Guia Completo](https://www.youtube.com/watch?v=Wk5645fHrVU)

[![Como Configurar Ambiente de DEV Spring Boot no Linux: Java, Maven, IntelliJ e MySQL Guia Completo](https://img.youtube.com/vi/Wk5645fHrVU/maxresdefault.jpg)](https://www.youtube.com/watch?v=Wk5645fHrVU)

---

## 📋 Tecnologias Utilizadas

- **Java 25** — Linguagem principal
- **Spring Boot 4.1.0** — Framework web e microserviços
- **Spring Data JPA** — Persistência de dados
- **Hibernate** — ORM (Object-Relational Mapping)
- **MySQL** — Banco de dados relacional
- **Flyway** — Versionamento de schema do banco
- **ModelMapper** — Mapeamento entre entidades e DTOs
- **Jakarta Validation** — Validações de entrada
- **Swagger/OpenAPI** — Documentação automática da API
- **JUnit 5** — Framework de testes
- **Mockito** — Mocking para testes unitários
- **Maven** — Gerenciador de dependências

---

## 💡 Principais Conceitos Cobertos

### Camada de Persistência
- Transformação de POJOs em entidades JPA com `@Entity`
- Configuração de conexão MySQL via `application.yml`
- Mapeamento de relacionamentos `@ManyToOne`

### Camada de Dados
- `JpaRepository` como padrão de acesso a dados
- Query methods com Spring Data (sintaxe declarativa)
- Queries customizadas com `@Query` (JPQL e SQL nativo)

### Camada de Aplicação
- DTOs para separar representação (API) da persistência
- ModelMapper para automação de conversão
- Validações com Jakarta Validation e tratamento centralizado de erros

### Recursos Avançados
- Flyway para migrations versionadas
- Swagger/OpenAPI para documentação automática
- Soft delete com `LocalDateTime deletedAt`
- Auditoria automática com `@CreationTimestamp` e `@UpdateTimestamp`
- Paginação com `Pageable` e `Page<T>`

### Qualidade
- Testes unitários com mocks
- Testes de controller com `@WebMvcTest`
- Regressão de testes para garantir integridade

---

## ✅ Próximos Passos

Após completar este módulo, você estará pronto para:

1. **Módulo 05:** Segurança (Spring Security, JWT, OAuth2)
2. **Módulo 06:** Skills Customizadas e Hooks no Claude Code
3. **Módulo 07:** Agentes com o Claude Agent SDK
4. **Módulo 08:** Workflow Avançado (CI/CD, Deploy na AWS/GCP)

---

## 📞 Suporte e Comunidade

- **Comunidade Erudio:** [pub.erudio.com.br/kr/premium_courses](https://pub.erudio.com.br/kr/premium_courses)
- **YouTube:** [@erudiotraining](https://www.youtube.com/@erudiotraining)
- **LinkedIn:** [@erudiotraining](https://www.linkedin.com/company/erudiotraining)
- **GitHub:** [@leandrocgsi](https://github.com/leandrocgsi)

---

**Feito com ❤️ por [Erudio Training](https://pub.erudio.com.br/kr/premium_courses)**

© 2011-2026 Erudio Training — CNPJ: 34.523.711/0001-62
