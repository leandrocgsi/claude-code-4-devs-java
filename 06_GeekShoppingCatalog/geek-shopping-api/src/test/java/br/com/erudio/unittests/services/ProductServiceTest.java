package br.com.erudio.unittests.services;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.AdditionalMatchers.aryEq;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import br.com.erudio.data.dto.ProductDTO;
import br.com.erudio.data.dto.request.ProductFilter;
import br.com.erudio.exception.BadRequestException;
import br.com.erudio.exception.InvalidImageException;
import br.com.erudio.exception.RequiredObjectIsNullException;
import br.com.erudio.exception.ResourceNotFoundException;
import br.com.erudio.model.Product;
import br.com.erudio.model.ProductImage;
import br.com.erudio.repositories.ProductImageRepository;
import br.com.erudio.repositories.ProductRepository;
import br.com.erudio.services.ProductService;
import br.com.erudio.unittests.mapper.mocks.MockProduct;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    private static final int FIVE_MEGABYTES = 5 * 1024 * 1024;
    private static final BigDecimal MAX_FILTER_PRICE = new BigDecimal("1000000000000");

    private MockProduct input;

    @InjectMocks
    private ProductService service;

    @Mock
    private ProductRepository repository;

    @Mock
    private ProductImageRepository imageRepository;

    @Mock
    private PagedResourcesAssembler<ProductDTO> assembler;

    @Captor
    private ArgumentCaptor<Product> productCaptor;

    @Captor
    private ArgumentCaptor<Pageable> pageableCaptor;

    @Captor
    private ArgumentCaptor<Page<ProductDTO>> pageCaptor;

    @Captor
    private ArgumentCaptor<Link> linkCaptor;

    @BeforeEach
    void setUp() {
        input = new MockProduct();
    }

    private static byte[] jpegBytes(int length) {
        var bytes = new byte[length];
        bytes[0] = (byte) 0xFF;
        bytes[1] = (byte) 0xD8;
        bytes[2] = (byte) 0xFF;
        return bytes;
    }

    private static MockMultipartFile jpegFile(byte[] bytes) {
        return new MockMultipartFile("image", "photo.jpg", "image/jpeg", bytes);
    }

    private static List<Object[]> rows(Object[]... values) {
        return Arrays.asList(values);
    }

    private static ProductFilter noFilter() {
        return new ProductFilter(null, null, null, null, null, null, false);
    }

    private static boolean hasLink(ProductDTO dto, String rel, String hrefPart, String type, boolean exactEnd) {
        return dto.getLinks().stream().anyMatch(link ->
                link.getRel().value().equals(rel) &&
                (exactEnd ? link.getHref().endsWith(hrefPart) : link.getHref().contains(hrefPart)) &&
                link.getType().equals(type));
    }

    private void stubSave(Long assignedId) {
        when(repository.save(any(Product.class))).thenAnswer(invocation -> {
            Product saved = invocation.getArgument(0);
            if (assignedId != null) saved.setId(assignedId);
            return saved;
        });
    }

    private PagedModel<EntityModel<ProductDTO>> stubSearchAndAssembler(List<Product> products) {
        when(repository.search(
                anyString(), anyString(), any(BigDecimal.class), any(BigDecimal.class),
                anyInt(), anyList(), anyInt(), anyList(), anyBoolean(), any(Pageable.class)))
            .thenReturn(new PageImpl<>(products));
        PagedModel<EntityModel<ProductDTO>> model = PagedModel.of(
                List.of(), new PagedModel.PageMetadata(12, 0, products.size(), 1));
        when(assembler.toModel(any(Page.class), any(Link.class))).thenReturn(model);
        return model;
    }

    private Pageable searchedPageable(boolean featuredOnly) {
        verify(repository).search(
                eq("%"), eq(""), eq(BigDecimal.ZERO), eq(MAX_FILTER_PRICE),
                eq(0), eq(List.of("")), eq(0), eq(List.of("")), eq(featuredOnly), pageableCaptor.capture());
        return pageableCaptor.getValue();
    }

    @Test
    @DisplayName("RN-20 findById returns the product with its fields")
    void findById() {
        when(repository.getById(1L)).thenReturn(input.mockEntity(1));

        var result = service.findById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Some Name1", result.getName());
        assertEquals("Some Description1", result.getDescription());
        assertEquals(new BigDecimal("25.00"), result.getPrice());
        assertEquals("Some Category1", result.getCategory());
        assertEquals(10, result.getQuantity());
        assertNull(result.getRating());
        assertEquals(0, result.getReviewCount());
        verify(repository, times(1)).getById(1L);
    }

    @Test
    @DisplayName("RN-5 findById derives the imageUrl when the product has an image")
    void findByIdDerivesTheImageUrlWhenThereIsAnImage() {
        when(repository.getById(3L)).thenReturn(input.mockEntityWithImage(3, "image/jpeg", 2048));

        var result = service.findById(3L);

        assertEquals("/api/product/v1/3/image", result.getImageUrl());
    }

    @Test
    @DisplayName("RN-5 findById leaves the imageUrl null when the product has no image")
    void findByIdLeavesTheImageUrlNullWithoutImage() {
        when(repository.getById(1L)).thenReturn(input.mockEntity(1));

        var result = service.findById(1L);

        assertNull(result.getImageUrl());
    }

    @Test
    @DisplayName("RN-20 findById adds the HATEOAS links, with the image link only when there is an image")
    void findByIdAddsTheLinks() {
        when(repository.getById(1L)).thenReturn(input.mockEntityWithImage(1, "image/png", 10));

        var result = service.findById(1L);

        assertNotNull(result.getLinks());
        assertTrue(hasLink(result, "self", "/api/product/v1/1", "GET", true));
        assertTrue(hasLink(result, "findAll", "/api/product/v1", "GET", false));
        assertTrue(hasLink(result, "create", "/api/product/v1", "POST", true));
        assertTrue(hasLink(result, "update", "/api/product/v1", "PUT", true));
        assertTrue(hasLink(result, "delete", "/api/product/v1/1", "DELETE", true));
        assertTrue(hasLink(result, "image", "/api/product/v1/1/image", "GET", true));
    }

    @Test
    @DisplayName("RN-5 findById does not add the image link without an image")
    void findByIdDoesNotAddTheImageLinkWithoutImage() {
        when(repository.getById(1L)).thenReturn(input.mockEntity(1));

        var result = service.findById(1L);

        assertFalse(result.getLinks().stream().anyMatch(link -> link.getRel().value().equals("image")));
    }

    @Test
    @DisplayName("RN-20 findById throws ResourceNotFoundException when the product does not exist")
    void findByIdThrowsWhenTheProductDoesNotExist() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        when(repository.getById(99L)).thenCallRealMethod();

        assertThrows(ResourceNotFoundException.class, () -> service.findById(99L));
    }

    @Test
    @DisplayName("RN-1 RN-3 RN-20 create applies the server values and ignores the client id")
    void createAppliesTheServerValues() {
        var idReceivedBySave = new AtomicReference<Long>(-1L);
        when(repository.save(any(Product.class))).thenAnswer(invocation -> {
            Product received = invocation.getArgument(0);
            idReceivedBySave.set(received.getId());
            received.setId(7L);
            return received;
        });
        var request = input.mockRequest(1);

        var before = LocalDateTime.now();
        var result = service.create(request, null);
        var after = LocalDateTime.now();

        verify(repository, times(1)).save(productCaptor.capture());
        var saved = productCaptor.getValue();
        assertNull(idReceivedBySave.get());
        assertEquals("Some Name1", saved.getName());
        assertEquals(new BigDecimal("25.00"), saved.getPrice());
        assertEquals(new BigDecimal("30.00"), saved.getOldPrice());
        assertEquals(0, saved.getPopularity());
        assertNull(saved.getRating());
        assertEquals(0, saved.getReviewCount());
        assertFalse(saved.getCreatedAt().isBefore(before));
        assertFalse(saved.getCreatedAt().isAfter(after));
        assertEquals(7L, result.getId());
    }

    @Test
    @DisplayName("RN-2 create defaults featured to false when it is not informed")
    void createDefaultsFeaturedToFalse() {
        stubSave(7L);
        var request = input.mockRequest(1);
        request.setFeatured(null);

        service.create(request, null);

        verify(repository).save(productCaptor.capture());
        assertEquals(false, productCaptor.getValue().getFeatured());
    }

    @Test
    @DisplayName("RN-2 create keeps featured true when it is informed")
    void createKeepsFeaturedTrue() {
        stubSave(7L);
        var request = input.mockRequest(1);
        request.setFeatured(true);

        service.create(request, null);

        verify(repository).save(productCaptor.capture());
        assertEquals(true, productCaptor.getValue().getFeatured());
    }

    @Test
    @DisplayName("RN-1 RN-4 create stores the image bytes, type and size")
    void createStoresTheImage() {
        stubSave(7L);
        var bytes = jpegBytes(64);

        var result = service.create(input.mockRequest(1), jpegFile(bytes));

        verify(repository).save(productCaptor.capture());
        assertEquals("image/jpeg", productCaptor.getValue().getImageContentType());
        assertEquals(64, productCaptor.getValue().getImageSize());
        verify(imageRepository, times(1)).updateImage(eq(7L), aryEq(bytes));
        assertEquals("/api/product/v1/7/image", result.getImageUrl());
    }

    @Test
    @DisplayName("RN-1 create saves the product before writing the image")
    void createSavesTheProductBeforeTheImage() {
        stubSave(7L);

        service.create(input.mockRequest(1), jpegFile(jpegBytes(64)));

        var order = inOrder(repository, imageRepository);
        order.verify(repository).save(any(Product.class));
        order.verify(imageRepository).updateImage(eq(7L), any(byte[].class));
    }

    @Test
    @DisplayName("RN-4 create without image does not touch the image repository")
    void createWithoutImage() {
        stubSave(7L);

        var result = service.create(input.mockRequest(1), null);

        verifyNoInteractions(imageRepository);
        assertNull(result.getImageUrl());
        verify(repository).save(productCaptor.capture());
        assertNull(productCaptor.getValue().getImageSize());
        assertNull(productCaptor.getValue().getImageContentType());
    }

    @Test
    @DisplayName("RN-4 create treats an empty image part as no image")
    void createWithAnEmptyImagePart() {
        stubSave(7L);

        service.create(input.mockRequest(1), jpegFile(new byte[0]));

        verifyNoInteractions(imageRepository);
        verify(repository).save(productCaptor.capture());
        assertNull(productCaptor.getValue().getImageSize());
    }

    @Test
    @DisplayName("RN-4 create accepts an image of exactly 5 MB")
    void createAcceptsAnImageOfExactlyFiveMegabytes() {
        stubSave(7L);

        assertDoesNotThrow(() -> service.create(input.mockRequest(1), jpegFile(jpegBytes(FIVE_MEGABYTES))));

        verify(imageRepository).updateImage(eq(7L), any(byte[].class));
    }

    @Test
    @DisplayName("RN-4 create rejects an image larger than 5 MB without reading it")
    void createRejectsAnImageLargerThanFiveMegabytes() throws IOException {
        MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
        when(file.getSize()).thenReturn(FIVE_MEGABYTES + 1L);
        var request = input.mockRequest(1);

        var exception = assertThrows(InvalidImageException.class, () -> service.create(request, file));

        assertTrue(exception.getMessage().contains("5 MB"));
        verify(file, never()).getBytes();
        verifyNoInteractions(repository, imageRepository);
    }

    @Test
    @DisplayName("RN-4 create rejects content that is not an accepted image")
    void createRejectsAnUnsupportedType() {
        var notAnImage = new MockMultipartFile("image", "photo.jpg", "image/jpeg", "this is just text, not an image".getBytes());
        var request = input.mockRequest(1);

        var exception = assertThrows(InvalidImageException.class, () -> service.create(request, notAnImage));

        assertTrue(exception.getMessage().contains("JPEG, PNG, WebP or GIF"));
        verifyNoInteractions(repository, imageRepository);
    }

    @Test
    @DisplayName("RN-4 create rejects an image that cannot be read")
    void createRejectsAnImageThatCannotBeRead() throws IOException {
        MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
        when(file.getSize()).thenReturn(10L);
        when(file.getBytes()).thenThrow(new IOException("disk failure"));
        var request = input.mockRequest(1);

        var exception = assertThrows(InvalidImageException.class, () -> service.create(request, file));

        assertTrue(exception.getMessage().contains("could not be read"));
        verifyNoInteractions(repository, imageRepository);
    }

    @Test
    @DisplayName("RN-2 create throws RequiredObjectIsNullException on null input")
    void createThrowsOnNullInput() {
        assertThrows(RequiredObjectIsNullException.class, () -> service.create(null, null));

        verifyNoInteractions(repository, imageRepository);
    }

    @Test
    @DisplayName("RN-20 update changes the editable fields and returns the product")
    void update() {
        var entity = input.mockEntity(1);
        when(repository.getById(1L)).thenReturn(entity);
        stubSave(null);
        var request = input.mockRequest(1);
        request.setName("Updated");
        request.setPrice(new BigDecimal("40.00"));
        request.setOldPrice(null);
        request.setCategory("Updated Category");
        request.setQuantity(0);
        request.setColor("Red");
        request.setSize("XL");
        request.setFeatured(true);

        var result = service.update(request, null);

        assertEquals("Updated", result.getName());
        assertEquals(new BigDecimal("40.00"), result.getPrice());
        assertNull(result.getOldPrice());
        assertEquals("Updated Category", result.getCategory());
        assertEquals(0, result.getQuantity());
        assertEquals("Red", result.getColor());
        assertEquals("XL", result.getSize());
        assertEquals(true, result.getFeatured());
        verify(repository, times(1)).save(entity);
    }

    @Test
    @DisplayName("RN-3 update never changes the server fields")
    void updateKeepsTheServerFields() {
        var entity = input.mockEntity(1);
        entity.setPopularity(9);
        entity.setRating(new BigDecimal("4.50"));
        entity.setReviewCount(3);
        when(repository.getById(1L)).thenReturn(entity);
        stubSave(null);

        var result = service.update(input.mockRequest(1), null);

        assertEquals(MockProduct.CREATED_AT, result.getCreatedAt());
        assertEquals(9, result.getPopularity());
        assertEquals(new BigDecimal("4.50"), result.getRating());
        assertEquals(3, result.getReviewCount());
    }

    @Test
    @DisplayName("RN-2 update sets featured to false when it is not informed")
    void updateDefaultsFeaturedToFalse() {
        var entity = input.mockEntity(1);
        entity.setFeatured(true);
        when(repository.getById(1L)).thenReturn(entity);
        stubSave(null);
        var request = input.mockRequest(1);
        request.setFeatured(null);

        var result = service.update(request, null);

        assertEquals(false, result.getFeatured());
    }

    @Test
    @DisplayName("RN-4 update without the image part keeps the current image")
    void updateWithoutImageKeepsTheCurrentImage() {
        var entity = input.mockEntityWithImage(1, "image/png", 100);
        when(repository.getById(1L)).thenReturn(entity);
        stubSave(null);

        var result = service.update(input.mockRequest(1), null);

        assertEquals("image/png", entity.getImageContentType());
        assertEquals(100, entity.getImageSize());
        assertEquals("/api/product/v1/1/image", result.getImageUrl());
        verifyNoInteractions(imageRepository);
    }

    @Test
    @DisplayName("RN-4 update with the image part replaces the image")
    void updateWithImageReplacesTheImage() {
        var entity = input.mockEntityWithImage(1, "image/png", 100);
        when(repository.getById(1L)).thenReturn(entity);
        stubSave(null);
        var bytes = jpegBytes(32);

        service.update(input.mockRequest(1), jpegFile(bytes));

        assertEquals("image/jpeg", entity.getImageContentType());
        assertEquals(32, entity.getImageSize());
        verify(imageRepository, times(1)).updateImage(eq(1L), aryEq(bytes));
    }

    @Test
    @DisplayName("RN-4 update with an image on a product that had none sets the imageUrl")
    void updateWithImageOnAProductWithoutImage() {
        when(repository.getById(1L)).thenReturn(input.mockEntity(1));
        stubSave(null);

        var result = service.update(input.mockRequest(1), jpegFile(jpegBytes(32)));

        assertEquals("/api/product/v1/1/image", result.getImageUrl());
    }

    @Test
    @DisplayName("RN-4 update rejects an unsupported image without saving")
    void updateRejectsAnUnsupportedImage() {
        var notAnImage = new MockMultipartFile("image", "photo.png", "image/png", "plain text content here".getBytes());
        var request = input.mockRequest(1);

        assertThrows(InvalidImageException.class, () -> service.update(request, notAnImage));

        verifyNoInteractions(repository, imageRepository);
    }

    @Test
    @DisplayName("RN-20 update throws RequiredObjectIsNullException on null input")
    void updateThrowsOnNullInput() {
        assertThrows(RequiredObjectIsNullException.class, () -> service.update(null, null));

        verifyNoInteractions(repository, imageRepository);
    }

    @Test
    @DisplayName("RN-20 update throws BadRequestException when the id is missing")
    void updateThrowsWhenTheIdIsMissing() {
        var request = input.mockRequest(1);
        request.setId(null);

        assertThrows(BadRequestException.class, () -> service.update(request, null));

        verifyNoInteractions(repository, imageRepository);
    }

    @Test
    @DisplayName("RN-20 update throws ResourceNotFoundException when the product does not exist")
    void updateThrowsWhenTheProductDoesNotExist() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        when(repository.getById(99L)).thenCallRealMethod();
        var request = input.mockRequest(99);

        assertThrows(ResourceNotFoundException.class, () -> service.update(request, null));

        verify(repository, never()).save(any(Product.class));
        verifyNoInteractions(imageRepository);
    }

    @Test
    @DisplayName("RN-20 delete removes the product")
    void delete() {
        var entity = input.mockEntity(1);
        when(repository.getById(1L)).thenReturn(entity);

        assertDoesNotThrow(() -> service.delete(1L));

        verify(repository, times(1)).delete(entity);
    }

    @Test
    @DisplayName("RN-20 delete throws ResourceNotFoundException when the product does not exist")
    void deleteThrowsWhenTheProductDoesNotExist() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        when(repository.getById(99L)).thenCallRealMethod();

        assertThrows(ResourceNotFoundException.class, () -> service.delete(99L));

        verify(repository, never()).delete(any(Product.class));
    }

    @Test
    @DisplayName("RN-5 findImage returns the bytes and the stored type")
    void findImage() {
        var image = new ProductImage();
        image.setId(1L);
        image.setImage(jpegBytes(16));
        image.setContentType("image/jpeg");
        when(imageRepository.findById(1L)).thenReturn(Optional.of(image));

        var result = service.findImage(1L);

        assertSame(image, result);
    }

    @Test
    @DisplayName("RN-5 findImage throws ResourceNotFoundException when the product does not exist")
    void findImageThrowsWhenTheProductDoesNotExist() {
        when(imageRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.findImage(99L));
    }

    @Test
    @DisplayName("RN-5 findImage throws ResourceNotFoundException when the product has no image")
    void findImageThrowsWhenTheProductHasNoImage() {
        var image = new ProductImage();
        image.setId(1L);
        image.setImage(null);
        when(imageRepository.findById(1L)).thenReturn(Optional.of(image));

        assertThrows(ResourceNotFoundException.class, () -> service.findImage(1L));
    }

    @Test
    @DisplayName("RN-9 findAll builds the paged model with the links of each item")
    void findAll() {
        var model = stubSearchAndAssembler(List.of(
                input.mockEntity(1),
                input.mockEntityWithImage(2, "image/jpeg", 50)));

        var result = service.findAll(0, 12, "asc", "name", noFilter());

        assertSame(model, result);
        verify(assembler).toModel(pageCaptor.capture(), linkCaptor.capture());
        var items = pageCaptor.getValue().getContent();
        assertEquals(2, items.size());
        assertEquals("Some Name1", items.get(0).getName());
        assertNull(items.get(0).getImageUrl());
        assertEquals("/api/product/v1/2/image", items.get(1).getImageUrl());
        assertTrue(hasLink(items.get(0), "self", "/api/product/v1/1", "GET", true));
        assertTrue(hasLink(items.get(1), "self", "/api/product/v1/2", "GET", true));
        assertEquals("self", linkCaptor.getValue().getRel().value());
        assertTrue(linkCaptor.getValue().getHref().contains("/api/product/v1"));
    }

    @Test
    @DisplayName("RN-9 findAll keeps the requested page and size")
    void findAllKeepsThePageAndSize() {
        stubSearchAndAssembler(List.of());

        service.findAll(2, 24, "asc", "name", noFilter());

        var pageable = searchedPageable(false);
        assertEquals(2, pageable.getPageNumber());
        assertEquals(24, pageable.getPageSize());
    }

    @ParameterizedTest(name = "RN-9 findAll sorts by {0}")
    @ValueSource(strings = {"name", "price", "createdAt", "popularity"})
    void findAllSortsByTheAllowedFields(String sortBy) {
        stubSearchAndAssembler(List.of());

        service.findAll(0, 12, "asc", sortBy, noFilter());

        var orders = searchedPageable(false).getSort().toList();
        assertEquals(2, orders.size());
        assertEquals(sortBy, orders.get(0).getProperty());
        assertEquals(Sort.Direction.ASC, orders.get(0).getDirection());
        assertEquals(Sort.NullHandling.NATIVE, orders.get(0).getNullHandling());
        assertEquals("id", orders.get(1).getProperty());
        assertEquals(Sort.Direction.ASC, orders.get(1).getDirection());
    }

    @Test
    @DisplayName("RN-9 findAll puts the products without rating at the end when sorting by rating")
    void findAllSortsByRatingWithNullsLast() {
        stubSearchAndAssembler(List.of());

        service.findAll(0, 12, "desc", "rating", noFilter());

        var orders = searchedPageable(false).getSort().toList();
        assertEquals("rating", orders.get(0).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(0).getDirection());
        assertEquals(Sort.NullHandling.NULLS_LAST, orders.get(0).getNullHandling());
        assertEquals("id", orders.get(1).getProperty());
    }

    @ParameterizedTest(name = "RN-9 findAll accepts the direction {0}")
    @ValueSource(strings = {"asc", "ASC", "desc", "DESC", "Desc"})
    void findAllAcceptsTheDirectionIgnoringCase(String direction) {
        stubSearchAndAssembler(List.of());

        service.findAll(0, 12, direction, "name", noFilter());

        var order = searchedPageable(false).getSort().toList().get(0);
        var expected = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        assertEquals(expected, order.getDirection());
    }

    @ParameterizedTest(name = "RN-9 findAll rejects sortBy {0}")
    @ValueSource(strings = {"id", "category", "unknown", "", "Name", "created_at"})
    void findAllRejectsAnInvalidSortBy(String sortBy) {
        var filter = noFilter();

        var exception = assertThrows(BadRequestException.class, () -> service.findAll(0, 12, "asc", sortBy, filter));

        assertTrue(exception.getMessage().contains("sortBy"));
        verifyNoInteractions(repository);
    }

    @ParameterizedTest(name = "RN-9 findAll rejects direction {0}")
    @ValueSource(strings = {"up", "", "ascending", "descc"})
    void findAllRejectsAnInvalidDirection(String direction) {
        var filter = noFilter();

        var exception = assertThrows(BadRequestException.class, () -> service.findAll(0, 12, direction, "name", filter));

        assertTrue(exception.getMessage().contains("direction"));
        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("RN-10 findAll rejects minPrice greater than maxPrice")
    void findAllRejectsMinPriceGreaterThanMaxPrice() {
        var filter = new ProductFilter(null, null, new BigDecimal("100"), new BigDecimal("99.99"), null, null, false);

        var exception = assertThrows(BadRequestException.class, () -> service.findAll(0, 12, "asc", "name", filter));

        assertTrue(exception.getMessage().contains("minPrice"));
        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("RN-10 findAll accepts minPrice equal to maxPrice")
    void findAllAcceptsMinPriceEqualToMaxPrice() {
        stubSearchAndAssembler(List.of());
        var filter = new ProductFilter(null, null, new BigDecimal("50"), new BigDecimal("50"), null, null, false);

        assertDoesNotThrow(() -> service.findAll(0, 12, "asc", "name", filter));
    }

    @Test
    @DisplayName("RN-10 findAll without filters searches everything")
    void findAllWithoutFilters() {
        stubSearchAndAssembler(List.of());

        service.findAll(0, 12, "asc", "name", noFilter());

        verify(repository).search(
                eq("%"), eq(""), eq(BigDecimal.ZERO), eq(MAX_FILTER_PRICE),
                eq(0), eq(List.of("")), eq(0), eq(List.of("")), eq(false), any(Pageable.class));
    }

    @Test
    @DisplayName("RN-10 findAll passes every filter to the repository")
    void findAllPassesTheFilters() {
        stubSearchAndAssembler(List.of());
        var filter = new ProductFilter(
                "mug", " Caneca ", new BigDecimal("10.00"), new BigDecimal("99.90"),
                List.of("Black", "Red"), List.of("M"), true);

        service.findAll(0, 12, "asc", "name", filter);

        verify(repository).search(
                eq("%mug%"), eq("Caneca"), eq(new BigDecimal("10.00")), eq(new BigDecimal("99.90")),
                eq(2), eq(List.of("Black", "Red")), eq(1), eq(List.of("M")), eq(true), any(Pageable.class));
    }

    @Test
    @DisplayName("RN-10 findAll lowercases q so the search ignores case")
    void findAllLowercasesTheQuery() {
        stubSearchAndAssembler(List.of());
        var filter = new ProductFilter("CaNeCa", null, null, null, null, null, false);

        service.findAll(0, 12, "asc", "name", filter);

        verify(repository).search(
                eq("%caneca%"), anyString(), any(BigDecimal.class), any(BigDecimal.class),
                anyInt(), anyList(), anyInt(), anyList(), anyBoolean(), any(Pageable.class));
    }

    @Test
    @DisplayName("RN-10 findAll treats % _ and ! in q as literal text")
    void findAllEscapesTheWildcardsOfTheQuery() {
        stubSearchAndAssembler(List.of());
        var filter = new ProductFilter(" 50%_Off! ", null, null, null, null, null, false);

        service.findAll(0, 12, "asc", "name", filter);

        verify(repository).search(
                eq("%50!%!_off!!%"), anyString(), any(BigDecimal.class), any(BigDecimal.class),
                anyInt(), anyList(), anyInt(), anyList(), anyBoolean(), any(Pageable.class));
    }

    @Test
    @DisplayName("RN-10 findAll treats a blank q as no search")
    void findAllTreatsABlankQueryAsNoSearch() {
        stubSearchAndAssembler(List.of());
        var filter = new ProductFilter("   ", null, null, null, null, null, false);

        service.findAll(0, 12, "asc", "name", filter);

        verify(repository).search(
                eq("%"), anyString(), any(BigDecimal.class), any(BigDecimal.class),
                anyInt(), anyList(), anyInt(), anyList(), anyBoolean(), any(Pageable.class));
    }

    @Test
    @DisplayName("RN-10 findAll treats empty color and size lists as no filter")
    void findAllTreatsEmptyListsAsNoFilter() {
        stubSearchAndAssembler(List.of());
        var filter = new ProductFilter(null, null, null, null, new ArrayList<>(), new ArrayList<>(), false);

        service.findAll(0, 12, "asc", "name", filter);

        verify(repository).search(
                anyString(), anyString(), any(BigDecimal.class), any(BigDecimal.class),
                eq(0), eq(List.of("")), eq(0), eq(List.of("")), anyBoolean(), any(Pageable.class));
    }

    @Test
    @DisplayName("RN-13 findFeatured searches only featured products, most popular first")
    void findFeatured() {
        var model = stubSearchAndAssembler(List.of(input.mockEntity(1)));

        var result = service.findFeatured(0, 6);

        assertSame(model, result);
        var pageable = searchedPageable(true);
        assertEquals(6, pageable.getPageSize());
        var orders = pageable.getSort().toList();
        assertEquals("popularity", orders.get(0).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(0).getDirection());
        assertEquals("id", orders.get(1).getProperty());
        assertEquals(Sort.Direction.ASC, orders.get(1).getDirection());
        verify(assembler).toModel(pageCaptor.capture(), linkCaptor.capture());
        assertTrue(hasLink(pageCaptor.getValue().getContent().get(0), "self", "/api/product/v1/1", "GET", true));
        assertEquals("self", linkCaptor.getValue().getRel().value());
        assertTrue(linkCaptor.getValue().getHref().contains("/api/product/v1/featured"));
    }

    @Test
    @DisplayName("RN-13 findRecent searches all products, newest first")
    void findRecent() {
        var model = stubSearchAndAssembler(List.of(input.mockEntity(1)));

        var result = service.findRecent(1, 8);

        assertSame(model, result);
        var pageable = searchedPageable(false);
        assertEquals(1, pageable.getPageNumber());
        assertEquals(8, pageable.getPageSize());
        var orders = pageable.getSort().toList();
        assertEquals("createdAt", orders.get(0).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(0).getDirection());
        assertEquals("id", orders.get(1).getProperty());
        assertEquals(Sort.Direction.DESC, orders.get(1).getDirection());
        verify(assembler).toModel(any(Page.class), linkCaptor.capture());
        assertTrue(linkCaptor.getValue().getHref().contains("/api/product/v1/recent"));
    }

    private void stubFacetRows(
            List<Object[]> prices, List<Object[]> colors, List<Object[]> sizes, List<Object[]> categories) {
        when(repository.countByPriceBucket(
                anyString(), anyString(), any(BigDecimal.class), any(BigDecimal.class),
                anyInt(), anyList(), anyInt(), anyList(), anyBoolean())).thenReturn(prices);
        when(repository.countByColor(
                anyString(), anyString(), any(BigDecimal.class), any(BigDecimal.class),
                anyInt(), anyList(), anyInt(), anyList(), anyBoolean())).thenReturn(colors);
        when(repository.countBySize(
                anyString(), anyString(), any(BigDecimal.class), any(BigDecimal.class),
                anyInt(), anyList(), anyInt(), anyList(), anyBoolean())).thenReturn(sizes);
        when(repository.countByCategoryFiltered(
                anyString(), anyString(), any(BigDecimal.class), any(BigDecimal.class),
                anyInt(), anyList(), anyInt(), anyList(), anyBoolean())).thenReturn(categories);
    }

    @Test
    @DisplayName("RN-11 findFacets always returns the six price ranges, the last one open")
    void findFacetsReturnsTheSixPriceRanges() {
        stubFacetRows(List.of(), List.of(), List.of(), List.of());

        var result = service.findFacets(noFilter());

        var ranges = result.priceRanges();
        assertEquals(6, ranges.size());
        for (int i = 0; i < 5; i++) {
            assertEquals(i * 100, ranges.get(i).min());
            assertEquals((i + 1) * 100, ranges.get(i).max());
            assertEquals(0L, ranges.get(i).count());
        }
        assertEquals(500, ranges.get(5).min());
        assertNull(ranges.get(5).max());
        assertEquals(0L, ranges.get(5).count());
    }

    @Test
    @DisplayName("RN-11 findFacets groups the products by price range and folds the high buckets into the open one")
    void findFacetsCountsThePriceRanges() {
        List<Object[]> buckets = rows(
                new Object[] {0, 3L},
                new Object[] {new BigDecimal("1"), 2L},
                new Object[] {5L, 1L},
                new Object[] {7, new BigDecimal("4")});
        stubFacetRows(buckets, List.of(), List.of(), List.of());

        var ranges = service.findFacets(noFilter()).priceRanges();

        assertEquals(3L, ranges.get(0).count());
        assertEquals(2L, ranges.get(1).count());
        assertEquals(0L, ranges.get(2).count());
        assertEquals(0L, ranges.get(3).count());
        assertEquals(0L, ranges.get(4).count());
        assertEquals(5L, ranges.get(5).count());
    }

    @Test
    @DisplayName("RN-11 findFacets returns colors, sizes and categories with their counts")
    void findFacetsCountsColorsSizesAndCategories() {
        stubFacetRows(
                List.of(),
                rows(new Object[] {"Black", 4L}, new Object[] {"Red", 1L}),
                rows(new Object[] {"M", 3L}),
                rows(new Object[] {"Caneca", 2L}, new Object[] {"Livro", new BigDecimal("5")}));

        var result = service.findFacets(noFilter());

        assertEquals(2, result.colors().size());
        assertEquals("Black", result.colors().get(0).name());
        assertEquals(4L, result.colors().get(0).count());
        assertEquals("Red", result.colors().get(1).name());
        assertEquals(1, result.sizes().size());
        assertEquals("M", result.sizes().get(0).name());
        assertEquals(3L, result.sizes().get(0).count());
        assertEquals(2, result.categories().size());
        assertEquals("Livro", result.categories().get(1).name());
        assertEquals(5L, result.categories().get(1).count());
    }

    @Test
    @DisplayName("RN-11 findFacets applies the same filter normalization as the listing")
    void findFacetsAppliesTheFilters() {
        stubFacetRows(List.of(), List.of(), List.of(), List.of());
        var filter = new ProductFilter("50%", "Caneca", null, null, List.of("Red"), null, true);

        service.findFacets(filter);

        verify(repository).countByPriceBucket(
                eq("%50!%%"), eq("Caneca"), eq(BigDecimal.ZERO), eq(MAX_FILTER_PRICE),
                eq(1), eq(List.of("Red")), eq(0), eq(List.of("")), eq(true));
        verify(repository).countByColor(
                eq("%50!%%"), eq("Caneca"), eq(BigDecimal.ZERO), eq(MAX_FILTER_PRICE),
                eq(1), eq(List.of("Red")), eq(0), eq(List.of("")), eq(true));
        verify(repository).countBySize(
                eq("%50!%%"), eq("Caneca"), eq(BigDecimal.ZERO), eq(MAX_FILTER_PRICE),
                eq(1), eq(List.of("Red")), eq(0), eq(List.of("")), eq(true));
        verify(repository).countByCategoryFiltered(
                eq("%50!%%"), eq("Caneca"), eq(BigDecimal.ZERO), eq(MAX_FILTER_PRICE),
                eq(1), eq(List.of("Red")), eq(0), eq(List.of("")), eq(true));
    }

    @Test
    @DisplayName("RN-10 findFacets rejects minPrice greater than maxPrice")
    void findFacetsRejectsMinPriceGreaterThanMaxPrice() {
        var filter = new ProductFilter(null, null, new BigDecimal("10"), new BigDecimal("5"), null, null, false);

        assertThrows(BadRequestException.class, () -> service.findFacets(filter));

        verifyNoInteractions(repository);
    }

    @Test
    @DisplayName("RN-12 findCategories derives the categories with count and image of the latest product with image")
    void findCategories() {
        when(repository.findLatestImageProductIdByCategory())
            .thenReturn(rows(new Object[] {"Caneca", 4L}, new Object[] {"Livro", new BigDecimal("9")}));
        when(repository.countProductsByCategory())
            .thenReturn(rows(new Object[] {"Caneca", 3L}, new Object[] {"Livro", 2L}));

        var result = service.findCategories();

        assertEquals(2, result.size());
        assertEquals("Caneca", result.get(0).name());
        assertEquals(3L, result.get(0).productCount());
        assertEquals("/api/product/v1/4/image", result.get(0).imageUrl());
        assertEquals("Livro", result.get(1).name());
        assertEquals(2L, result.get(1).productCount());
        assertEquals("/api/product/v1/9/image", result.get(1).imageUrl());
    }

    @Test
    @DisplayName("RN-12 findCategories leaves the imageUrl null for a category without any image")
    void findCategoriesWithoutImage() {
        when(repository.findLatestImageProductIdByCategory()).thenReturn(List.of());
        when(repository.countProductsByCategory()).thenReturn(rows(new Object[] {"Acessório", 1L}));

        var result = service.findCategories();

        assertEquals(1, result.size());
        assertEquals("Acessório", result.get(0).name());
        assertNull(result.get(0).imageUrl());
    }

    @Test
    @DisplayName("RN-12 findCategories returns an empty list when there are no products")
    void findCategoriesWithoutProducts() {
        when(repository.findLatestImageProductIdByCategory()).thenReturn(List.of());
        when(repository.countProductsByCategory()).thenReturn(List.of());

        assertTrue(service.findCategories().isEmpty());
    }
}
