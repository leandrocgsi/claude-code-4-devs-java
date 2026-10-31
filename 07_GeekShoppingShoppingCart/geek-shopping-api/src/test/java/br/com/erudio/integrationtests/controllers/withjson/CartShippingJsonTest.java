package br.com.erudio.integrationtests.controllers.withjson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.Map;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;

import br.com.erudio.integrationtests.ApiIntegrationTest;
import br.com.erudio.integrationtests.CartApi;
import br.com.erudio.integrationtests.ProductApi;
import br.com.erudio.integrationtests.dto.CartDTO;
import br.com.erudio.integrationtests.dto.ProductDTO;
import io.restassured.http.ContentType;

class CartShippingJsonTest extends ApiIntegrationTest {

    private static ProductDTO mug;
    private static ProductDTO book;

    @Autowired
    private Environment environment;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeAll
    static void setUp() {
        mug = CartApi.product("Shipping Mug", 50, "25.00", null, null);
        book = CartApi.product("Shipping Book", 50, "40.00", null, null);
    }

    @AfterAll
    static void cleanUp() {
        ProductApi.delete(mug.getId());
        ProductApi.delete(book.getId());
    }

    private BigDecimal configuredShipping() {
        return new BigDecimal(environment.getProperty("shipping.flat-rate")).setScale(2);
    }

    private static void assertTotalIsSubtotalPlusShipping(CartDTO cart) {
        assertNotNull(cart.getShipping());
        assertEquals(0, cart.getSubtotal().add(cart.getShipping()).compareTo(cart.getTotal()), cart.getSubtotal() + " + " + cart.getShipping() + " != " + cart.getTotal());
    }

    @Test
    void theTestConfigurationChargesTenByDefault() {
        assertEquals(0, new BigDecimal("10.00").compareTo(configuredShipping()));
    }

    @Test
    void aNewTokenHasNoShippingAndNothingIsStored() {
        var token = CartApi.newToken();

        var response = CartApi.get(token);

        var cart = CartApi.read(response);
        CartApi.assertMoney("0", cart.getSubtotal());
        CartApi.assertMoney("0", cart.getShipping());
        CartApi.assertMoney("0", cart.getTotal());
        assertTrue(response.jsonPath().getMap("$").containsKey("shipping"), response.asString());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM carts WHERE token = ?", Integer.class, token));
    }

    @Test
    void addingAnItemChargesTheConfiguredShippingAndAddsItToTheTotal() {
        var token = CartApi.newToken();

        var cart = CartApi.addOk(token, mug.getId(), 2);

        CartApi.assertMoney("50.00", cart.getSubtotal());
        CartApi.assertMoney(configuredShipping().toPlainString(), cart.getShipping());
        assertEquals(0, new BigDecimal("50.00").add(configuredShipping()).compareTo(cart.getTotal()));
        assertEquals(2, cart.getShipping().scale());
        assertTotalIsSubtotalPlusShipping(cart);
    }

    @Test
    void theShippingIsTheSameForAnyQuantityAndAnyNumberOfProducts() {
        var token = CartApi.newToken();

        var one = CartApi.addOk(token, mug.getId(), 1);
        var many = CartApi.addOk(token, mug.getId(), 4);
        var two = CartApi.addOk(token, book.getId(), 7);

        assertEquals(0, one.getShipping().compareTo(many.getShipping()));
        assertEquals(0, many.getShipping().compareTo(two.getShipping()));
        CartApi.assertMoney(configuredShipping().toPlainString(), two.getShipping());
        assertEquals(12, two.getItemCount());
    }

    @Test
    void theTotalIsAlwaysTheSubtotalPlusTheShippingOnEveryOperation() {
        var token = CartApi.newToken();

        var added = CartApi.addOk(token, mug.getId(), 3);
        var itemId = added.getItems().get(0).getId();
        var updated = CartApi.read(CartApi.updateItem(token, itemId, 5));
        var read = CartApi.read(CartApi.get(token));
        var second = CartApi.addOk(token, book.getId(), 2);

        assertTotalIsSubtotalPlusShipping(added);
        assertTotalIsSubtotalPlusShipping(updated);
        assertTotalIsSubtotalPlusShipping(read);
        assertTotalIsSubtotalPlusShipping(second);
        CartApi.assertMoney("125.00", updated.getSubtotal());
        assertEquals(0, new BigDecimal("125.00").add(configuredShipping()).compareTo(updated.getTotal()));
    }

    @Test
    void updatingTheQuantityKeepsTheShippingAndRecomputesTheTotal() {
        var token = CartApi.newToken();
        var itemId = CartApi.addOk(token, mug.getId(), 1).getItems().get(0).getId();

        var cart = CartApi.read(CartApi.updateItem(token, itemId, 4));

        CartApi.assertMoney("100.00", cart.getSubtotal());
        CartApi.assertMoney(configuredShipping().toPlainString(), cart.getShipping());
        assertEquals(0, new BigDecimal("100.00").add(configuredShipping()).compareTo(cart.getTotal()));
    }

    @Test
    void removingAnItemKeepsTheShippingWhileThereAreItemsAndDropsItWithTheLastOne() {
        var token = CartApi.newToken();
        CartApi.addOk(token, mug.getId(), 1);
        var items = CartApi.addOk(token, book.getId(), 1).getItems();

        assertEquals(204, CartApi.removeItem(token, items.get(0).getId()).statusCode());
        var afterFirst = CartApi.read(CartApi.get(token));
        assertEquals(204, CartApi.removeItem(token, items.get(1).getId()).statusCode());
        var afterLast = CartApi.read(CartApi.get(token));

        CartApi.assertMoney(configuredShipping().toPlainString(), afterFirst.getShipping());
        CartApi.assertMoney("0", afterLast.getShipping());
        CartApi.assertMoney("0", afterLast.getTotal());
    }

    @Test
    void clearingTheCartDropsTheShipping() {
        var token = CartApi.newToken();
        CartApi.addOk(token, mug.getId(), 2);
        CartApi.addOk(token, book.getId(), 1);

        assertEquals(204, CartApi.clear(token).statusCode());

        var cart = CartApi.read(CartApi.get(token));
        CartApi.assertMoney("0", cart.getSubtotal());
        CartApi.assertMoney("0", cart.getShipping());
        CartApi.assertMoney("0", cart.getTotal());
    }

    @Test
    void aShippingOrTotalSentInTheBodyOfAnAddIsIgnored() {
        var token = CartApi.newToken();
        var item = CartApi.item(mug.getId(), 1);
        item.put("shipping", 0);
        item.put("total", 1);

        var response = CartApi.addItem(token, item);

        var cart = CartApi.read(response);
        CartApi.assertMoney(configuredShipping().toPlainString(), cart.getShipping());
        assertEquals(0, new BigDecimal("25.00").add(configuredShipping()).compareTo(cart.getTotal()));
    }

    @Test
    void aShippingOrTotalSentInTheBodyOfAnUpdateIsIgnored() {
        var token = CartApi.newToken();
        var itemId = CartApi.addOk(token, mug.getId(), 1).getItems().get(0).getId();

        var response = CartApi.base(token)
            .contentType(ContentType.JSON)
            .body(Map.of("quantity", 2, "shipping", 0, "total", 1))
            .when()
            .put("/items/{itemId}", itemId);

        var cart = CartApi.read(response);
        CartApi.assertMoney(configuredShipping().toPlainString(), cart.getShipping());
        assertEquals(0, new BigDecimal("50.00").add(configuredShipping()).compareTo(cart.getTotal()));
    }

    @Test
    void eachCartPaysItsOwnShipping() {
        var first = CartApi.newToken();
        var second = CartApi.newToken();
        CartApi.addOk(first, mug.getId(), 1);

        var other = CartApi.read(CartApi.get(second));
        var firstCart = CartApi.read(CartApi.get(first));

        CartApi.assertMoney("0", other.getShipping());
        CartApi.assertMoney(configuredShipping().toPlainString(), firstCart.getShipping());
    }

    @Test
    void aConvertedCartIsStillReadWithItsShipping() {
        var token = CartApi.newToken();
        CartApi.addOk(token, mug.getId(), 1);
        jdbc.update("UPDATE carts SET status = 'CONVERTED' WHERE token = ?", token);

        var cart = CartApi.read(CartApi.get(token));

        CartApi.assertMoney(configuredShipping().toPlainString(), cart.getShipping());
        assertTotalIsSubtotalPlusShipping(cart);
    }

    @Test
    void theShippingIsNotStoredInTheDatabase() {
        var columns = jdbc.queryForObject(
            "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name IN ('carts', 'cart_items') AND (column_name LIKE '%ship%' OR column_name LIKE '%total%')",
            Integer.class);

        assertEquals(0, columns);
    }
}
