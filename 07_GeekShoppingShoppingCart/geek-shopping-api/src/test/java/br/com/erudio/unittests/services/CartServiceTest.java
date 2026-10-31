package br.com.erudio.unittests.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.hateoas.RepresentationModel;

import br.com.erudio.data.dto.CartDTO;
import br.com.erudio.data.dto.request.CartItemQuantityRequestDTO;
import br.com.erudio.data.dto.request.CartItemRequestDTO;
import br.com.erudio.exception.BadRequestException;
import br.com.erudio.exception.FieldValidationException;
import br.com.erudio.exception.RequiredObjectIsNullException;
import br.com.erudio.exception.ResourceNotFoundException;
import br.com.erudio.model.Cart;
import br.com.erudio.model.CartStatus;
import br.com.erudio.repositories.CartRepository;
import br.com.erudio.repositories.ProductRepository;
import br.com.erudio.services.CartService;
import br.com.erudio.unittests.mapper.mocks.MockCart;
import br.com.erudio.unittests.mapper.mocks.MockProduct;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    private MockCart carts;
    private MockProduct products;

    @InjectMocks
    private CartService service;

    @Mock
    private CartRepository repository;

    @Mock
    private ProductRepository productRepository;

    @BeforeEach
    void setUp() {
        carts = new MockCart();
        products = new MockProduct();
    }

    private void stubSave() {
        when(repository.saveAndFlush(any(Cart.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private CartItemRequestDTO addRequest(Long productId, Integer quantity, String color, String size) {
        var request = new CartItemRequestDTO();
        request.setProductId(productId);
        request.setQuantity(quantity);
        request.setColor(color);
        request.setSize(size);
        return request;
    }

    private CartItemQuantityRequestDTO quantityRequest(Integer quantity) {
        var request = new CartItemQuantityRequestDTO();
        request.setQuantity(quantity);
        return request;
    }

    private FieldValidationException assertRejected(String field, Runnable action) {
        var exception = assertThrows(FieldValidationException.class, action::run);
        assertEquals(field, exception.getField());
        return exception;
    }

    private boolean hasLink(RepresentationModel<?> model, String rel, String suffix, String type) {
        return model.getLinks().stream().anyMatch(link ->
                link.getRel().value().equals(rel) && link.getHref().endsWith(suffix) && link.getType().equals(type));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "not-a-uuid", "123e4567-e89b-42d3-a456", "123e4567e89b42d3a456426614174000zz"})
    @DisplayName("RN-1 rejects a missing or invalid token on every operation")
    void rejectsInvalidToken(String token) {
        assertThrows(BadRequestException.class, () -> service.find(token));
        assertThrows(BadRequestException.class, () -> service.addItem(token, addRequest(1L, 1, null, null)));
        assertThrows(BadRequestException.class, () -> service.updateItem(token, 1L, quantityRequest(1)));
        assertThrows(BadRequestException.class, () -> service.removeItem(token, 1L));
        assertThrows(BadRequestException.class, () -> service.clear(token));
        verify(repository, never()).findWithItemsByToken(any());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-1 rejects a null token")
    void rejectsNullToken() {
        assertThrows(BadRequestException.class, () -> service.find(null));
    }

    @Test
    @DisplayName("RN-1 accepts an upper case UUID and looks the cart up by its lower case form")
    void normalizesTheToken() {
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(carts.mockOpenCart()));

        var result = service.find(MockCart.TOKEN.toUpperCase());

        assertNotNull(result);
        verify(repository, times(1)).findWithItemsByToken(MockCart.TOKEN);
    }

    @Test
    @DisplayName("RN-2 a token without a cart gets an empty cart and nothing is stored")
    void findReturnsAnEmptyCartWithoutWriting() {
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.empty());

        var result = service.find(MockCart.TOKEN);

        assertTrue(result.getItems().isEmpty());
        assertEquals(0, result.getItemCount());
        assertEquals(new BigDecimal("0.00"), result.getSubtotal());
        assertEquals(new BigDecimal("0.00"), result.getTotal());
        verify(repository, never()).saveAndFlush(any());
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("RN-2 the cart is created on the first write for the token")
    void addItemCreatesTheCartOnTheFirstWrite() {
        var product = products.mockEntity(1);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.empty());
        stubSave();

        var result = service.addItem(MockCart.TOKEN, addRequest(1L, 2, null, null));

        var captor = ArgumentCaptor.forClass(Cart.class);
        verify(repository, times(1)).saveAndFlush(captor.capture());
        var saved = captor.getValue();
        assertEquals(MockCart.TOKEN, saved.getToken());
        assertEquals(CartStatus.OPEN, saved.getStatus());
        assertNull(saved.getCustomerId());
        assertNotNull(saved.getCreatedAt());
        assertEquals(1, saved.getItems().size());
        assertEquals(1, result.getItems().size());
        assertEquals(2, result.getItemCount());
    }

    @Test
    @DisplayName("RN-3 adds an item within the stock")
    void addItemWithinTheStock() {
        var cart = carts.mockOpenCart();
        var product = products.mockEntity(1);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));
        stubSave();

        var result = service.addItem(MockCart.TOKEN, addRequest(1L, 10, null, null));

        assertEquals(10, result.getItems().get(0).getQuantity());
        assertEquals(10, result.getItems().get(0).getStock());
    }

    @Test
    @DisplayName("RN-3 rejects a quantity above the stock and keeps the cart unchanged")
    void addItemAboveTheStock() {
        var cart = carts.mockOpenCart();
        var product = products.mockEntity(1);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        var exception = assertRejected("quantity", () -> service.addItem(MockCart.TOKEN, addRequest(1L, 11, null, null)));

        assertEquals("Only 10 units are available", exception.getMessage());
        assertTrue(cart.getItems().isEmpty());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-3 rejects a product without stock")
    void addItemOfAProductWithoutStock() {
        var product = products.mockEntity(1);
        product.setQuantity(0);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(carts.mockOpenCart()));

        var exception = assertRejected("quantity", () -> service.addItem(MockCart.TOKEN, addRequest(1L, 1, null, null)));

        assertEquals("The product is out of stock", exception.getMessage());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-3 a product that does not exist is not found")
    void addItemOfAMissingProduct() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.addItem(MockCart.TOKEN, addRequest(99L, 1, null, null)));

        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-3 a null request is refused")
    void addItemWithANullRequest() {
        assertThrows(RequiredObjectIsNullException.class, () -> service.addItem(MockCart.TOKEN, null));
        assertThrows(RequiredObjectIsNullException.class, () -> service.updateItem(MockCart.TOKEN, 1L, null));
    }

    @Test
    @DisplayName("RN-4 the same product, color and size adds to the quantity of the existing item")
    void addItemSumsTheQuantity() {
        var cart = carts.mockOpenCart();
        var product = products.mockEntity(1);
        carts.mockItem(cart, product, 5, 3);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));
        stubSave();

        var result = service.addItem(MockCart.TOKEN, addRequest(1L, 4, "Black", "M"));

        assertEquals(1, result.getItems().size());
        assertEquals(7, result.getItems().get(0).getQuantity());
        assertEquals(5L, result.getItems().get(0).getId());
    }

    @Test
    @DisplayName("RN-4 the sum also respects the stock")
    void addItemSumAboveTheStock() {
        var cart = carts.mockOpenCart();
        var product = products.mockEntity(1);
        carts.mockItem(cart, product, 5, 8);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        assertRejected("quantity", () -> service.addItem(MockCart.TOKEN, addRequest(1L, 3, null, null)));

        assertEquals(8, cart.getItems().get(0).getQuantity());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-4 a different product becomes another item")
    void addItemOfAnotherProductCreatesAnotherLine() {
        var cart = carts.mockOpenCart();
        carts.mockItem(cart, products.mockEntity(1), 5, 1);
        var other = products.mockEntity(2);
        when(productRepository.findById(2L)).thenReturn(Optional.of(other));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));
        stubSave();

        var result = service.addItem(MockCart.TOKEN, addRequest(2L, 1, null, null));

        assertEquals(2, result.getItems().size());
        assertEquals(2, result.getItemCount());
    }

    @Test
    @DisplayName("RN-5 sets a new quantity on an item instead of adding to it")
    void updateItemSetsTheQuantity() {
        var cart = carts.mockOpenCart();
        carts.mockItem(cart, products.mockEntity(1), 5, 3);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));
        stubSave();

        var result = service.updateItem(MockCart.TOKEN, 5L, quantityRequest(2));

        assertEquals(2, result.getItems().get(0).getQuantity());
        assertEquals(new BigDecimal("50.00"), result.getItems().get(0).getLineTotal());
        verify(repository, times(1)).saveAndFlush(cart);
    }

    @Test
    @DisplayName("RN-3 rejects an update above the stock")
    void updateItemAboveTheStock() {
        var cart = carts.mockOpenCart();
        carts.mockItem(cart, products.mockEntity(1), 5, 3);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        assertRejected("quantity", () -> service.updateItem(MockCart.TOKEN, 5L, quantityRequest(11)));

        assertEquals(3, cart.getItems().get(0).getQuantity());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-5 an item that is not in the cart of the token is not found")
    void updateItemOfAnotherCartIsNotFound() {
        var cart = carts.mockOpenCart();
        carts.mockItem(cart, products.mockEntity(1), 5, 3);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        assertThrows(ResourceNotFoundException.class, () -> service.updateItem(MockCart.TOKEN, 99L, quantityRequest(1)));
    }

    @Test
    @DisplayName("RN-5 updating an item of a token without a cart is not found")
    void updateItemWithoutACart() {
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.updateItem(MockCart.TOKEN, 5L, quantityRequest(1)));
    }

    @Test
    @DisplayName("RN-5 removes only the chosen item")
    void removeItem() {
        var cart = carts.mockOpenCart();
        carts.mockItem(cart, products.mockEntity(1), 5, 3);
        carts.mockItem(cart, products.mockEntity(2), 6, 1);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));
        stubSave();

        service.removeItem(MockCart.TOKEN, 5L);

        assertEquals(1, cart.getItems().size());
        assertEquals(6L, cart.getItems().get(0).getId());
        verify(repository, times(1)).saveAndFlush(cart);
    }

    @Test
    @DisplayName("RN-5 removing an item that is not in the cart is not found")
    void removeItemThatDoesNotExist() {
        var cart = carts.mockOpenCart();
        carts.mockItem(cart, products.mockEntity(1), 5, 3);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        assertThrows(ResourceNotFoundException.class, () -> service.removeItem(MockCart.TOKEN, 99L));

        assertEquals(1, cart.getItems().size());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-5 clear removes every item and keeps the cart")
    void clearEmptiesTheCart() {
        var cart = carts.mockOpenCart();
        carts.mockItem(cart, products.mockEntity(1), 5, 3);
        carts.mockItem(cart, products.mockEntity(2), 6, 1);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));
        stubSave();

        service.clear(MockCart.TOKEN);

        assertTrue(cart.getItems().isEmpty());
        verify(repository, times(1)).saveAndFlush(cart);
    }

    @Test
    @DisplayName("RN-5 clear on a token without a cart does nothing")
    void clearWithoutACartDoesNothing() {
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.empty());

        service.clear(MockCart.TOKEN);

        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-6 an omitted color and size take the ones of the product")
    void addItemTakesTheColorAndSizeOfTheProduct() {
        var product = products.mockEntity(1);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(carts.mockOpenCart()));
        stubSave();

        var result = service.addItem(MockCart.TOKEN, addRequest(1L, 1, null, null));

        assertEquals("Black", result.getItems().get(0).getColor());
        assertEquals("M", result.getItems().get(0).getSize());
    }

    @Test
    @DisplayName("RN-6 a blank color and size also take the ones of the product")
    void addItemWithBlankColorAndSize() {
        var product = products.mockEntity(1);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(carts.mockOpenCart()));
        stubSave();

        var result = service.addItem(MockCart.TOKEN, addRequest(1L, 1, "  ", ""));

        assertEquals("Black", result.getItems().get(0).getColor());
        assertEquals("M", result.getItems().get(0).getSize());
    }

    @Test
    @DisplayName("RN-6 a color and size equal to the ones of the product are accepted without regard to case")
    void addItemWithMatchingColorAndSize() {
        var product = products.mockEntity(1);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(carts.mockOpenCart()));
        stubSave();

        var result = service.addItem(MockCart.TOKEN, addRequest(1L, 1, " black ", "m"));

        assertEquals("Black", result.getItems().get(0).getColor());
        assertEquals("M", result.getItems().get(0).getSize());
    }

    @Test
    @DisplayName("RN-6 rejects a color that is not the one of the product")
    void addItemWithAnotherColor() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(products.mockEntity(1)));

        assertRejected("color", () -> service.addItem(MockCart.TOKEN, addRequest(1L, 1, "Red", null)));

        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-6 rejects a size that is not the one of the product")
    void addItemWithAnotherSize() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(products.mockEntity(1)));

        assertRejected("size", () -> service.addItem(MockCart.TOKEN, addRequest(1L, 1, null, "XL")));

        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-6 a product without color rejects a requested color")
    void addItemWithAColorForAProductWithoutColor() {
        var product = products.mockEntity(1);
        product.setColor(null);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertRejected("color", () -> service.addItem(MockCart.TOKEN, addRequest(1L, 1, "Black", null)));
    }

    @Test
    @DisplayName("RN-6 a product without color and size is added with both empty")
    void addItemOfAProductWithoutColorAndSize() {
        var product = products.mockEntity(1);
        product.setColor(null);
        product.setSize(null);
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(carts.mockOpenCart()));
        stubSave();

        var result = service.addItem(MockCart.TOKEN, addRequest(1L, 1, null, null));

        assertNull(result.getItems().get(0).getColor());
        assertNull(result.getItems().get(0).getSize());
    }

    @Test
    @DisplayName("RN-7 the unit price is the current price of the product, never stored in the cart")
    void readsTheCurrentPriceOfTheProduct() {
        var cart = carts.mockOpenCart();
        var product = products.mockEntity(1);
        carts.mockItem(cart, product, 5, 2);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        assertEquals(new BigDecimal("50.00"), service.find(MockCart.TOKEN).getSubtotal());

        product.setPrice(new BigDecimal("30.00"));
        var result = service.find(MockCart.TOKEN);

        assertEquals(new BigDecimal("30.00"), result.getItems().get(0).getUnitPrice());
        assertEquals(new BigDecimal("60.00"), result.getItems().get(0).getLineTotal());
        assertEquals(new BigDecimal("60.00"), result.getSubtotal());
    }

    @Test
    @DisplayName("RN-8 and RN-12 the total equals the subtotal, with no shipping or discount")
    void totalsAreComputedByTheServer() {
        var cart = carts.mockOpenCart();
        carts.mockItem(cart, products.mockEntity(1), 5, 2);
        var other = products.mockEntity(2);
        other.setPrice(new BigDecimal("40.00"));
        carts.mockItem(cart, other, 6, 1);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        var result = service.find(MockCart.TOKEN);

        assertEquals(3, result.getItemCount());
        assertEquals(new BigDecimal("90.00"), result.getSubtotal());
        assertEquals(new BigDecimal("90.00"), result.getTotal());
        assertEquals(new BigDecimal("50.00"), result.getItems().get(0).getLineTotal());
        assertEquals(new BigDecimal("40.00"), result.getItems().get(1).getLineTotal());
    }

    @Test
    @DisplayName("RN-12 each item exposes its product, price, quantity and stock")
    void itemFields() {
        var cart = carts.mockOpenCart();
        var product = products.mockEntityWithImage(1, "image/jpeg", 100);
        carts.mockItem(cart, product, 5, 2);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        var item = service.find(MockCart.TOKEN).getItems().get(0);

        assertEquals(5L, item.getId());
        assertEquals(1L, item.getProductId());
        assertEquals("Some Name1", item.getName());
        assertEquals("Black", item.getColor());
        assertEquals("M", item.getSize());
        assertEquals(new BigDecimal("25.00"), item.getUnitPrice());
        assertEquals(2, item.getQuantity());
        assertEquals(10, item.getStock());
        assertTrue(item.getImageUrl().endsWith("/api/product/v1/1/image"));
    }

    @Test
    @DisplayName("RN-12 a product without image has no image URL")
    void itemWithoutImage() {
        var cart = carts.mockOpenCart();
        carts.mockItem(cart, products.mockEntity(1), 5, 1);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        assertNull(service.find(MockCart.TOKEN).getItems().get(0).getImageUrl());
    }

    @Test
    @DisplayName("RN-9 a converted cart accepts no new item")
    void convertedCartRejectsNewItems() {
        var cart = carts.mockCart(CartStatus.CONVERTED);
        when(productRepository.findById(1L)).thenReturn(Optional.of(products.mockEntity(1)));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        assertRejected("cart", () -> service.addItem(MockCart.TOKEN, addRequest(1L, 1, null, null)));

        assertTrue(cart.getItems().isEmpty());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-9 a converted cart accepts no update, removal or clearing")
    void convertedCartRejectsOtherWrites() {
        var cart = carts.mockCart(CartStatus.CONVERTED);
        carts.mockItem(cart, products.mockEntity(1), 5, 1);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        assertRejected("cart", () -> service.updateItem(MockCart.TOKEN, 5L, quantityRequest(2)));
        assertRejected("cart", () -> service.removeItem(MockCart.TOKEN, 5L));
        assertRejected("cart", () -> service.clear(MockCart.TOKEN));

        assertEquals(1, cart.getItems().size());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-9 a converted cart can still be read")
    void convertedCartCanBeRead() {
        var cart = carts.mockCart(CartStatus.CONVERTED);
        carts.mockItem(cart, products.mockEntity(1), 5, 1);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        assertEquals(1, service.find(MockCart.TOKEN).getItemCount());
    }

    @Test
    @DisplayName("RN-10 every write renews the inactivity clock")
    void writesRenewUpdatedAt() {
        var cart = carts.mockOpenCart();
        carts.mockItem(cart, products.mockEntity(1), 5, 1);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));
        stubSave();

        service.updateItem(MockCart.TOKEN, 5L, quantityRequest(2));

        assertTrue(cart.getUpdatedAt().isAfter(MockCart.UPDATED_AT));
        assertEquals(MockCart.UPDATED_AT, cart.getCreatedAt());
    }

    @Test
    @DisplayName("RN-10 a read does not renew the inactivity clock")
    void readsDoNotRenewUpdatedAt() {
        var cart = carts.mockOpenCart();
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        service.find(MockCart.TOKEN);

        assertEquals(MockCart.UPDATED_AT, cart.getUpdatedAt());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("RN-11 a new cart has no owner")
    void newCartHasNoOwner() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(products.mockEntity(1)));
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.empty());
        stubSave();

        service.addItem(MockCart.TOKEN, addRequest(1L, 1, null, null));

        var captor = ArgumentCaptor.forClass(Cart.class);
        verify(repository).saveAndFlush(captor.capture());
        assertNull(captor.getValue().getCustomerId());
    }

    @Test
    @DisplayName("RN-12 the cart links to read it, add an item and clear it")
    void cartLinks() {
        var cart = carts.mockOpenCart();
        carts.mockItem(cart, products.mockEntity(1), 5, 1);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        CartDTO result = service.find(MockCart.TOKEN);

        assertTrue(hasLink(result, "self", "/api/cart/v1", "GET"));
        assertTrue(hasLink(result, "addItem", "/api/cart/v1/items", "POST"));
        assertTrue(hasLink(result, "clear", "/api/cart/v1", "DELETE"));
    }

    @Test
    @DisplayName("RN-12 each item links to update and delete itself")
    void itemLinks() {
        var cart = carts.mockOpenCart();
        carts.mockItem(cart, products.mockEntity(1), 5, 1);
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.of(cart));

        var item = service.find(MockCart.TOKEN).getItems().get(0);

        assertTrue(hasLink(item, "update", "/api/cart/v1/items/5", "PUT"));
        assertTrue(hasLink(item, "delete", "/api/cart/v1/items/5", "DELETE"));
        assertFalse(item.getLinks().isEmpty());
    }

    @Test
    @DisplayName("RN-12 the empty cart has the links too")
    void emptyCartLinks() {
        when(repository.findWithItemsByToken(MockCart.TOKEN)).thenReturn(Optional.empty());

        var result = service.find(MockCart.TOKEN);

        assertTrue(hasLink(result, "self", "/api/cart/v1", "GET"));
        assertTrue(hasLink(result, "addItem", "/api/cart/v1/items", "POST"));
    }

    @Test
    @DisplayName("RN-3 a product that is not used is never loaded when the token is invalid")
    void invalidTokenDoesNotLoadTheProduct() {
        assertThrows(BadRequestException.class, () -> service.addItem("nope", addRequest(1L, 1, null, null)));

        verify(productRepository, never()).findById(anyLong());
    }
}
