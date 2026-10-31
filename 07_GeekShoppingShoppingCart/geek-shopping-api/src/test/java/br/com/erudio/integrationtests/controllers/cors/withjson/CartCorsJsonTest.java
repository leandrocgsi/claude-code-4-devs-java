package br.com.erudio.integrationtests.controllers.cors.withjson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import br.com.erudio.config.TestConfigs;
import br.com.erudio.integrationtests.ApiIntegrationTest;
import br.com.erudio.integrationtests.CartApi;
import br.com.erudio.integrationtests.ProductApi;

class CartCorsJsonTest extends ApiIntegrationTest {

    @Test
    void theFrontCanReadTheCartSendingTheTokenHeader() {
        var response = CartApi.base(CartApi.newToken())
            .header(TestConfigs.HEADER_PARAM_ORIGIN, TestConfigs.ORIGIN_FRONT)
            .when()
            .get();

        assertEquals(200, response.statusCode(), response.asString());
        assertEquals(TestConfigs.ORIGIN_FRONT, response.header("Access-Control-Allow-Origin"));
        assertEquals("true", response.header("Access-Control-Allow-Credentials"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"GET", "POST", "PUT", "DELETE"})
    void thePreflightOfEveryCartMethodWithTheTokenHeaderIsAnswered(String method) {
        var response = CartApi.withoutToken()
            .header(TestConfigs.HEADER_PARAM_ORIGIN, TestConfigs.ORIGIN_FRONT)
            .header("Access-Control-Request-Method", method)
            .header("Access-Control-Request-Headers", "content-type,x-cart-token")
            .when()
            .options("/items");

        assertEquals(200, response.statusCode(), response.asString());
        assertEquals(TestConfigs.ORIGIN_FRONT, response.header("Access-Control-Allow-Origin"));
        assertTrue(response.header("Access-Control-Allow-Methods").contains(method), response.header("Access-Control-Allow-Methods"));
        assertTrue(response.header("Access-Control-Allow-Headers").toLowerCase().contains("x-cart-token"), response.header("Access-Control-Allow-Headers"));
    }

    @Test
    void theFrontCanWriteToTheCartAcrossOrigins() {
        var token = CartApi.newToken();
        var product = CartApi.product("Cart Cors Mug", 5, "10.00", null, null);

        try {
            var response = CartApi.base(token)
                .header(TestConfigs.HEADER_PARAM_ORIGIN, TestConfigs.ORIGIN_FRONT)
                .contentType("application/json")
                .body(CartApi.item(product.getId(), 1))
                .when()
                .post("/items");

            assertEquals(200, response.statusCode(), response.asString());
            assertEquals(TestConfigs.ORIGIN_FRONT, response.header("Access-Control-Allow-Origin"));
        } finally {
            ProductApi.delete(product.getId());
        }
    }

    @Test
    void anOriginOutsideTheListIsForbiddenOnTheCartToo() {
        var response = CartApi.base(CartApi.newToken())
            .header(TestConfigs.HEADER_PARAM_ORIGIN, TestConfigs.ORIGIN_NOT_ALLOWED)
            .when()
            .get();

        assertEquals(403, response.statusCode());
        assertEquals("Invalid CORS request", response.asString());
        assertNull(response.header("Access-Control-Allow-Origin"));
    }

    @Test
    void thePreflightFromAForbiddenOriginIsRejected() {
        CartApi.withoutToken()
            .header(TestConfigs.HEADER_PARAM_ORIGIN, TestConfigs.ORIGIN_NOT_ALLOWED)
            .header("Access-Control-Request-Method", "POST")
            .header("Access-Control-Request-Headers", "x-cart-token")
            .when()
            .options("/items")
            .then()
            .statusCode(403);
    }

    @Test
    void aRequestWithoutOriginIsNotAffected() {
        CartApi.base(CartApi.newToken()).when().get().then().statusCode(200);
    }
}
