package br.com.erudio.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.Hibernate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;

import br.com.erudio.integrationtests.testcontainers.AbstractIntegrationTest;
import br.com.erudio.model.Cart;
import br.com.erudio.model.CartItem;
import br.com.erudio.model.CartStatus;
import br.com.erudio.model.Product;
import br.com.erudio.repositories.CartRepository;
import br.com.erudio.repositories.ProductRepository;
import jakarta.persistence.EntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CartRepositoryTest extends AbstractIntegrationTest {

    private static final String TOKEN = "123e4567-e89b-42d3-a456-426614174000";
    private static final String OTHER_TOKEN = "223e4567-e89b-42d3-a456-426614174000";
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 26, 12, 0);

    @Autowired
    private CartRepository repository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private EntityManager entityManager;

    @BeforeEach
    void cleanCarts() {
        repository.deleteAllInBatch();
    }

    private Product newProduct(String name) {
        var product = new Product();
        product.setName(name);
        product.setDescription("Description of " + name);
        product.setPrice(new BigDecimal("25.00"));
        product.setCategory("Mug");
        product.setQuantity(5);
        product.setFeatured(false);
        product.setCreatedAt(LocalDateTime.of(2026, 10, 1, 10, 0));
        product.setPopularity(0);
        product.setReviewCount(0);
        return productRepository.saveAndFlush(product);
    }

    private Cart newCart(String token, CartStatus status, LocalDateTime updatedAt) {
        var cart = new Cart();
        cart.setToken(token);
        cart.setStatus(status);
        cart.setCreatedAt(updatedAt);
        cart.setUpdatedAt(updatedAt);
        return repository.saveAndFlush(cart);
    }

    private void addItem(Cart cart, Product product, int quantity) {
        var item = new CartItem();
        item.setCart(cart);
        item.setProduct(product);
        item.setQuantity(quantity);
        cart.getItems().add(item);
        repository.saveAndFlush(cart);
    }

    private long countItems() {
        return ((Number) entityManager.createNativeQuery("SELECT COUNT(*) FROM cart_items").getSingleResult()).longValue();
    }

    @Test
    void findWithItemsByTokenLoadsTheItemsAndTheirProducts() {
        var cart = newCart(TOKEN, CartStatus.OPEN, NOW);
        addItem(cart, newProduct("Black Mug"), 2);
        addItem(cart, newProduct("White Mug"), 1);
        entityManager.flush();
        entityManager.clear();

        var found = repository.findWithItemsByToken(TOKEN).orElseThrow();

        assertTrue(Hibernate.isInitialized(found.getItems()));
        assertEquals(2, found.getItems().size());
        assertTrue(found.getItems().stream().allMatch(item -> Hibernate.isInitialized(item.getProduct())));
        assertEquals(List.of("Black Mug", "White Mug"), found.getItems().stream().map(item -> item.getProduct().getName()).toList());
    }

    @Test
    void findWithItemsByTokenReturnsTheCartOfThatTokenOnly() {
        var cart = newCart(TOKEN, CartStatus.OPEN, NOW);
        addItem(cart, newProduct("Black Mug"), 1);
        newCart(OTHER_TOKEN, CartStatus.OPEN, NOW);
        entityManager.flush();
        entityManager.clear();

        var found = repository.findWithItemsByToken(OTHER_TOKEN).orElseThrow();

        assertEquals(OTHER_TOKEN, found.getToken());
        assertTrue(found.getItems().isEmpty());
    }

    @Test
    void findWithItemsByTokenReturnsEmptyForAnUnknownToken() {
        assertTrue(repository.findWithItemsByToken(TOKEN).isEmpty());
    }

    @Test
    void findWithItemsByTokenReturnsACartWithoutItems() {
        newCart(TOKEN, CartStatus.OPEN, NOW);
        entityManager.flush();
        entityManager.clear();

        var found = repository.findWithItemsByToken(TOKEN).orElseThrow();

        assertTrue(found.getItems().isEmpty());
    }

    @Test
    void deleteAbandonedRemovesOnlyOpenCartsInactiveBeforeTheLimit() {
        var old = newCart(TOKEN, CartStatus.OPEN, NOW.minusDays(2));
        addItem(old, newProduct("Black Mug"), 1);
        newCart(OTHER_TOKEN, CartStatus.OPEN, NOW.minusHours(1));
        var convertedToken = "323e4567-e89b-42d3-a456-426614174000";
        newCart(convertedToken, CartStatus.CONVERTED, NOW.minusDays(5));
        entityManager.flush();
        entityManager.clear();

        var removed = repository.deleteAbandoned(CartStatus.OPEN, NOW.minusDays(1));

        assertEquals(1, removed);
        assertTrue(repository.findWithItemsByToken(TOKEN).isEmpty());
        assertTrue(repository.findWithItemsByToken(OTHER_TOKEN).isPresent());
        assertTrue(repository.findWithItemsByToken(convertedToken).isPresent());
    }

    @Test
    void deleteAbandonedRemovesTheItemsOfTheRemovedCart() {
        var old = newCart(TOKEN, CartStatus.OPEN, NOW.minusDays(2));
        addItem(old, newProduct("Black Mug"), 1);
        var recent = newCart(OTHER_TOKEN, CartStatus.OPEN, NOW);
        addItem(recent, newProduct("White Mug"), 3);
        entityManager.flush();
        entityManager.clear();
        assertEquals(2, countItems());

        repository.deleteAbandoned(CartStatus.OPEN, NOW.minusDays(1));

        assertEquals(1, countItems());
    }

    @Test
    void deleteAbandonedKeepsACartInactiveExactlyAtTheLimit() {
        newCart(TOKEN, CartStatus.OPEN, NOW.minusDays(1));
        entityManager.flush();
        entityManager.clear();

        var removed = repository.deleteAbandoned(CartStatus.OPEN, NOW.minusDays(1));

        assertEquals(0, removed);
        assertFalse(repository.findWithItemsByToken(TOKEN).isEmpty());
    }

    @Test
    void deletingAProductRemovesItsItemsFromTheCarts() {
        var cart = newCart(TOKEN, CartStatus.OPEN, NOW);
        var product = newProduct("Black Mug");
        addItem(cart, product, 1);
        entityManager.flush();
        entityManager.clear();

        productRepository.deleteAllInBatch(List.of(productRepository.findById(product.getId()).orElseThrow()));
        entityManager.flush();
        entityManager.clear();

        assertTrue(repository.findWithItemsByToken(TOKEN).orElseThrow().getItems().isEmpty());
    }
}
