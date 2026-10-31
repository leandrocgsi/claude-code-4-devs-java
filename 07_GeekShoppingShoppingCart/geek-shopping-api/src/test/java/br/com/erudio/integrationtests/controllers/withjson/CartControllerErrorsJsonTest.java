package br.com.erudio.integrationtests.controllers.withjson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import br.com.erudio.integrationtests.ApiIntegrationTest;
import br.com.erudio.integrationtests.CartApi;
import br.com.erudio.integrationtests.ProductApi;
import br.com.erudio.integrationtests.dto.ProductDTO;
import io.restassured.http.ContentType;
import io.restassured.response.Response;

class CartControllerErrorsJsonTest extends ApiIntegrationTest {

    private static ProductDTO mug;
    private static ProductDTO soldOut;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeAll
    static void setUp() {
        mug = CartApi.product("Cart Errors Mug", 5, "25.00", "Black", "M");
        soldOut = CartApi.product("Cart Errors Sold Out", 0, "30.00", null, null);
    }

    @AfterAll
    static void cleanUp() {
        ProductApi.delete(mug.getId());
        ProductApi.delete(soldOut.getId());
    }

    private int cartRows(String token) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM carts WHERE token = ?", Integer.class, token);
    }

    private static void assertMissingHeader(Response response) {
        assertEquals(400, response.statusCode(), response.asString());
        assertTrue(response.contentType().contains("application/problem+json"), response.contentType());
        assertEquals("about:blank", response.jsonPath().getString("type"));
        assertTrue(response.jsonPath().getString("detail").contains("X-Cart-Token"), response.asString());
    }

    @Test
    void everyRouteRefusesARequestWithoutTheTokenHeader() {
        assertMissingHeader(CartApi.withoutToken().when().get());
        assertMissingHeader(CartApi.withoutToken().when().delete());
        assertMissingHeader(CartApi.withoutToken().contentType(ContentType.JSON).body(CartApi.item(mug.getId(), 1)).when().post("/items"));
        assertMissingHeader(CartApi.withoutToken().contentType(ContentType.JSON).body(Map.of("quantity", 1)).when().put("/items/{id}", 1));
        assertMissingHeader(CartApi.withoutToken().when().delete("/items/{id}", 1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"not-a-uuid", "12345", "123e4567-e89b-42d3-a456", "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz"})
    void aTokenThatIsNotAUuidAnswersBadRequestOnEveryRoute(String invalid) {
        var responses = new Response[] {
            CartApi.get(invalid),
            CartApi.clear(invalid),
            CartApi.addItem(invalid, CartApi.item(mug.getId(), 1)),
            CartApi.updateItem(invalid, 1, 1),
            CartApi.removeItem(invalid, 1)
        };

        for (var response : responses) {
            assertEquals(400, response.statusCode(), response.asString());
            assertTrue(response.jsonPath().getString("message").contains("UUID"), response.asString());
            assertTrue(response.jsonPath().getString("details").startsWith("uri=/api/cart/v1"), response.asString());
            assertNotNull(response.jsonPath().getString("timestamp"));
        }
    }

    @Test
    void anUpperCaseTokenIsTheSameCartAsTheLowerCaseOne() {
        var token = CartApi.newToken();
        CartApi.addOk(token, mug.getId(), 1);

        var cart = CartApi.read(CartApi.get(token.toUpperCase()));

        assertEquals(1, cart.getItems().size());
        assertEquals(1, cartRows(token));
    }

    @Test
    void readingACartThatDoesNotExistStoresNothing() {
        var token = CartApi.newToken();

        CartApi.read(CartApi.get(token));
        CartApi.clear(token).then().statusCode(204);

        assertEquals(0, cartRows(token));
    }

    @Test
    void theFirstWriteCreatesTheCartOpenAndWithoutOwner() {
        var token = CartApi.newToken();

        CartApi.addOk(token, mug.getId(), 1);

        assertEquals(1, cartRows(token));
        assertEquals("OPEN", jdbc.queryForObject("SELECT status FROM carts WHERE token = ?", String.class, token));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM carts WHERE token = ? AND customer_id IS NULL", Integer.class, token));
    }

    @Test
    void eachTokenSeesOnlyItsOwnCart() {
        var first = CartApi.newToken();
        var second = CartApi.newToken();
        CartApi.addOk(first, mug.getId(), 2);

        var other = CartApi.read(CartApi.get(second));

        assertTrue(other.getItems().isEmpty());
        assertEquals(2, CartApi.read(CartApi.get(first)).getItemCount());
    }

    @Test
    void anEmptyBodyReportsTheRequiredFields() {
        var response = CartApi.addItem(CartApi.newToken(), Map.of());

        CartApi.assertValidationProblem(response, "productId");
        Map<String, String> errors = response.jsonPath().getMap("errors");
        assertTrue(errors.containsKey("quantity"), errors.toString());
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, -50})
    void aQuantityBelowOneIsRefused(int quantity) {
        var token = CartApi.newToken();

        var response = CartApi.addItem(token, CartApi.item(mug.getId(), quantity));

        CartApi.assertValidationProblem(response, "quantity");
        assertEquals(0, cartRows(token));
    }

    @ParameterizedTest
    @ValueSource(longs = {0, -3})
    void aProductIdBelowOneIsRefused(long productId) {
        CartApi.assertValidationProblem(CartApi.addItem(CartApi.newToken(), CartApi.item(productId, 1)), "productId");
    }

    @Test
    void aColorOrSizeLongerThanTheColumnsIsRefused() {
        var item = CartApi.item(mug.getId(), 1);
        item.put("color", "c".repeat(51));
        item.put("size", "s".repeat(21));

        var response = CartApi.addItem(CartApi.newToken(), item);

        CartApi.assertValidationProblem(response, "color");
        Map<String, String> errors = response.jsonPath().getMap("errors");
        assertTrue(errors.containsKey("size"), errors.toString());
    }

    @Test
    void aQuantityBeyondTheStockIsRefusedWithoutCreatingTheCart() {
        var token = CartApi.newToken();

        var response = CartApi.addItem(token, CartApi.item(mug.getId(), 6));

        CartApi.assertValidationProblem(response, "quantity");
        assertEquals("Only 5 units are available", response.jsonPath().getString("errors.quantity"));
        assertEquals(0, cartRows(token));
    }

    @Test
    void anHugeQuantityIsRefusedAsAClientErrorNotAServerError() {
        var response = CartApi.addItem(CartApi.newToken(), CartApi.item(mug.getId(), Integer.MAX_VALUE));

        CartApi.assertValidationProblem(response, "quantity");
    }

    @Test
    void aQuantityThatDoesNotFitAnIntegerIsABadRequest() {
        var response = CartApi.base(CartApi.newToken())
            .contentType(ContentType.JSON)
            .body("{\"productId\":" + mug.getId() + ",\"quantity\":99999999999}")
            .when()
            .post("/items");

        assertEquals(400, response.statusCode(), response.asString());
        assertTrue(response.contentType().contains("application/problem+json"), response.contentType());
    }

    @Test
    void theSumOfTheLinesCannotExceedTheStockEither() {
        var token = CartApi.newToken();
        CartApi.addOk(token, mug.getId(), 4);

        var response = CartApi.addItem(token, CartApi.item(mug.getId(), 2));

        CartApi.assertValidationProblem(response, "quantity");
        assertEquals(4, CartApi.read(CartApi.get(token)).getItems().get(0).getQuantity());
    }

    @Test
    void aProductWithoutStockCannotBeAdded() {
        var token = CartApi.newToken();

        var response = CartApi.addItem(token, CartApi.item(soldOut.getId(), 1));

        CartApi.assertValidationProblem(response, "quantity");
        assertEquals("The product is out of stock", response.jsonPath().getString("errors.quantity"));
        assertEquals(0, cartRows(token));
    }

    @Test
    void anUnknownProductIsNotFound() {
        var response = CartApi.addItem(CartApi.newToken(), CartApi.item(999_999_999L, 1));

        assertEquals(404, response.statusCode(), response.asString());
        assertEquals("No records found for this ID!", response.jsonPath().getString("message"));
        assertTrue(response.jsonPath().getString("details").startsWith("uri=/api/cart/v1/items"));
    }

    @Test
    void aColorOrSizeOfAnotherProductIsRefused() {
        var wrongColor = CartApi.item(mug.getId(), 1);
        wrongColor.put("color", "Red");
        var wrongSize = CartApi.item(mug.getId(), 1);
        wrongSize.put("size", "XL");

        CartApi.assertValidationProblem(CartApi.addItem(CartApi.newToken(), wrongColor), "color");
        CartApi.assertValidationProblem(CartApi.addItem(CartApi.newToken(), wrongSize), "size");
    }

    @Test
    void theColorAndSizeOfTheProductAreAcceptedWithoutRegardToCase() {
        var item = CartApi.item(mug.getId(), 1);
        item.put("color", "bLACK");
        item.put("size", "m");

        var cart = CartApi.read(CartApi.addItem(CartApi.newToken(), item));

        assertEquals("Black", cart.getItems().get(0).getColor());
        assertEquals("M", cart.getItems().get(0).getSize());
    }

    @Test
    void anItemThatIsNotInTheCartIsNotFound() {
        var token = CartApi.newToken();
        CartApi.addOk(token, mug.getId(), 1);

        var update = CartApi.updateItem(token, 999_999_999L, 1);
        var remove = CartApi.removeItem(token, 999_999_999L);

        assertEquals(404, update.statusCode(), update.asString());
        assertEquals(404, remove.statusCode(), remove.asString());
        assertEquals("No records found for this ID!", update.jsonPath().getString("message"));
    }

    @Test
    void aTokenWithoutACartHasNoItemToUpdateOrRemove() {
        var token = CartApi.newToken();

        assertEquals(404, CartApi.updateItem(token, 1, 1).statusCode());
        assertEquals(404, CartApi.removeItem(token, 1).statusCode());
        assertEquals(0, cartRows(token));
    }

    @Test
    void theItemOfAnotherCartCannotBeTouched() {
        var owner = CartApi.newToken();
        var intruder = CartApi.newToken();
        var itemId = CartApi.addOk(owner, mug.getId(), 2).getItems().get(0).getId();
        CartApi.addOk(intruder, mug.getId(), 1);

        assertEquals(404, CartApi.updateItem(intruder, itemId, 3).statusCode());
        assertEquals(404, CartApi.removeItem(intruder, itemId).statusCode());

        assertEquals(2, CartApi.read(CartApi.get(owner)).getItems().get(0).getQuantity());
        assertEquals(1, CartApi.read(CartApi.get(intruder)).getItems().get(0).getQuantity());
    }

    @Test
    void updatingToAQuantityBelowOneIsRefused() {
        var token = CartApi.newToken();
        var itemId = CartApi.addOk(token, mug.getId(), 2).getItems().get(0).getId();

        CartApi.assertValidationProblem(CartApi.updateItem(token, itemId, 0), "quantity");
        CartApi.assertValidationProblem(CartApi.updateItem(token, itemId, -1), "quantity");

        assertEquals(2, CartApi.read(CartApi.get(token)).getItems().get(0).getQuantity());
    }

    @Test
    void anUpdateWithoutQuantityIsRefused() {
        var token = CartApi.newToken();
        var itemId = CartApi.addOk(token, mug.getId(), 1).getItems().get(0).getId();

        var response = CartApi.base(token)
            .contentType(ContentType.JSON)
            .body("{}")
            .when()
            .put("/items/{itemId}", itemId);

        CartApi.assertValidationProblem(response, "quantity");
    }

    @Test
    void anItemIdThatIsNotANumberIsABadRequest() {
        var token = CartApi.newToken();

        assertEquals(400, CartApi.updateItem(token, "abc", 1).statusCode());
        assertEquals(400, CartApi.removeItem(token, "abc").statusCode());
    }

    @Test
    void aMalformedBodyIsABadRequest() {
        var response = CartApi.base(CartApi.newToken())
            .contentType(ContentType.JSON)
            .body("{\"productId\":")
            .when()
            .post("/items");

        assertEquals(400, response.statusCode(), response.asString());
        assertTrue(response.contentType().contains("application/problem+json"), response.contentType());
    }

    @Test
    void aBodyThatIsNotJsonIsUnsupported() {
        var response = CartApi.base(CartApi.newToken())
            .contentType(ContentType.TEXT)
            .body("productId=1")
            .when()
            .post("/items");

        assertEquals(415, response.statusCode(), response.asString());
    }

    @Test
    void aClientThatOnlyAcceptsXmlIsNotAnswered() {
        var response = CartApi.base(CartApi.newToken())
            .accept(ContentType.XML)
            .when()
            .get();

        assertEquals(406, response.statusCode(), response.asString());
    }

    @Test
    void routesThatDoNotExistInTheCartAreNotFoundOrNotAllowed() {
        var token = CartApi.newToken();

        assertEquals(405, CartApi.base(token).when().patch().statusCode());
        assertEquals(405, CartApi.base(token).when().put().statusCode());
        assertEquals(405, CartApi.base(token).when().get("/items").statusCode());
    }
}
