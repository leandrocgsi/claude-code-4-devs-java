package br.com.erudio.integrationtests.controllers.withjson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import br.com.erudio.integrationtests.ApiIntegrationTest;
import br.com.erudio.integrationtests.CartApi;
import br.com.erudio.integrationtests.ProductApi;
import br.com.erudio.integrationtests.dto.ProductDTO;
import br.com.erudio.services.CartCleanupService;

class CartLifecycleJsonTest extends ApiIntegrationTest {

    private static final List<Long> products = new ArrayList<>();

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private CartCleanupService cleanupService;

    @AfterAll
    static void cleanUp() {
        products.forEach(ProductApi::delete);
    }

    private static ProductDTO newProduct(String name, int quantity, String price) {
        var product = CartApi.product(name, quantity, price, null, null);
        products.add(product.getId());
        return product;
    }

    private void age(String token, LocalDateTime updatedAt) {
        jdbc.update("UPDATE carts SET updated_at = ? WHERE token = ?", updatedAt, token);
    }

    private LocalDateTime updatedAt(String token) {
        return jdbc.queryForObject("SELECT updated_at FROM carts WHERE token = ?", LocalDateTime.class, token);
    }

    private int cartRows(String token) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM carts WHERE token = ?", Integer.class, token);
    }

    private int itemRows(String token) {
        return jdbc.queryForObject(
            "SELECT COUNT(*) FROM cart_items i JOIN carts c ON c.id = i.cart_id WHERE c.token = ?", Integer.class, token);
    }

    private static Map<String, Object> update(ProductDTO product, String price, int quantity) {
        var body = ProductApi.product(product.getName(), CartApi.CATEGORY, price);
        body.put("id", product.getId());
        body.put("quantity", quantity);
        return body;
    }

    @Test
    void aPriceChangeOfTheProductShowsUpOnTheNextRead() {
        var product = newProduct("Lifecycle Price", 10, "25.00");
        var token = CartApi.newToken();
        CartApi.addOk(token, product.getId(), 2);
        CartApi.assertMoney("50.00", CartApi.read(CartApi.get(token)).getSubtotal());

        var response = ProductApi.update(update(product, "30.00", 10), null, null);
        assertEquals(200, response.statusCode(), response.asString());

        var cart = CartApi.read(CartApi.get(token));
        CartApi.assertMoney("30.00", cart.getItems().get(0).getUnitPrice());
        CartApi.assertMoney("60.00", cart.getItems().get(0).getLineTotal());
        CartApi.assertMoney("60.00", cart.getSubtotal());
        CartApi.assertMoney("70.00", cart.getTotal());
    }

    @Test
    void aStockReductionShowsOnTheItemAndBlocksFurtherGrowth() {
        var product = newProduct("Lifecycle Stock", 10, "25.00");
        var token = CartApi.newToken();
        var itemId = CartApi.addOk(token, product.getId(), 4).getItems().get(0).getId();

        var response = ProductApi.update(update(product, "25.00", 3), null, null);
        assertEquals(200, response.statusCode(), response.asString());

        var cart = CartApi.read(CartApi.get(token));
        assertEquals(3, cart.getItems().get(0).getStock());
        assertEquals(4, cart.getItems().get(0).getQuantity());
        CartApi.assertValidationProblem(CartApi.updateItem(token, itemId, 4), "quantity");
        assertEquals(200, CartApi.updateItem(token, itemId, 3).statusCode());
    }

    @Test
    void deletingTheProductRemovesItFromEveryCart() {
        var doomed = CartApi.product("Lifecycle Doomed", 10, "25.00", null, null);
        var kept = newProduct("Lifecycle Kept", 10, "25.00");
        var first = CartApi.newToken();
        var second = CartApi.newToken();
        CartApi.addOk(first, doomed.getId(), 1);
        CartApi.addOk(first, kept.getId(), 1);
        CartApi.addOk(second, doomed.getId(), 2);

        assertEquals(204, ProductApi.delete(doomed.getId()));

        var firstCart = CartApi.read(CartApi.get(first));
        assertEquals(1, firstCart.getItems().size());
        assertEquals(kept.getId(), firstCart.getItems().get(0).getProductId());
        assertTrue(CartApi.read(CartApi.get(second)).getItems().isEmpty());
        assertEquals(1, cartRows(second));
    }

    @Test
    void aConvertedCartCanBeReadButAcceptsNoWrite() {
        var product = newProduct("Lifecycle Converted", 10, "25.00");
        var token = CartApi.newToken();
        var itemId = CartApi.addOk(token, product.getId(), 1).getItems().get(0).getId();
        jdbc.update("UPDATE carts SET status = 'CONVERTED' WHERE token = ?", token);

        assertEquals(1, CartApi.read(CartApi.get(token)).getItemCount());
        var add = CartApi.addItem(token, CartApi.item(product.getId(), 1));
        CartApi.assertValidationProblem(add, "cart");
        CartApi.assertValidationProblem(CartApi.updateItem(token, itemId, 2), "cart");
        CartApi.assertValidationProblem(CartApi.removeItem(token, itemId), "cart");
        CartApi.assertValidationProblem(CartApi.clear(token), "cart");
        assertEquals(1, CartApi.read(CartApi.get(token)).getItemCount());
    }

    @Test
    void everyWriteRenewsTheInactivityClockButAReadDoesNot() {
        var product = newProduct("Lifecycle Clock", 10, "25.00");
        var token = CartApi.newToken();
        var itemId = CartApi.addOk(token, product.getId(), 1).getItems().get(0).getId();
        var old = LocalDateTime.now().minusDays(3);

        age(token, old);
        CartApi.read(CartApi.get(token));
        assertEquals(old.withNano(0), updatedAt(token).withNano(0));

        CartApi.addOk(token, product.getId(), 1);
        assertTrue(updatedAt(token).isAfter(LocalDateTime.now().minusMinutes(1)));

        age(token, old);
        assertEquals(200, CartApi.updateItem(token, itemId, 3).statusCode());
        assertTrue(updatedAt(token).isAfter(LocalDateTime.now().minusMinutes(1)));

        age(token, old);
        assertEquals(204, CartApi.removeItem(token, itemId).statusCode());
        assertTrue(updatedAt(token).isAfter(LocalDateTime.now().minusMinutes(1)));

        age(token, old);
        assertEquals(204, CartApi.clear(token).statusCode());
        assertTrue(updatedAt(token).isAfter(LocalDateTime.now().minusMinutes(1)));
    }

    @Test
    void theCleanupRemovesAbandonedCartsWithTheirItemsAndKeepsTheOthers() {
        var product = newProduct("Lifecycle Cleanup", 10, "25.00");
        var abandoned = CartApi.newToken();
        var recent = CartApi.newToken();
        var convertedAndOld = CartApi.newToken();
        CartApi.addOk(abandoned, product.getId(), 1);
        CartApi.addOk(abandoned, newProduct("Lifecycle Cleanup Two", 10, "10.00").getId(), 2);
        CartApi.addOk(recent, product.getId(), 1);
        CartApi.addOk(convertedAndOld, product.getId(), 1);
        age(abandoned, LocalDateTime.now().minusDays(2));
        age(recent, LocalDateTime.now().minusHours(12));
        age(convertedAndOld, LocalDateTime.now().minusDays(9));
        jdbc.update("UPDATE carts SET status = 'CONVERTED' WHERE token = ?", convertedAndOld);
        assertEquals(2, itemRows(abandoned));

        var removed = cleanupService.removeAbandoned();

        assertTrue(removed >= 1, String.valueOf(removed));
        assertEquals(0, cartRows(abandoned));
        assertEquals(0, itemRows(abandoned));
        assertEquals(1, cartRows(recent));
        assertEquals(1, itemRows(recent));
        assertEquals(1, cartRows(convertedAndOld));
        assertEquals(1, itemRows(convertedAndOld));
    }

    @Test
    void afterTheCleanupTheSameTokenStartsOverWithAnEmptyCart() {
        var product = newProduct("Lifecycle Restart", 10, "25.00");
        var token = CartApi.newToken();
        CartApi.addOk(token, product.getId(), 3);
        age(token, LocalDateTime.now().minusDays(2));

        cleanupService.removeAbandoned();

        assertTrue(CartApi.read(CartApi.get(token)).getItems().isEmpty());
        assertEquals(0, cartRows(token));
        var cart = CartApi.addOk(token, product.getId(), 1);
        assertEquals(1, cart.getItemCount());
        assertEquals(1, cartRows(token));
    }

    @Test
    void theInactivityPeriodComesFromTheConfigurationAndIsOneDayByDefault() {
        var product = newProduct("Lifecycle Period", 10, "25.00");
        var justInside = CartApi.newToken();
        var justOutside = CartApi.newToken();
        CartApi.addOk(justInside, product.getId(), 1);
        CartApi.addOk(justOutside, product.getId(), 1);
        age(justInside, LocalDateTime.now().minusHours(23));
        age(justOutside, LocalDateTime.now().minusHours(25));

        cleanupService.removeAbandoned();

        assertEquals(1, cartRows(justInside));
        assertEquals(0, cartRows(justOutside));
        assertFalse(CartApi.read(CartApi.get(justInside)).getItems().isEmpty());
        assertNotNull(updatedAt(justInside));
    }
}
