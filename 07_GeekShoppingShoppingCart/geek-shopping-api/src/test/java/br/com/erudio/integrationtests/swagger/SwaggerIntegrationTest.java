package br.com.erudio.integrationtests.swagger;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import br.com.erudio.config.TestConfigs;
import br.com.erudio.integrationtests.ApiIntegrationTest;
import br.com.erudio.integrationtests.ProductApi;

class SwaggerIntegrationTest extends ApiIntegrationTest {

    private static Map<String, Object> paths;

    @BeforeAll
    @SuppressWarnings("unchecked")
    static void loadApiDocs() {
        var content = given()
            .port(TestConfigs.SERVER_PORT)
            .basePath("/v3/api-docs")
            .when()
            .get()
            .then()
            .statusCode(200)
            .extract()
            .body()
            .asString();
        var document = ProductApi.MAPPER.readValue(content, Map.class);
        paths = (Map<String, Object>) document.get("paths");
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> operation(String path, String verb) {
        var item = (Map<String, Object>) paths.get(path);
        assertNotNull(item, "path not documented: " + path);
        var operation = (Map<String, Object>) item.get(verb);
        assertNotNull(operation, verb + " not documented on " + path);
        return operation;
    }

    @SuppressWarnings("unchecked")
    private static Set<String> statuses(String path, String verb) {
        return ((Map<String, Object>) operation(path, verb).get("responses")).keySet();
    }

    @Test
    void shouldDisplaySwaggerUIPage() {
        var content = given()
            .basePath("/swagger-ui/index.html")
            .port(TestConfigs.SERVER_PORT)
            .when()
            .get()
            .then()
            .statusCode(200)
            .extract()
            .body()
            .asString();

        assertTrue(content.contains("Swagger UI"));
    }

    @Test
    void onlyTheVersionedApiPathsAreDocumented() {
        assertTrue(paths.keySet().stream().allMatch(path -> path.startsWith("/api/product/v1") || path.startsWith("/api/cart/v1")), paths.keySet().toString());
        assertEquals(
            Set.of("/api/product/v1", "/api/product/v1/{id}", "/api/product/v1/{id}/image", "/api/product/v1/facets",
                "/api/product/v1/featured", "/api/product/v1/recent", "/api/product/v1/categories",
                "/api/cart/v1", "/api/cart/v1/items", "/api/cart/v1/items/{itemId}"),
            paths.keySet());
    }

    @Test
    @SuppressWarnings("unchecked")
    void createIsDocumentedAsMultipartWithCreated() {
        var post = operation("/api/product/v1", "post");

        var requestContent = (Map<String, Object>) ((Map<String, Object>) post.get("requestBody")).get("content");
        assertTrue(requestContent.containsKey("multipart/form-data"), requestContent.keySet().toString());
        assertTrue(statuses("/api/product/v1", "post").containsAll(Set.of("201", "400")), statuses("/api/product/v1", "post").toString());
        assertTrue(!statuses("/api/product/v1", "post").contains("403"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void updateIsDocumentedAsMultipart() {
        var put = operation("/api/product/v1", "put");

        var requestContent = (Map<String, Object>) ((Map<String, Object>) put.get("requestBody")).get("content");
        assertTrue(requestContent.containsKey("multipart/form-data"), requestContent.keySet().toString());
        assertTrue(statuses("/api/product/v1", "put").containsAll(Set.of("200", "400", "404")), statuses("/api/product/v1", "put").toString());
    }

    @Test
    void readDeleteAndImageDocumentTheirRealStatuses() {
        assertTrue(statuses("/api/product/v1/{id}", "get").containsAll(Set.of("200", "404")));
        assertTrue(statuses("/api/product/v1/{id}", "delete").containsAll(Set.of("204", "404")));
        assertTrue(statuses("/api/product/v1/{id}/image", "get").containsAll(Set.of("200", "404")));
        assertTrue(statuses("/api/product/v1", "get").containsAll(Set.of("200", "400")));
    }

    @Test
    @SuppressWarnings("unchecked")
    void imageEndpointDeclaresTheImageMediaTypes() {
        var responses = (Map<String, Object>) operation("/api/product/v1/{id}/image", "get").get("responses");
        var ok = (Map<String, Object>) responses.get("200");
        var content = (Map<String, Object>) ok.get("content");

        assertTrue(content.keySet().containsAll(Set.of("image/jpeg", "image/png", "image/webp", "image/gif")), content.keySet().toString());
    }

    @Test
    void shortcutsFacetsAndCategoriesAreDocumented() {
        assertTrue(statuses("/api/product/v1/featured", "get").contains("200"));
        assertTrue(statuses("/api/product/v1/recent", "get").contains("200"));
        assertTrue(statuses("/api/product/v1/facets", "get").contains("200"));
        assertTrue(statuses("/api/product/v1/categories", "get").contains("200"));
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> parameters(String path, String verb) {
        return (List<Map<String, Object>>) operation(path, verb).get("parameters");
    }

    @Test
    void everyCartOperationIsDocumentedWithItsRealStatuses() {
        assertTrue(statuses("/api/cart/v1", "get").containsAll(Set.of("200", "400")), statuses("/api/cart/v1", "get").toString());
        assertTrue(statuses("/api/cart/v1", "delete").containsAll(Set.of("204", "400")), statuses("/api/cart/v1", "delete").toString());
        assertTrue(statuses("/api/cart/v1/items", "post").containsAll(Set.of("200", "400", "404")), statuses("/api/cart/v1/items", "post").toString());
        assertTrue(statuses("/api/cart/v1/items/{itemId}", "put").containsAll(Set.of("200", "400", "404")), statuses("/api/cart/v1/items/{itemId}", "put").toString());
        assertTrue(statuses("/api/cart/v1/items/{itemId}", "delete").containsAll(Set.of("204", "400", "404")), statuses("/api/cart/v1/items/{itemId}", "delete").toString());
    }

    @Test
    void theCartDoesNotDocumentAForbiddenResponse() {
        assertFalse(statuses("/api/cart/v1", "get").contains("403"));
        assertFalse(statuses("/api/cart/v1/items", "post").contains("403"));
    }

    @Test
    void everyCartOperationDeclaresTheRequiredTokenHeader() {
        var operations = List.of(
            Map.entry("/api/cart/v1", "get"),
            Map.entry("/api/cart/v1", "delete"),
            Map.entry("/api/cart/v1/items", "post"),
            Map.entry("/api/cart/v1/items/{itemId}", "put"),
            Map.entry("/api/cart/v1/items/{itemId}", "delete"));

        for (var entry : operations) {
            var header = parameters(entry.getKey(), entry.getValue()).stream()
                .filter(parameter -> "X-Cart-Token".equals(parameter.get("name")))
                .findFirst();
            assertTrue(header.isPresent(), entry + " does not declare X-Cart-Token");
            assertEquals("header", header.get().get("in"), entry.toString());
            assertEquals(true, header.get().get("required"), entry.toString());
        }
    }

    @Test
    @SuppressWarnings("unchecked")
    void theCartBodiesAreJsonAndTheItemIdIsAPathParameter() {
        var post = operation("/api/cart/v1/items", "post");
        var postContent = (Map<String, Object>) ((Map<String, Object>) post.get("requestBody")).get("content");
        var put = operation("/api/cart/v1/items/{itemId}", "put");
        var putContent = (Map<String, Object>) ((Map<String, Object>) put.get("requestBody")).get("content");

        assertEquals(Set.of("application/json"), postContent.keySet());
        assertEquals(Set.of("application/json"), putContent.keySet());
        assertTrue(parameters("/api/cart/v1/items/{itemId}", "put").stream()
            .anyMatch(parameter -> "itemId".equals(parameter.get("name")) && "path".equals(parameter.get("in"))));
    }
}
