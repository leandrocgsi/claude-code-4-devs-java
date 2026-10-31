package br.com.erudio.services;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.erudio.controllers.CartController;
import br.com.erudio.controllers.ProductController;
import br.com.erudio.data.dto.CartDTO;
import br.com.erudio.data.dto.CartItemDTO;
import br.com.erudio.data.dto.request.CartItemQuantityRequestDTO;
import br.com.erudio.data.dto.request.CartItemRequestDTO;
import br.com.erudio.exception.BadRequestException;
import br.com.erudio.exception.FieldValidationException;
import br.com.erudio.exception.RequiredObjectIsNullException;
import br.com.erudio.exception.ResourceNotFoundException;
import br.com.erudio.model.Cart;
import br.com.erudio.model.CartItem;
import br.com.erudio.model.CartStatus;
import br.com.erudio.model.Product;
import br.com.erudio.repositories.CartRepository;
import br.com.erudio.repositories.ProductRepository;

@Service
public class CartService {

    private static final Logger logger = LoggerFactory.getLogger(CartService.class);

    private static final int MONEY_SCALE = 2;

    @Autowired
    private CartRepository repository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional(readOnly = true)
    public CartDTO find(String token) {
        logger.info("Finding one cart!");
        var key = normalizeToken(token);
        var cart = repository.findWithItemsByToken(key);
        if (cart.isEmpty()) return toDto(newCart(key));
        return toDto(cart.get());
    }

    @Transactional
    public CartDTO addItem(String token, CartItemRequestDTO request) {
        if (request == null) throw new RequiredObjectIsNullException();
        logger.info("Adding one item to the cart!");
        var key = normalizeToken(token);
        var product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("No records found for this ID!"));
        var color = resolveAttribute("color", request.getColor(), product.getColor());
        var size = resolveAttribute("size", request.getSize(), product.getSize());
        var cart = repository.findWithItemsByToken(key).orElseGet(() -> newCart(key));
        ensureOpen(cart);
        var existing = findMatchingItem(cart, product, color, size);
        long quantity = request.getQuantity().longValue() + (existing.isPresent() ? existing.get().getQuantity() : 0);
        ensureStock(product, quantity);
        if (existing.isPresent()) {
            existing.get().setQuantity((int) quantity);
        } else {
            var item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity((int) quantity);
            item.setColor(color);
            item.setSize(size);
            cart.getItems().add(item);
        }
        return save(cart);
    }

    @Transactional
    public CartDTO updateItem(String token, Long itemId, CartItemQuantityRequestDTO request) {
        if (request == null) throw new RequiredObjectIsNullException();
        logger.info("Updating one cart item!");
        var cart = findExisting(normalizeToken(token));
        ensureOpen(cart);
        var item = findItem(cart, itemId);
        ensureStock(item.getProduct(), request.getQuantity());
        item.setQuantity(request.getQuantity());
        return save(cart);
    }

    @Transactional
    public void removeItem(String token, Long itemId) {
        logger.info("Removing one cart item!");
        var cart = findExisting(normalizeToken(token));
        ensureOpen(cart);
        var item = findItem(cart, itemId);
        cart.getItems().remove(item);
        save(cart);
    }

    @Transactional
    public void clear(String token) {
        logger.info("Clearing the cart!");
        var cart = repository.findWithItemsByToken(normalizeToken(token));
        if (cart.isEmpty()) return;
        ensureOpen(cart.get());
        cart.get().getItems().clear();
        save(cart.get());
    }

    private String normalizeToken(String token) {
        if (token == null || token.isBlank()) throw new BadRequestException("The X-Cart-Token header is required");
        try {
            return UUID.fromString(token.trim()).toString();
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("The X-Cart-Token header must be a valid UUID");
        }
    }

    private Cart newCart(String token) {
        var now = LocalDateTime.now();
        var cart = new Cart();
        cart.setToken(token);
        cart.setStatus(CartStatus.OPEN);
        cart.setCreatedAt(now);
        cart.setUpdatedAt(now);
        return cart;
    }

    private Cart findExisting(String token) {
        return repository.findWithItemsByToken(token)
            .orElseThrow(() -> new ResourceNotFoundException("No records found for this ID!"));
    }

    private CartItem findItem(Cart cart, Long itemId) {
        return cart.getItems().stream()
            .filter(item -> item.getId().equals(itemId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("No records found for this ID!"));
    }

    private Optional<CartItem> findMatchingItem(Cart cart, Product product, String color, String size) {
        return cart.getItems().stream()
            .filter(item -> item.getProduct().getId().equals(product.getId()) &&
                    Objects.equals(item.getColor(), color) &&
                    Objects.equals(item.getSize(), size))
            .findFirst();
    }

    private String resolveAttribute(String field, String requested, String productValue) {
        if (requested == null || requested.isBlank()) return productValue;
        if (productValue == null || !productValue.equalsIgnoreCase(requested.trim())) {
            throw new FieldValidationException(field, "The product does not have this " + field);
        }
        return productValue;
    }

    private void ensureOpen(Cart cart) {
        if (cart.getStatus() == CartStatus.CONVERTED) throw new FieldValidationException("cart", "The cart is already converted into an order");
    }

    private void ensureStock(Product product, long quantity) {
        if (product.getQuantity() <= 0) throw new FieldValidationException("quantity", "The product is out of stock");
        if (quantity > product.getQuantity()) throw new FieldValidationException("quantity", "Only " + product.getQuantity() + " units are available");
    }

    private CartDTO save(Cart cart) {
        cart.setUpdatedAt(LocalDateTime.now());
        return toDto(repository.saveAndFlush(cart));
    }

    private CartDTO toDto(Cart cart) {
        var dto = new CartDTO();
        var subtotal = BigDecimal.ZERO.setScale(MONEY_SCALE);
        var itemCount = 0;
        for (CartItem item : cart.getItems()) {
            var itemDto = toItemDto(item);
            dto.getItems().add(itemDto);
            subtotal = subtotal.add(itemDto.getLineTotal());
            itemCount += item.getQuantity();
        }
        dto.setItemCount(itemCount);
        dto.setSubtotal(subtotal);
        dto.setTotal(subtotal);
        addHateoasLinks(dto);
        return dto;
    }

    private CartItemDTO toItemDto(CartItem item) {
        var product = item.getProduct();
        var dto = new CartItemDTO();
        dto.setId(item.getId());
        dto.setProductId(product.getId());
        dto.setName(product.getName());
        if (product.getImageSize() != null) dto.setImageUrl(imagePath(product.getId()));
        dto.setColor(item.getColor());
        dto.setSize(item.getSize());
        dto.setUnitPrice(product.getPrice());
        dto.setQuantity(item.getQuantity());
        dto.setLineTotal(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())).setScale(MONEY_SCALE));
        dto.setStock(product.getQuantity());
        addHateoasLinks(dto);
        return dto;
    }

    private String imagePath(Long productId) {
        return linkTo(methodOn(ProductController.class).findImage(productId)).toUri().getPath();
    }

    private void addHateoasLinks(CartDTO dto) {
        dto.add(linkTo(methodOn(CartController.class)
            .find(null))
            .withSelfRel().withType("GET"));

        dto.add(linkTo(methodOn(CartController.class)
            .addItem(null, null))
            .withRel("addItem").withType("POST"));

        dto.add(linkTo(methodOn(CartController.class)
            .clear(null))
            .withRel("clear").withType("DELETE"));
    }

    private void addHateoasLinks(CartItemDTO dto) {
        if (dto.getId() == null) return;

        dto.add(linkTo(methodOn(CartController.class)
            .updateItem(null, dto.getId(), null))
            .withRel("update").withType("PUT"));

        dto.add(linkTo(methodOn(CartController.class)
            .removeItem(null, dto.getId()))
            .withRel("delete").withType("DELETE"));
    }
}
