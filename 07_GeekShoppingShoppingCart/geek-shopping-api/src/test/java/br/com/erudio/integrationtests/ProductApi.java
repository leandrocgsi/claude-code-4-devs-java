package br.com.erudio.integrationtests;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import br.com.erudio.config.TestConfigs;
import br.com.erudio.integrationtests.dto.ProductDTO;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

public final class ProductApi {

    public static final String PATH = "/api/product/v1";

    public static final JsonMapper MAPPER = JsonMapper.builder()
        .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
        .build();

    private ProductApi() {}

    public static Map<String, Object> product(String name, String category, String price) {
        Map<String, Object> product = new LinkedHashMap<>();
        product.put("name", name);
        product.put("description", "Description of " + name);
        product.put("price", new BigDecimal(price));
        product.put("category", category);
        product.put("quantity", 5);
        return product;
    }

    public static Response create(Map<String, Object> product, byte[] image, String imageType) {
        return multipart(product, image, imageType).post();
    }

    public static Response update(Map<String, Object> product, byte[] image, String imageType) {
        return multipart(product, image, imageType).put();
    }

    public static Response createWithProductPart(String json, String productType) {
        return base()
            .multiPart("product", json, productType)
            .when()
            .post();
    }

    public static ProductDTO createOk(Map<String, Object> product, byte[] image, String imageType) {
        var response = create(product, image, imageType);
        assertEquals(201, response.statusCode(), response.asString());
        return read(response);
    }

    public static ProductDTO read(Response response) {
        assertTrue(response.statusCode() == 200 || response.statusCode() == 201, response.statusCode() + " " + response.asString());
        return MAPPER.readValue(response.asString(), ProductDTO.class);
    }

    public static Response get(Long id) {
        return base().when().get("/{id}", id);
    }

    public static int delete(Long id) {
        return base().when().delete("/{id}", id).statusCode();
    }

    public static RequestSpecification base() {
        return RestAssured.given()
            .port(TestConfigs.SERVER_PORT)
            .basePath(PATH);
    }

    private static MultipartRequest multipart(Map<String, Object> product, byte[] image, String imageType) {
        var specification = base().multiPart("product", MAPPER.writeValueAsString(product), "application/json");
        if (image != null) specification = specification.multiPart("image", "photo", image, imageType);
        return new MultipartRequest(specification);
    }

    private record MultipartRequest(RequestSpecification specification) {

        Response post() {
            return specification.when().post();
        }

        Response put() {
            return specification.when().put();
        }
    }
}
