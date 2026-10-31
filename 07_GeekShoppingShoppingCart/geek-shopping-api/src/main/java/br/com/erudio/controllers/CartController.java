package br.com.erudio.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.erudio.controllers.docs.CartControllerDocs;
import br.com.erudio.data.dto.CartDTO;
import br.com.erudio.data.dto.request.CartItemQuantityRequestDTO;
import br.com.erudio.data.dto.request.CartItemRequestDTO;
import br.com.erudio.services.CartService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/cart/v1")
@Tag(name = "Cart", description = "Endpoints for Managing the Shopping Cart")
public class CartController implements CartControllerDocs {

    @Autowired
    private CartService service;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public CartDTO find(@RequestHeader("X-Cart-Token") String token) {
        return service.find(token);
    }

    @DeleteMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ResponseEntity<?> clear(@RequestHeader("X-Cart-Token") String token) {
        service.clear(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(
            value = "/items",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public CartDTO addItem(
            @RequestHeader("X-Cart-Token") String token,
            @RequestBody CartItemRequestDTO item) {
        return service.addItem(token, item);
    }

    @PutMapping(
            value = "/items/{itemId}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public CartDTO updateItem(
            @RequestHeader("X-Cart-Token") String token,
            @PathVariable("itemId") Long itemId,
            @RequestBody CartItemQuantityRequestDTO item) {
        return service.updateItem(token, itemId, item);
    }

    @DeleteMapping(value = "/items/{itemId}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ResponseEntity<?> removeItem(
            @RequestHeader("X-Cart-Token") String token,
            @PathVariable("itemId") Long itemId) {
        service.removeItem(token, itemId);
        return ResponseEntity.noContent().build();
    }
}
