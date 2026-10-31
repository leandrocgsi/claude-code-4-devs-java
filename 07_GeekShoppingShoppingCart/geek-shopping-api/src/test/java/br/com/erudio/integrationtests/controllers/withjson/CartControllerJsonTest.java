package br.com.erudio.integrationtests.controllers.withjson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import br.com.erudio.integrationtests.ApiIntegrationTest;
import br.com.erudio.integrationtests.CartApi;
import br.com.erudio.integrationtests.ProductApi;
import br.com.erudio.integrationtests.dto.ProductDTO;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CartControllerJsonTest extends ApiIntegrationTest {

    private static String token;
    private static ProductDTO mug;
    private static ProductDTO book;
    private static Long mugItemId;
    private static Long bookItemId;

    @BeforeAll
    static void setUp() {
        token = CartApi.newToken();
        mug = CartApi.product("Cart Flow Mug", 10, "25.00", "Black", "M");
        book = CartApi.product("Cart Flow Book", 3, "40.00", null, null);
    }

    @AfterAll
    static void cleanUp() {
        ProductApi.delete(mug.getId());
        ProductApi.delete(book.getId());
    }

    @Test
    @Order(1)
    void aNewTokenGetsAnEmptyCart() {
        var response = CartApi.get(token);

        var cart = CartApi.read(response);
        assertTrue(response.contentType().contains("application/json"), response.contentType());
        assertTrue(cart.getItems().isEmpty());
        assertEquals(0, cart.getItemCount());
        CartApi.assertMoney("0", cart.getSubtotal());
        CartApi.assertMoney("0", cart.getTotal());
        assertTrue(response.jsonPath().getString("_links.self.href").endsWith("/api/cart/v1"));
        assertEquals("GET", response.jsonPath().getString("_links.self.type"));
        assertTrue(response.jsonPath().getString("_links.addItem.href").endsWith("/api/cart/v1/items"));
        assertEquals("POST", response.jsonPath().getString("_links.addItem.type"));
        assertTrue(response.jsonPath().getString("_links.clear.href").endsWith("/api/cart/v1"));
        assertEquals("DELETE", response.jsonPath().getString("_links.clear.type"));
    }

    @Test
    @Order(2)
    void addingAnItemCreatesTheCartWithTheCurrentPrice() {
        var response = CartApi.addItem(token, CartApi.item(mug.getId(), 2));

        var cart = CartApi.read(response);
        assertEquals(1, cart.getItems().size());
        var item = cart.getItems().get(0);
        mugItemId = item.getId();
        assertNotNull(mugItemId);
        assertEquals(mug.getId(), item.getProductId());
        assertEquals("Cart Flow Mug", item.getName());
        assertEquals("Black", item.getColor());
        assertEquals("M", item.getSize());
        assertEquals(2, item.getQuantity());
        assertEquals(10, item.getStock());
        CartApi.assertMoney("25.00", item.getUnitPrice());
        CartApi.assertMoney("50.00", item.getLineTotal());
        assertEquals(2, cart.getItemCount());
        CartApi.assertMoney("50.00", cart.getSubtotal());
        CartApi.assertMoney("50.00", cart.getTotal());
    }

    @Test
    @Order(3)
    void theItemsCarryTheirOwnLinks() {
        var response = CartApi.get(token);

        assertEquals(200, response.statusCode());
        assertTrue(response.jsonPath().getString("items[0]._links.update.href").endsWith("/api/cart/v1/items/" + mugItemId));
        assertEquals("PUT", response.jsonPath().getString("items[0]._links.update.type"));
        assertTrue(response.jsonPath().getString("items[0]._links.delete.href").endsWith("/api/cart/v1/items/" + mugItemId));
        assertEquals("DELETE", response.jsonPath().getString("items[0]._links.delete.type"));
    }

    @Test
    @Order(4)
    void addingTheSameProductAgainSumsTheQuantity() {
        var cart = CartApi.addOk(token, mug.getId(), 3);

        assertEquals(1, cart.getItems().size());
        assertEquals(mugItemId, cart.getItems().get(0).getId());
        assertEquals(5, cart.getItems().get(0).getQuantity());
        CartApi.assertMoney("125.00", cart.getItems().get(0).getLineTotal());
    }

    @Test
    @Order(5)
    void addingAnotherProductCreatesAnotherLine() {
        var cart = CartApi.addOk(token, book.getId(), 1);

        assertEquals(2, cart.getItems().size());
        bookItemId = cart.getItems().get(1).getId();
        assertEquals(book.getId(), cart.getItems().get(1).getProductId());
        assertEquals(6, cart.getItemCount());
        CartApi.assertMoney("165.00", cart.getSubtotal());
        CartApi.assertMoney("165.00", cart.getTotal());
    }

    @Test
    @Order(6)
    void readingTheCartReturnsWhatWasStored() {
        var cart = CartApi.read(CartApi.get(token));

        assertEquals(2, cart.getItems().size());
        assertEquals(mugItemId, cart.getItems().get(0).getId());
        assertEquals(bookItemId, cart.getItems().get(1).getId());
        assertEquals(6, cart.getItemCount());
        CartApi.assertMoney("165.00", cart.getTotal());
    }

    @Test
    @Order(7)
    void updatingAnItemSetsTheQuantityInsteadOfAddingToIt() {
        var response = CartApi.updateItem(token, mugItemId, 2);

        var cart = CartApi.read(response);
        assertEquals(2, cart.getItems().get(0).getQuantity());
        CartApi.assertMoney("50.00", cart.getItems().get(0).getLineTotal());
        assertEquals(3, cart.getItemCount());
        CartApi.assertMoney("90.00", cart.getSubtotal());
    }

    @Test
    @Order(8)
    void updatingAboveTheStockIsRefusedAndTheCartIsKept() {
        var response = CartApi.updateItem(token, bookItemId, 4);

        CartApi.assertValidationProblem(response, "quantity");
        assertEquals("Only 3 units are available", response.jsonPath().getString("errors.quantity"));
        var cart = CartApi.read(CartApi.get(token));
        assertEquals(1, cart.getItems().get(1).getQuantity());
    }

    @Test
    @Order(9)
    void removingAnItemKeepsTheOthers() {
        CartApi.removeItem(token, bookItemId).then().statusCode(204);

        var cart = CartApi.read(CartApi.get(token));
        assertEquals(1, cart.getItems().size());
        assertEquals(mugItemId, cart.getItems().get(0).getId());
        assertEquals(2, cart.getItemCount());
        CartApi.assertMoney("50.00", cart.getTotal());
    }

    @Test
    @Order(10)
    void clearingTheCartEmptiesIt() {
        CartApi.clear(token).then().statusCode(204);

        var cart = CartApi.read(CartApi.get(token));
        assertTrue(cart.getItems().isEmpty());
        assertEquals(0, cart.getItemCount());
        CartApi.assertMoney("0", cart.getTotal());
    }

    @Test
    @Order(11)
    void clearingAnEmptyCartIsStillNoContent() {
        CartApi.clear(token).then().statusCode(204);
    }

    @Test
    @Order(12)
    void theClearedCartAcceptsItemsAgain() {
        CartApi.addOk(token, mug.getId(), 1);

        var cart = CartApi.read(CartApi.get(token));
        assertEquals(1, cart.getItemCount());
    }
}
