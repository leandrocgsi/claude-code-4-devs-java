package br.com.erudio.integrationtests.controllers.cors.withjson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import br.com.erudio.config.TestConfigs;
import br.com.erudio.integrationtests.ApiIntegrationTest;
import br.com.erudio.integrationtests.ProductApi;
import br.com.erudio.integrationtests.TestImages;

class CorsJsonTest extends ApiIntegrationTest {

    @Test
    void frontOriginIsAllowed() {
        var response = ProductApi.base()
            .header(TestConfigs.HEADER_PARAM_ORIGIN, TestConfigs.ORIGIN_FRONT)
            .when()
            .get();

        assertEquals(200, response.statusCode());
        assertEquals(TestConfigs.ORIGIN_FRONT, response.header("Access-Control-Allow-Origin"));
        assertEquals("true", response.header("Access-Control-Allow-Credentials"));
    }

    @Test
    void localOriginIsAllowed() {
        ProductApi.base()
            .header(TestConfigs.HEADER_PARAM_ORIGIN, TestConfigs.ORIGIN_LOCAL)
            .when()
            .get()
            .then()
            .statusCode(200);
    }

    @Test
    void originOutsideTheListIsForbidden() {
        var response = ProductApi.base()
            .header(TestConfigs.HEADER_PARAM_ORIGIN, TestConfigs.ORIGIN_NOT_ALLOWED)
            .when()
            .get();

        assertEquals(403, response.statusCode());
        assertEquals("Invalid CORS request", response.asString());
        assertNull(response.header("Access-Control-Allow-Origin"));
    }

    @Test
    void requestWithoutOriginIsNotAffected() {
        ProductApi.base().when().get().then().statusCode(200);
    }

    @Test
    void preflightOfAMultipartPostFromTheFrontIsAnswered() {
        var response = ProductApi.base()
            .header(TestConfigs.HEADER_PARAM_ORIGIN, TestConfigs.ORIGIN_FRONT)
            .header("Access-Control-Request-Method", "POST")
            .header("Access-Control-Request-Headers", "content-type,x-cart-token")
            .when()
            .options();

        assertEquals(200, response.statusCode());
        assertEquals(TestConfigs.ORIGIN_FRONT, response.header("Access-Control-Allow-Origin"));
        assertTrue(response.header("Access-Control-Allow-Methods").contains("POST"), response.header("Access-Control-Allow-Methods"));
        assertTrue(response.header("Access-Control-Allow-Headers").toLowerCase().contains("x-cart-token"), response.header("Access-Control-Allow-Headers"));
    }

    @Test
    void preflightFromAForbiddenOriginIsRejected() {
        ProductApi.base()
            .header(TestConfigs.HEADER_PARAM_ORIGIN, TestConfigs.ORIGIN_NOT_ALLOWED)
            .header("Access-Control-Request-Method", "POST")
            .when()
            .options()
            .then()
            .statusCode(403);
    }

    @Test
    void locationHeaderOfTheCreationIsExposedToTheBrowser() {
        var response = ProductApi.base()
            .header(TestConfigs.HEADER_PARAM_ORIGIN, TestConfigs.ORIGIN_FRONT)
            .multiPart("product", "{\"name\":\"Cors Mug\",\"description\":\"d\",\"price\":10.00,\"category\":\"Cors\",\"quantity\":1}", "application/json")
            .multiPart("image", "photo", TestImages.jpeg(100), "image/jpeg")
            .when()
            .post();

        assertEquals(201, response.statusCode(), response.asString());
        var exposed = response.header("Access-Control-Expose-Headers");
        var id = ProductApi.read(response).getId();
        try {
            assertTrue(exposed != null && exposed.contains("Location"), String.valueOf(exposed));
            assertTrue(response.header("Location").endsWith(ProductApi.PATH + "/" + id));
        } finally {
            ProductApi.delete(id);
        }
    }

    @Test
    void deleteFromTheFrontOriginIsAllowed() {
        var product = ProductApi.createOk(ProductApi.product("Cors Delete", "Cors " + UUID.randomUUID(), "10.00"), null, null);

        try {
            ProductApi.base()
                .header(TestConfigs.HEADER_PARAM_ORIGIN, TestConfigs.ORIGIN_FRONT)
                .when()
                .delete("/{id}", product.getId())
                .then()
                .statusCode(204);
        } finally {
            ProductApi.delete(product.getId());
        }
    }
}
