package br.com.erudio.unittests.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;

import br.com.erudio.data.dto.ProductDTO;
import br.com.erudio.data.dto.request.ProductRequestDTO;
import br.com.erudio.mapper.DozerMapper;
import br.com.erudio.model.Product;
import br.com.erudio.unittests.mapper.mocks.MockProduct;

class DozerMapperTest {

    private final MockProduct input = new MockProduct();

    @Test
    void parseEntityToDTO() {
        ProductDTO output = DozerMapper.parseObject(input.mockEntity(1), ProductDTO.class);

        assertEquals(1L, output.getId());
        assertEquals("Some Name1", output.getName());
        assertEquals("Some Description1", output.getDescription());
        assertEquals(new BigDecimal("25.00"), output.getPrice());
        assertEquals(new BigDecimal("30.00"), output.getOldPrice());
        assertEquals("Some Category1", output.getCategory());
        assertEquals(10, output.getQuantity());
        assertEquals(false, output.getFeatured());
        assertEquals(MockProduct.CREATED_AT, output.getCreatedAt());
        assertEquals("Black", output.getColor());
        assertEquals("M", output.getSize());
        assertEquals(5, output.getPopularity());
        assertEquals(0, output.getReviewCount());
    }

    @Test
    void parseEntityWithoutRatingKeepsRatingNull() {
        ProductDTO output = DozerMapper.parseObject(input.mockEntity(1), ProductDTO.class);

        assertNull(output.getRating());
    }

    @Test
    void parseEntityWithRatingKeepsTheValue() {
        var entity = input.mockEntity(1);
        entity.setRating(new BigDecimal("4.50"));

        ProductDTO output = DozerMapper.parseObject(entity, ProductDTO.class);

        assertEquals(new BigDecimal("4.50"), output.getRating());
    }

    @Test
    void parseEntityDoesNotDeriveTheImageUrl() {
        var entity = input.mockEntityWithImage(1, "image/jpeg", 1024);

        ProductDTO output = DozerMapper.parseObject(entity, ProductDTO.class);

        assertNull(output.getImageUrl());
    }

    @Test
    void parseEntityListToDTOList() {
        List<ProductDTO> output = DozerMapper.parseListObjects(input.mockEntityList(), ProductDTO.class);

        assertEquals(14, output.size());
        assertEquals("Some Name7", output.get(7).getName());
        assertEquals("Some Category13", output.get(13).getCategory());
    }

    @Test
    void parseRequestToEntity() {
        Product output = DozerMapper.parseObject(input.mockRequest(1), Product.class);

        assertEquals(1L, output.getId());
        assertEquals("Some Name1", output.getName());
        assertEquals(new BigDecimal("25.00"), output.getPrice());
        assertEquals(new BigDecimal("30.00"), output.getOldPrice());
        assertEquals("Some Category1", output.getCategory());
        assertEquals(10, output.getQuantity());
        assertEquals("Black", output.getColor());
        assertEquals("M", output.getSize());
    }

    @Test
    void parseRequestToEntityLeavesTheServerFieldsEmpty() {
        Product output = DozerMapper.parseObject(input.mockRequest(1), Product.class);

        assertNull(output.getCreatedAt());
        assertNull(output.getPopularity());
        assertNull(output.getRating());
        assertNull(output.getReviewCount());
        assertNull(output.getImageContentType());
        assertNull(output.getImageSize());
    }

    @Test
    void parseRequestToEntityKeepsNullOptionalFields() {
        ProductRequestDTO request = input.mockRequest(1);
        request.setOldPrice(null);
        request.setColor(null);
        request.setSize(null);

        Product output = DozerMapper.parseObject(request, Product.class);

        assertNull(output.getOldPrice());
        assertNull(output.getColor());
        assertNull(output.getSize());
    }
}
