package br.com.erudio.integrationtests;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import br.com.erudio.config.TestConfigs;
import br.com.erudio.integrationtests.dto.CartDTO;
import br.com.erudio.integrationtests.dto.ProductDTO;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;

public final class CartApi {

    public static final String PATH = "/api/cart/v1";
    public static final String TOKEN_HEADER = "X-Cart-Token";
    public static final String CATEGORY = "Cart Tests";

    private CartApi() {}

    public static String newToken() {
        return UUID.randomUUID().toString();
    }

    public static RequestSpecification base(String token) {
        return withoutToken().header(TOKEN_HEADER, token);
    }

    public static RequestSpecification withoutToken() {
        return RestAssured.given()
            .port(TestConfigs.SERVER_PORT)
            .basePath(PATH);
    }

    public static Response get(String token) {
        return base(token).when().get();
    }

    public static Response clear(String token) {
        return base(token).when().delete();
    }

    public static Response addItem(String token, Map<String, Object> item) {
        return base(token)
            .contentType(ContentType.JSON)
            .body(item)
            .when()
            .post("/items");
    }

    public static Response updateItem(String token, Object itemId, Integer quantity) {
        return base(token)
            .contentType(ContentType.JSON)
            .body(Map.of("quantity", quantity))
            .when()
            .put("/items/{itemId}", itemId);
    }

    public static Response removeItem(String token, Object itemId) {
        return base(token).when().delete("/items/{itemId}", itemId);
    }

    public static Map<String, Object> item(Long productId, Integer quantity) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("productId", productId);
        item.put("quantity", quantity);
        return item;
    }

    public static CartDTO addOk(String token, Long productId, Integer quantity) {
        var response = addItem(token, item(productId, quantity));
        assertEquals(200, response.statusCode(), response.asString());
        return read(response);
    }

    public static CartDTO read(Response response) {
        assertEquals(200, response.statusCode(), response.asString());
        return ProductApi.MAPPER.readValue(response.asString(), CartDTO.class);
    }

    public static ProductDTO product(String name, int quantity, String price, String color, String size) {
        var body = ProductApi.product(name, CATEGORY, price);
        body.put("quantity", quantity);
        if (color != null) body.put("color", color);
        if (size != null) body.put("size", size);
        return ProductApi.createOk(body, null, null);
    }

    public static void assertMoney(String expected, BigDecimal actual) {
        assertNotNull(actual);
        assertEquals(0, new BigDecimal(expected).compareTo(actual), expected + " != " + actual);
    }

    public static void assertValidationProblem(Response response, String field) {
        assertEquals(400, response.statusCode(), response.asString());
        assertTrue(response.contentType().contains("application/problem+json"), response.contentType());
        assertEquals("about:blank", response.jsonPath().getString("type"));
        assertEquals(400, response.jsonPath().getInt("status"));
        assertEquals("Validation failed", response.jsonPath().getString("detail"));
        Map<String, String> errors = response.jsonPath().getMap("errors");
        assertNotNull(errors, response.asString());
        assertTrue(errors.containsKey(field), errors.toString());
    }
}
