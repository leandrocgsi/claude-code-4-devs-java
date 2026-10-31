package br.com.erudio.unittests.mapper.mocks;

import java.time.LocalDateTime;

import br.com.erudio.model.Cart;
import br.com.erudio.model.CartItem;
import br.com.erudio.model.CartStatus;
import br.com.erudio.model.Product;

public class MockCart {

    public static final String TOKEN = "123e4567-e89b-42d3-a456-426614174000";
    public static final LocalDateTime UPDATED_AT = LocalDateTime.of(2026, 10, 1, 10, 0);

    public Cart mockCart(CartStatus status) {
        Cart cart = new Cart();
        cart.setId(1L);
        cart.setToken(TOKEN);
        cart.setStatus(status);
        cart.setCreatedAt(UPDATED_AT);
        cart.setUpdatedAt(UPDATED_AT);
        return cart;
    }

    public Cart mockOpenCart() {
        return mockCart(CartStatus.OPEN);
    }

    public CartItem mockItem(Cart cart, Product product, Integer id, Integer quantity) {
        CartItem item = new CartItem();
        item.setId(id.longValue());
        item.setCart(cart);
        item.setProduct(product);
        item.setQuantity(quantity);
        item.setColor(product.getColor());
        item.setSize(product.getSize());
        cart.getItems().add(item);
        return item;
    }
}
