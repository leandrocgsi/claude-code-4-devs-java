package br.com.erudio.integrationtests.controllers.withjson;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import br.com.erudio.integrationtests.ApiIntegrationTest;
import br.com.erudio.integrationtests.ProductApi;
import br.com.erudio.integrationtests.TestImages;
import br.com.erudio.integrationtests.dto.ProductDTO;
import br.com.erudio.integrationtests.dto.wrappers.json.WrapperProductDTO;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ProductControllerJsonTest extends ApiIntegrationTest {

    private static final String CATEGORY = "Flow " + UUID.randomUUID();

    private static ProductDTO product;
    private static byte[] jpeg;
    private static byte[] png;

    @BeforeAll
    static void setUp() {
        jpeg = TestImages.jpeg(2048);
        png = TestImages.png(1024);
    }

    @AfterAll
    static void cleanUp() {
        if (product != null && product.getId() != null) ProductApi.delete(product.getId());
    }

    private static void assertSameInstantToTheMicrosecond(LocalDateTime expected, LocalDateTime actual) {
        assertTrue(Duration.between(expected, actual).abs().toNanos() <= 1000, expected + " vs " + actual);
    }

    @Test
    @Order(1)
    void createWithImageTest() {
        var body = ProductApi.product("Flow Mug", CATEGORY, "49.90");
        body.put("oldPrice", new BigDecimal("59.90"));
        body.put("color", "Black");
        body.put("size", "M");
        body.put("featured", true);
        body.put("createdAt", "2001-01-01T00:00:00");
        body.put("popularity", 999);
        body.put("rating", new BigDecimal("5.00"));
        body.put("reviewCount", 77);

        var response = ProductApi.create(body, jpeg, "image/jpeg");

        assertEquals(201, response.statusCode(), response.asString());
        var created = ProductApi.read(response);
        product = created;

        assertNotNull(created.getId());
        assertTrue(created.getId() > 0);
        var location = response.header("Location");
        assertNotNull(location);
        assertTrue(location.endsWith(ProductApi.PATH + "/" + created.getId()), location);
        assertEquals("Flow Mug", created.getName());
        assertEquals("Description of Flow Mug", created.getDescription());
        assertEquals(0, new BigDecimal("49.90").compareTo(created.getPrice()));
        assertEquals(0, new BigDecimal("59.90").compareTo(created.getOldPrice()));
        assertEquals(CATEGORY, created.getCategory());
        assertEquals(5, created.getQuantity());
        assertEquals("Black", created.getColor());
        assertEquals("M", created.getSize());
        assertTrue(created.getFeatured());
        assertNotNull(created.getImageUrl());
        assertTrue(created.getImageUrl().endsWith(ProductApi.PATH + "/" + created.getId() + "/image"), created.getImageUrl());
    }

    @Test
    @Order(2)
    void serverFieldsSentInTheBodyAreIgnoredTest() {
        assertNotNull(product.getCreatedAt());
        assertTrue(product.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(10)));
        assertEquals(0, product.getPopularity());
        assertNull(product.getRating());
        assertEquals(0, product.getReviewCount());
    }

    @Test
    @Order(3)
    void findByIdTest() {
        var response = ProductApi.get(product.getId());

        assertEquals(200, response.statusCode(), response.asString());
        var found = ProductApi.read(response);

        assertSameInstantToTheMicrosecond(product.getCreatedAt(), found.getCreatedAt());
        product.setCreatedAt(found.getCreatedAt());
        assertEquals(product, found);
        assertTrue(response.contentType().startsWith("application/json"), response.contentType());
    }

    @Test
    @Order(4)
    void findByIdCarriesTheHateoasLinksTest() {
        var links = ProductApi.get(product.getId()).jsonPath().getMap("_links");

        for (var rel : new String[] {"self", "findAll", "create", "update", "delete", "image"}) {
            assertTrue(links.containsKey(rel), "missing link " + rel);
            var link = (Map<?, ?>) links.get(rel);
            assertNotNull(link.get("href"), rel + " has no href");
            assertNotNull(link.get("type"), rel + " has no type");
            assertTrue(link.get("href").toString().matches("https?://.+/api/product/v1.*"), link.get("href").toString());
        }
        assertEquals("GET", ((Map<?, ?>) links.get("self")).get("type"));
        assertEquals("POST", ((Map<?, ?>) links.get("create")).get("type"));
        assertEquals("PUT", ((Map<?, ?>) links.get("update")).get("type"));
        assertEquals("DELETE", ((Map<?, ?>) links.get("delete")).get("type"));
    }

    @Test
    @Order(5)
    void imageIsServedWithTheStoredContentTypeTest() {
        var response = ProductApi.base()
            .when()
            .get("/{id}/image", product.getId())
            .then()
            .statusCode(200)
            .extract()
            .response();

        assertEquals("image/jpeg", response.contentType());
        assertArrayEquals(jpeg, response.asByteArray());
        assertNotNull(response.header("ETag"));
        assertTrue(response.header("Cache-Control").contains("public"), response.header("Cache-Control"));
        assertTrue(response.header("Cache-Control").contains("no-cache"), response.header("Cache-Control"));
    }

    @Test
    @Order(6)
    void imageAnswersNotModifiedForTheSameETagTest() {
        var etag = ProductApi.base().when().get("/{id}/image", product.getId()).header("ETag");

        ProductApi.base()
            .header("If-None-Match", etag)
            .when()
            .get("/{id}/image", product.getId())
            .then()
            .statusCode(304);
    }

    @Test
    @Order(7)
    void updateWithoutImageKeepsTheCurrentImageTest() {
        var body = ProductApi.product("Flow Mug Updated", CATEGORY, "44.90");
        body.put("id", product.getId());
        body.put("quantity", 9);
        body.put("featured", false);

        var response = ProductApi.update(body, null, null);

        assertEquals(200, response.statusCode(), response.asString());
        var updated = ProductApi.read(response);
        assertEquals("Flow Mug Updated", updated.getName());
        assertEquals(0, new BigDecimal("44.90").compareTo(updated.getPrice()));
        assertEquals(9, updated.getQuantity());
        assertFalse(updated.getFeatured());
        assertNull(updated.getOldPrice());
        assertNull(updated.getColor());
        assertSameInstantToTheMicrosecond(product.getCreatedAt(), updated.getCreatedAt());
        assertEquals(product.getImageUrl(), updated.getImageUrl());
        product = updated;

        var image = ProductApi.base().when().get("/{id}/image", product.getId()).then().statusCode(200).extract().response();
        assertEquals("image/jpeg", image.contentType());
        assertArrayEquals(jpeg, image.asByteArray());
    }

    @Test
    @Order(8)
    void updateWithImageReplacesTheImageTest() {
        var body = ProductApi.product("Flow Mug Updated", CATEGORY, "44.90");
        body.put("id", product.getId());

        var response = ProductApi.update(body, png, "image/png");

        assertEquals(200, response.statusCode(), response.asString());
        var image = ProductApi.base().when().get("/{id}/image", product.getId()).then().statusCode(200).extract().response();
        assertEquals("image/png", image.contentType());
        assertArrayEquals(png, image.asByteArray());
    }

    @Test
    @Order(9)
    void findAllListsTheProductTest() {
        var content = ProductApi.base()
            .queryParams("category", CATEGORY, "page", 0, "size", 12, "direction", "asc")
            .when()
            .get()
            .then()
            .statusCode(200)
            .extract()
            .body()
            .asString();

        var products = objectMapper.readValue(content, WrapperProductDTO.class).getEmbedded().getProducts();

        assertEquals(1, products.size());
        assertEquals(product.getId(), products.get(0).getId());
        assertEquals("Flow Mug Updated", products.get(0).getName());
    }

    @Test
    @Order(10)
    void deleteTest() {
        ProductApi.base()
            .when()
            .delete("/{id}", product.getId())
            .then()
            .statusCode(204);
    }

    @Test
    @Order(11)
    void afterDeleteTheProductAndItsImageAreGoneTest() {
        var response = ProductApi.get(product.getId());

        assertEquals(404, response.statusCode());
        assertNotNull(response.jsonPath().getString("message"));
        assertNotNull(response.jsonPath().getString("timestamp"));

        ProductApi.base()
            .when()
            .get("/{id}/image", product.getId())
            .then()
            .statusCode(404);
    }

    @Test
    @Order(12)
    void createWithoutImageTest() {
        var created = ProductApi.createOk(ProductApi.product("Flow Plain", CATEGORY, "10.00"), null, null);
        product = created;

        assertNull(created.getImageUrl());
        ProductApi.base()
            .when()
            .get("/{id}/image", created.getId())
            .then()
            .statusCode(404);
    }
}
