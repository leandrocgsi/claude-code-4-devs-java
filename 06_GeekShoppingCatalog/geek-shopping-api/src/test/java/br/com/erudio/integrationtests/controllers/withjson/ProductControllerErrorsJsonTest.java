package br.com.erudio.integrationtests.controllers.withjson;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import br.com.erudio.integrationtests.ApiIntegrationTest;
import br.com.erudio.integrationtests.ProductApi;
import br.com.erudio.integrationtests.TestImages;
import br.com.erudio.integrationtests.dto.ProductDTO;
import io.restassured.response.Response;

class ProductControllerErrorsJsonTest extends ApiIntegrationTest {

    private static final String CATEGORY = "Errors " + UUID.randomUUID();
    private static final List<Long> created = new ArrayList<>();

    @AfterAll
    static void cleanUp() {
        created.forEach(ProductApi::delete);
    }

    private static ProductDTO createProduct(String name, byte[] image, String imageType) {
        var product = ProductApi.createOk(ProductApi.product(name, CATEGORY, "30.00"), image, imageType);
        created.add(product.getId());
        return product;
    }

    private static Map<String, String> errorsOf(Response response) {
        return response.jsonPath().getMap("errors");
    }

    private static void assertValidationProblem(Response response) {
        assertEquals(400, response.statusCode(), response.asString());
        assertTrue(response.contentType().contains("application/problem+json"), response.contentType());
        assertEquals("about:blank", response.jsonPath().getString("type"));
        assertEquals(400, response.jsonPath().getInt("status"));
        assertEquals("Validation failed", response.jsonPath().getString("detail"));
        assertNotNull(response.jsonPath().getMap("errors"));
    }

    @Test
    void invalidFieldsAnswerBadRequestWithTheErrorsByField() {
        var body = ProductApi.product("", CATEGORY, "0");
        body.put("quantity", -1);

        var response = ProductApi.create(body, null, null);

        assertValidationProblem(response);
        var errors = errorsOf(response);
        assertTrue(errors.containsKey("name"), errors.toString());
        assertTrue(errors.containsKey("price"), errors.toString());
        assertTrue(errors.containsKey("quantity"), errors.toString());
    }

    @Test
    void oldPriceEqualToThePriceIsRejected() {
        var body = ProductApi.product("Old Equal", CATEGORY, "20.00");
        body.put("oldPrice", new BigDecimal("20.00"));

        var response = ProductApi.create(body, null, null);

        assertValidationProblem(response);
        assertEquals(Set.of("oldPrice"), errorsOf(response).keySet());
    }

    @Test
    void oldPriceLowerThanThePriceIsRejected() {
        var body = ProductApi.product("Old Lower", CATEGORY, "20.00");
        body.put("oldPrice", new BigDecimal("10.00"));

        var response = ProductApi.create(body, null, null);

        assertValidationProblem(response);
        assertEquals(Set.of("oldPrice"), errorsOf(response).keySet());
    }

    @Test
    void nameLongerThan150CharactersIsRejected() {
        var response = ProductApi.create(ProductApi.product("a".repeat(151), CATEGORY, "20.00"), null, null);

        assertValidationProblem(response);
        assertEquals(Set.of("name"), errorsOf(response).keySet());
    }

    @Test
    void descriptionLongerThan255CharactersIsRejected() {
        var body = ProductApi.product("Long Description", CATEGORY, "20.00");
        body.put("description", "d".repeat(256));

        var response = ProductApi.create(body, null, null);

        assertValidationProblem(response);
        assertEquals(Set.of("description"), errorsOf(response).keySet());
    }

    @Test
    void priceWithThreeDecimalPlacesIsRejected() {
        var response = ProductApi.create(ProductApi.product("Three Decimals", CATEGORY, "10.001"), null, null);

        assertValidationProblem(response);
        assertEquals(Set.of("price"), errorsOf(response).keySet());
    }

    @Test
    void missingCategoryAndNegativeQuantityAreReportedTogether() {
        var body = ProductApi.product("No Category", "", "10.00");
        body.put("quantity", -5);

        var response = ProductApi.create(body, null, null);

        assertValidationProblem(response);
        assertEquals(Set.of("category", "quantity"), errorsOf(response).keySet());
    }

    @Test
    void missingProductPartIsABadRequestNotAServerError() {
        var response = ProductApi.base()
            .multiPart("image", "photo", TestImages.jpeg(100), "image/jpeg")
            .when()
            .post();

        assertEquals(400, response.statusCode(), response.asString());
    }

    @Test
    void productPartSentAsPlainTextIsUnsupportedMediaType() {
        var response = ProductApi.createWithProductPart("{\"name\":\"x\"}", "text/plain");

        assertEquals(415, response.statusCode(), response.asString());
    }

    @Test
    void malformedJsonInTheProductPartIsABadRequest() {
        var response = ProductApi.createWithProductPart("{not json", "application/json");

        assertEquals(400, response.statusCode(), response.asString());
    }

    @ParameterizedTest
    @CsvSource({"pdf,application/pdf", "text,text/plain"})
    void unsupportedImageTypeIsRejectedByContent(String kind, String declaredType) {
        var content = kind.equals("pdf") ? TestImages.pdf(512) : TestImages.text(512);

        var response = ProductApi.create(ProductApi.product("Bad Image " + kind, CATEGORY, "10.00"), content, declaredType);

        assertValidationProblem(response);
        assertEquals(Set.of("image"), errorsOf(response).keySet());
        assertTrue(errorsOf(response).get("image").contains("Unsupported image type"), errorsOf(response).toString());
    }

    @Test
    void imageDeclaredAsJpegButWithPdfContentIsRejected() {
        var response = ProductApi.create(ProductApi.product("Disguised", CATEGORY, "10.00"), TestImages.pdf(512), "image/jpeg");

        assertValidationProblem(response);
        assertEquals(Set.of("image"), errorsOf(response).keySet());
    }

    @Test
    void imageOverFiveMegabytesIsRejected() {
        var response = ProductApi.create(
            ProductApi.product("Too Big", CATEGORY, "10.00"), TestImages.jpeg(TestImages.MAX_IMAGE_BYTES + 1), "image/jpeg");

        assertValidationProblem(response);
        assertEquals(Set.of("image"), errorsOf(response).keySet());
        assertTrue(errorsOf(response).get("image").contains("5 MB"), errorsOf(response).toString());
    }

    @ParameterizedTest
    @ValueSource(strings = {"jpeg", "png", "gif", "webp"})
    void everyAcceptedImageTypeIsStoredWithItsContentType(String kind) {
        var bytes = switch (kind) {
            case "jpeg" -> TestImages.jpeg(300);
            case "png" -> TestImages.png(300);
            case "gif" -> TestImages.gif(300);
            default -> TestImages.webp(300);
        };
        var product = createProduct("Accepted " + kind, bytes, "image/" + kind);

        var image = ProductApi.base().when().get("/{id}/image", product.getId()).then().statusCode(200).extract().response();

        assertTrue(image.contentType().startsWith("image/" + kind), image.contentType());
        assertArrayEquals(bytes, image.asByteArray());
    }

    @Test
    void imageOfExactlyFiveMegabytesIsAccepted() {
        var product = createProduct("Five MB", TestImages.jpeg(TestImages.MAX_IMAGE_BYTES), "image/jpeg");

        var image = ProductApi.base().when().get("/{id}/image", product.getId()).then().statusCode(200).extract().response();

        assertEquals(TestImages.MAX_IMAGE_BYTES, image.asByteArray().length);
    }

    @Test
    void rejectedImageOnUpdateKeepsTheStoredImage() {
        var jpeg = TestImages.jpeg(400);
        var product = createProduct("Keeps Image", jpeg, "image/jpeg");
        var body = ProductApi.product("Keeps Image", CATEGORY, "30.00");
        body.put("id", product.getId());

        var response = ProductApi.update(body, TestImages.pdf(400), "application/pdf");

        assertValidationProblem(response);
        var image = ProductApi.base().when().get("/{id}/image", product.getId()).then().statusCode(200).extract().response();
        assertArrayEquals(jpeg, image.asByteArray());
    }

    @Test
    void updateOfAnUnknownIdIsNotFound() {
        var body = ProductApi.product("Ghost", CATEGORY, "10.00");
        body.put("id", 999_999_999L);

        var response = ProductApi.update(body, null, null);

        assertEquals(404, response.statusCode(), response.asString());
        assertNotNull(response.jsonPath().getString("message"));
    }

    @Test
    void updateWithoutIdIsABadRequest() {
        var response = ProductApi.update(ProductApi.product("No Id", CATEGORY, "10.00"), null, null);

        assertEquals(400, response.statusCode(), response.asString());
        assertNotNull(response.jsonPath().getString("message"));
    }

    @Test
    void updateWithInvalidFieldsAnswersTheErrorsByField() {
        var product = createProduct("Update Invalid", null, null);
        var body = ProductApi.product("", CATEGORY, "-1");
        body.put("id", product.getId());

        var response = ProductApi.update(body, null, null);

        assertValidationProblem(response);
        assertTrue(errorsOf(response).containsKey("name"));
        assertTrue(errorsOf(response).containsKey("price"));
    }

    @Test
    void deleteOfAnUnknownIdIsNotFound() {
        var response = ProductApi.base().when().delete("/{id}", 999_999_999L);

        assertEquals(404, response.statusCode(), response.asString());
        assertNotNull(response.jsonPath().getString("message"));
    }

    @Test
    void findByIdOfAnUnknownIdIsNotFound() {
        var response = ProductApi.get(999_999_999L);

        assertEquals(404, response.statusCode(), response.asString());
        assertNotNull(response.jsonPath().getString("message"));
        assertNotNull(response.jsonPath().getString("details"));
    }

    @Test
    void findByIdWithANonNumericIdIsABadRequestNotAServerError() {
        var response = ProductApi.base().when().get("/{id}", "abc");

        assertEquals(400, response.statusCode(), response.asString());
    }

    @Test
    void imageOfAnUnknownProductIsNotFound() {
        ProductApi.base().when().get("/{id}/image", 999_999_999L).then().statusCode(404);
    }

    @Test
    void imageOfAProductWithoutImageIsNotFound() {
        var product = createProduct("No Image", null, null);
        assertNull(product.getImageUrl());

        ProductApi.base().when().get("/{id}/image", product.getId()).then().statusCode(404);
    }

    @ParameterizedTest
    @CsvSource({"sortBy,price;name", "sortBy,color", "sortBy,id", "direction,up", "direction,sideways"})
    void invalidSortOrDirectionIsABadRequest(String parameter, String value) {
        var response = ProductApi.base()
            .queryParam(parameter, value)
            .when()
            .get();

        assertEquals(400, response.statusCode(), response.asString());
        assertNotNull(response.jsonPath().getString("message"));
    }

    @Test
    void minPriceGreaterThanMaxPriceIsABadRequest() {
        var response = ProductApi.base().queryParams("minPrice", "100", "maxPrice", "10").when().get();

        assertEquals(400, response.statusCode(), response.asString());
        assertEquals("minPrice must not be greater than maxPrice", response.jsonPath().getString("message"));
    }

    @Test
    void minPriceGreaterThanMaxPriceIsAlsoABadRequestOnFacets() {
        var response = ProductApi.base().queryParams("minPrice", "100", "maxPrice", "10").when().get("/facets");

        assertEquals(400, response.statusCode(), response.asString());
    }

    @ParameterizedTest
    @CsvSource({"size,101", "size,0", "size,-1", "page,-1"})
    void pageAndSizeOutOfBoundsAreABadRequestWithTheField(String parameter, String value) {
        var response = ProductApi.base().queryParam(parameter, value).when().get();

        assertValidationProblem(response);
        assertTrue(errorsOf(response).containsKey(parameter), errorsOf(response).toString());
    }

    @ParameterizedTest
    @CsvSource({"/featured,size,101", "/featured,page,-1", "/recent,size,101", "/recent,page,-1"})
    void shortcutsValidatePageAndSizeToo(String path, String parameter, String value) {
        var response = ProductApi.base().queryParam(parameter, value).when().get(path);

        assertValidationProblem(response);
        assertTrue(errorsOf(response).containsKey(parameter), errorsOf(response).toString());
    }

    @Test
    void nonNumericPriceFilterIsABadRequestNotAServerError() {
        var response = ProductApi.base().queryParam("minPrice", "cheap").when().get();

        assertEquals(400, response.statusCode(), response.asString());
    }

    @Test
    void sizeOfExactlyOneHundredIsAccepted() {
        ProductApi.base().queryParam("size", 100).when().get().then().statusCode(200);
    }

    @Test
    void largestAcceptedPriceIsStored() {
        var product = ProductApi.createOk(ProductApi.product("Max Price", CATEGORY, "999999999.99"), null, null);
        created.add(product.getId());

        assertEquals(0, new BigDecimal("999999999.99").compareTo(product.getPrice()));
    }

    @Test
    void priceAboveTheCeilingIsRejected() {
        var response = ProductApi.create(ProductApi.product("Over Price", CATEGORY, "1000000000.00"), null, null);

        assertValidationProblem(response);
        assertEquals(Set.of("price"), errorsOf(response).keySet());
    }
}
