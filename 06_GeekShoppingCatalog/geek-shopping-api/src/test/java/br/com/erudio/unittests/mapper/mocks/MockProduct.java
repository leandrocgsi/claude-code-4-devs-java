package br.com.erudio.unittests.mapper.mocks;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import br.com.erudio.data.dto.request.ProductRequestDTO;
import br.com.erudio.model.Product;

public class MockProduct {

    public static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 10, 1, 10, 0);

    public Product mockEntity(Integer number) {
        Product product = new Product();
        product.setId(number.longValue());
        product.setName("Some Name" + number);
        product.setDescription("Some Description" + number);
        product.setPrice(new BigDecimal("25.00"));
        product.setOldPrice(new BigDecimal("30.00"));
        product.setCategory("Some Category" + number);
        product.setQuantity(10);
        product.setFeatured(false);
        product.setCreatedAt(CREATED_AT);
        product.setColor("Black");
        product.setSize("M");
        product.setPopularity(5);
        product.setRating(null);
        product.setReviewCount(0);
        return product;
    }

    public Product mockEntityWithImage(Integer number, String contentType, Integer size) {
        Product product = mockEntity(number);
        product.setImageContentType(contentType);
        product.setImageSize(size);
        return product;
    }

    public ProductRequestDTO mockRequest(Integer number) {
        ProductRequestDTO product = new ProductRequestDTO();
        product.setId(number.longValue());
        product.setName("Some Name" + number);
        product.setDescription("Some Description" + number);
        product.setPrice(new BigDecimal("25.00"));
        product.setOldPrice(new BigDecimal("30.00"));
        product.setCategory("Some Category" + number);
        product.setQuantity(10);
        product.setColor("Black");
        product.setSize("M");
        product.setFeatured(false);
        return product;
    }

    public List<Product> mockEntityList() {
        List<Product> products = new ArrayList<>();
        for (int i = 0; i < 14; i++) {
            products.add(mockEntity(i));
        }
        return products;
    }
}
