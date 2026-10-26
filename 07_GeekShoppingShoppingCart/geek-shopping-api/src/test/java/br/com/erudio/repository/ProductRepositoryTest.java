package br.com.erudio.repository;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import br.com.erudio.integrationtests.testcontainers.AbstractIntegrationTest;
import br.com.erudio.model.Product;
import br.com.erudio.repositories.ProductImageRepository;
import br.com.erudio.repositories.ProductRepository;
import jakarta.persistence.EntityManager;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ProductRepositoryTest extends AbstractIntegrationTest {

    private static final BigDecimal MAX_PRICE = new BigDecimal("1000000000000");
    private static final List<String> NO_VALUES = List.of("");

    @Autowired
    private ProductRepository repository;

    @Autowired
    private ProductImageRepository imageRepository;

    @Autowired
    private EntityManager entityManager;

    @BeforeEach
    void cleanSeedData() {
        repository.deleteAllInBatch();
    }

    private Product newProduct(String name, String category, String price) {
        var product = new Product();
        product.setName(name);
        product.setDescription("Description of " + name);
        product.setPrice(new BigDecimal(price));
        product.setCategory(category);
        product.setQuantity(5);
        product.setFeatured(false);
        product.setCreatedAt(LocalDateTime.of(2026, 10, 1, 10, 0));
        product.setPopularity(0);
        product.setReviewCount(0);
        return product;
    }

    private Product save(Product product) {
        return repository.saveAndFlush(product);
    }

    private Page<Product> search(
            String pattern, String category, BigDecimal min, BigDecimal max,
            List<String> colors, List<String> sizes, boolean featuredOnly, Pageable pageable) {
        var colorValues = colors.isEmpty() ? NO_VALUES : colors;
        var sizeValues = sizes.isEmpty() ? NO_VALUES : sizes;
        return repository.search(
                pattern, category, min, max,
                colors.size(), colorValues, sizes.size(), sizeValues, featuredOnly, pageable);
    }

    private Page<Product> searchByPattern(String pattern) {
        return search(pattern, "", BigDecimal.ZERO, MAX_PRICE, List.of(), List.of(), false, PageRequest.of(0, 20, Sort.by("id")));
    }

    private static List<String> names(Page<Product> page) {
        return page.getContent().stream().map(Product::getName).toList();
    }

    private static Map<String, Long> toMap(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(
                row -> (String) row[0],
                row -> ((Number) row[1]).longValue()));
    }

    @Test
    void searchWithoutFiltersReturnsEveryProduct() {
        save(newProduct("A", "Caneca", "10.00"));
        save(newProduct("B", "Livro", "20.00"));

        var result = searchByPattern("%");

        assertEquals(List.of("A", "B"), names(result));
        assertEquals(2, result.getTotalElements());
    }

    @Test
    void searchMatchesTheNameOrTheDescriptionIgnoringCase() {
        save(newProduct("Super Mug", "Caneca", "10.00"));
        var byDescription = newProduct("Cup", "Caneca", "10.00");
        byDescription.setDescription("A nice MUG for coffee");
        save(byDescription);
        save(newProduct("Book", "Livro", "10.00"));

        var result = searchByPattern("%mug%");

        assertEquals(List.of("Super Mug", "Cup"), names(result));
    }

    @Test
    void searchTreatsPercentAndUnderscoreAsLiteralWhenEscaped() {
        save(newProduct("50% Off Mug", "Caneca", "10.00"));
        save(newProduct("500 Mug", "Caneca", "10.00"));
        save(newProduct("A_B Mug", "Caneca", "10.00"));
        save(newProduct("AXB Mug", "Caneca", "10.00"));

        assertEquals(List.of("50% Off Mug"), names(searchByPattern("%50!%%")));
        assertEquals(List.of("A_B Mug"), names(searchByPattern("%a!_b%")));
    }

    @Test
    void searchFiltersByCategory() {
        save(newProduct("A", "Caneca", "10.00"));
        save(newProduct("B", "Livro", "10.00"));
        save(newProduct("C", "Caneca", "10.00"));

        var result = search("%", "Caneca", BigDecimal.ZERO, MAX_PRICE, List.of(), List.of(), false, PageRequest.of(0, 20, Sort.by("id")));

        assertEquals(List.of("A", "C"), names(result));
    }

    @Test
    void searchFiltersByPriceRangeIncludingTheLimits() {
        save(newProduct("Below", "X", "9.99"));
        save(newProduct("Min", "X", "10.00"));
        save(newProduct("Max", "X", "20.00"));
        save(newProduct("Above", "X", "20.01"));

        var result = search("%", "", new BigDecimal("10.00"), new BigDecimal("20.00"), List.of(), List.of(), false, PageRequest.of(0, 20, Sort.by("id")));

        assertEquals(List.of("Min", "Max"), names(result));
    }

    @Test
    void searchFiltersByMoreThanOneColorAsOr() {
        var black = newProduct("Black one", "X", "10.00");
        black.setColor("Black");
        var red = newProduct("Red one", "X", "10.00");
        red.setColor("Red");
        var blue = newProduct("Blue one", "X", "10.00");
        blue.setColor("Blue");
        save(black);
        save(red);
        save(blue);
        save(newProduct("No color", "X", "10.00"));

        var result = search("%", "", BigDecimal.ZERO, MAX_PRICE, List.of("Black", "Red"), List.of(), false, PageRequest.of(0, 20, Sort.by("id")));

        assertEquals(List.of("Black one", "Red one"), names(result));
    }

    @Test
    void searchFiltersByMoreThanOneSizeAsOr() {
        var small = newProduct("Small one", "X", "10.00");
        small.setSize("S");
        var medium = newProduct("Medium one", "X", "10.00");
        medium.setSize("M");
        var large = newProduct("Large one", "X", "10.00");
        large.setSize("L");
        save(small);
        save(medium);
        save(large);

        var result = search("%", "", BigDecimal.ZERO, MAX_PRICE, List.of(), List.of("S", "L"), false, PageRequest.of(0, 20, Sort.by("id")));

        assertEquals(List.of("Small one", "Large one"), names(result));
    }

    @Test
    void searchFiltersByFeatured() {
        var featured = newProduct("Featured", "X", "10.00");
        featured.setFeatured(true);
        save(featured);
        save(newProduct("Regular", "X", "10.00"));

        var onlyFeatured = search("%", "", BigDecimal.ZERO, MAX_PRICE, List.of(), List.of(), true, PageRequest.of(0, 20, Sort.by("id")));
        var all = search("%", "", BigDecimal.ZERO, MAX_PRICE, List.of(), List.of(), false, PageRequest.of(0, 20, Sort.by("id")));

        assertEquals(List.of("Featured"), names(onlyFeatured));
        assertEquals(2, all.getTotalElements());
    }

    @Test
    void searchCombinesTheFiltersWithAnd() {
        var match = newProduct("Black Mug", "Caneca", "30.00");
        match.setColor("Black");
        match.setSize("M");
        match.setFeatured(true);
        save(match);
        var wrongColor = newProduct("Red Mug", "Caneca", "30.00");
        wrongColor.setColor("Red");
        wrongColor.setSize("M");
        wrongColor.setFeatured(true);
        save(wrongColor);
        var wrongCategory = newProduct("Black Book", "Livro", "30.00");
        wrongCategory.setColor("Black");
        wrongCategory.setSize("M");
        wrongCategory.setFeatured(true);
        save(wrongCategory);
        var wrongPrice = newProduct("Black Mug 2", "Caneca", "300.00");
        wrongPrice.setColor("Black");
        wrongPrice.setSize("M");
        wrongPrice.setFeatured(true);
        save(wrongPrice);

        var result = search("%mug%", "Caneca", new BigDecimal("10.00"), new BigDecimal("100.00"),
                List.of("Black"), List.of("M"), true, PageRequest.of(0, 20, Sort.by("id")));

        assertEquals(List.of("Black Mug"), names(result));
    }

    @Test
    void searchPaginatesAndCountsTheWholeSet() {
        for (int i = 1; i <= 5; i++) {
            save(newProduct("P" + i, "X", i + "0.00"));
        }

        var secondPage = search("%", "", BigDecimal.ZERO, MAX_PRICE, List.of(), List.of(), false,
                PageRequest.of(1, 2, Sort.by(Sort.Order.desc("price"), Sort.Order.asc("id"))));

        assertEquals(List.of("P3", "P2"), names(secondPage));
        assertEquals(5, secondPage.getTotalElements());
        assertEquals(3, secondPage.getTotalPages());
    }

    @Test
    void searchBreaksTiesById() {
        save(newProduct("First", "X", "10.00"));
        save(newProduct("Second", "X", "10.00"));
        save(newProduct("Third", "X", "10.00"));

        var result = search("%", "", BigDecimal.ZERO, MAX_PRICE, List.of(), List.of(), false,
                PageRequest.of(0, 20, Sort.by(Sort.Order.asc("price"), Sort.Order.asc("id"))));

        assertEquals(List.of("First", "Second", "Third"), names(result));
    }

    @Test
    void searchSortsByRatingDescendingWithTheUnratedAtTheEnd() {
        var good = newProduct("Good", "X", "10.00");
        good.setRating(new BigDecimal("4.50"));
        var unrated = newProduct("Unrated", "X", "10.00");
        var fair = newProduct("Fair", "X", "10.00");
        fair.setRating(new BigDecimal("3.00"));
        save(good);
        save(unrated);
        save(fair);

        var result = search("%", "", BigDecimal.ZERO, MAX_PRICE, List.of(), List.of(), false,
                PageRequest.of(0, 20, Sort.by(new Sort.Order(Sort.Direction.DESC, "rating").nullsLast(), Sort.Order.asc("id"))));

        assertEquals(List.of("Good", "Fair", "Unrated"), names(result));
    }

    @Test
    void searchSortsByRatingAscendingWithTheUnratedAtTheEnd() {
        var good = newProduct("Good", "X", "10.00");
        good.setRating(new BigDecimal("4.50"));
        var unrated = newProduct("Unrated", "X", "10.00");
        var fair = newProduct("Fair", "X", "10.00");
        fair.setRating(new BigDecimal("3.00"));
        save(good);
        save(unrated);
        save(fair);

        var result = search("%", "", BigDecimal.ZERO, MAX_PRICE, List.of(), List.of(), false,
                PageRequest.of(0, 20, Sort.by(new Sort.Order(Sort.Direction.ASC, "rating").nullsLast(), Sort.Order.asc("id"))));

        assertEquals(List.of("Fair", "Good", "Unrated"), names(result));
    }

    @Test
    void searchRoundTripsTheRatingAndTheServerFields() {
        var product = newProduct("Rated", "X", "10.00");
        product.setRating(new BigDecimal("4.25"));
        product.setReviewCount(8);
        product.setPopularity(77);
        var saved = save(product);
        entityManager.clear();

        var found = repository.findById(saved.getId()).orElseThrow();

        assertEquals(new BigDecimal("4.25"), found.getRating());
        assertEquals(8, found.getReviewCount());
        assertEquals(77, found.getPopularity());
        assertEquals(LocalDateTime.of(2026, 10, 1, 10, 0), found.getCreatedAt());
    }

    @Test
    void countByColorGroupsAndIgnoresTheProductsWithoutColor() {
        for (var color : new String[] {"Black", "Black", "Red"}) {
            var product = newProduct("P " + color, "X", "10.00");
            product.setColor(color);
            save(product);
        }
        save(newProduct("No color", "X", "10.00"));

        var rows = repository.countByColor("%", "", BigDecimal.ZERO, MAX_PRICE, 0, NO_VALUES, 0, NO_VALUES, false);

        assertEquals(List.of("Black", "Red"), rows.stream().map(row -> (String) row[0]).toList());
        assertEquals(Map.of("Black", 2L, "Red", 1L), toMap(rows));
    }

    @Test
    void countByColorRespectsTheOtherFilters() {
        var mug = newProduct("Mug", "Caneca", "10.00");
        mug.setColor("Black");
        save(mug);
        var book = newProduct("Book", "Livro", "10.00");
        book.setColor("Red");
        save(book);

        var rows = repository.countByColor("%", "Caneca", BigDecimal.ZERO, MAX_PRICE, 0, NO_VALUES, 0, NO_VALUES, false);

        assertEquals(Map.of("Black", 1L), toMap(rows));
    }

    @Test
    void countBySizeGroupsAndIgnoresTheProductsWithoutSize() {
        for (var size : new String[] {"M", "M", "L"}) {
            var product = newProduct("P " + size, "X", "10.00");
            product.setSize(size);
            save(product);
        }
        save(newProduct("No size", "X", "10.00"));

        var rows = repository.countBySize("%", "", BigDecimal.ZERO, MAX_PRICE, 0, NO_VALUES, 0, NO_VALUES, false);

        assertEquals(List.of("L", "M"), rows.stream().map(row -> (String) row[0]).toList());
        assertEquals(Map.of("M", 2L, "L", 1L), toMap(rows));
    }

    @Test
    void countByCategoryFilteredRespectsTheFilters() {
        save(newProduct("A", "Caneca", "10.00"));
        save(newProduct("B", "Caneca", "500.00"));
        save(newProduct("C", "Livro", "10.00"));

        var all = repository.countByCategoryFiltered("%", "", BigDecimal.ZERO, MAX_PRICE, 0, NO_VALUES, 0, NO_VALUES, false);
        var cheap = repository.countByCategoryFiltered("%", "", BigDecimal.ZERO, new BigDecimal("100.00"), 0, NO_VALUES, 0, NO_VALUES, false);

        assertEquals(Map.of("Caneca", 2L, "Livro", 1L), toMap(all));
        assertEquals(Map.of("Caneca", 1L, "Livro", 1L), toMap(cheap));
    }

    @Test
    void countByPriceBucketGroupsByHundreds() {
        save(newProduct("A", "X", "0.50"));
        save(newProduct("B", "X", "99.99"));
        save(newProduct("C", "X", "100.00"));
        save(newProduct("D", "X", "250.00"));
        save(newProduct("E", "X", "999.00"));

        var rows = repository.countByPriceBucket("%", "", BigDecimal.ZERO, MAX_PRICE, 0, NO_VALUES, 0, NO_VALUES, false);

        var counts = rows.stream().collect(Collectors.toMap(
                row -> ((Number) row[0]).intValue(),
                row -> ((Number) row[1]).longValue()));
        assertEquals(Map.of(0, 2L, 1, 1L, 2, 1L, 9, 1L), counts);
    }

    @Test
    void countProductsByCategoryCountsEveryProduct() {
        save(newProduct("A", "Caneca", "10.00"));
        save(newProduct("B", "Caneca", "10.00"));
        save(newProduct("C", "Livro", "10.00"));

        var rows = repository.countProductsByCategory();

        assertEquals(List.of("Caneca", "Livro"), rows.stream().map(row -> (String) row[0]).toList());
        assertEquals(Map.of("Caneca", 2L, "Livro", 1L), toMap(rows));
    }

    @Test
    void findLatestImageProductIdByCategoryPicksTheHighestIdWithImage() {
        var first = newProduct("First", "Caneca", "10.00");
        first.setImageSize(10);
        first.setImageContentType("image/jpeg");
        save(first);
        var second = newProduct("Second", "Caneca", "10.00");
        second.setImageSize(20);
        second.setImageContentType("image/jpeg");
        var secondSaved = save(second);
        save(newProduct("Third without image", "Caneca", "10.00"));
        save(newProduct("Only without image", "Livro", "10.00"));

        var rows = repository.findLatestImageProductIdByCategory();

        assertEquals(1, rows.size());
        assertEquals("Caneca", rows.get(0)[0]);
        assertEquals(secondSaved.getId(), ((Number) rows.get(0)[1]).longValue());
    }

    @Test
    void updateImageWritesTheBytesWithoutTouchingTheOtherColumns() {
        var product = newProduct("With image", "Caneca", "10.00");
        product.setImageContentType("image/jpeg");
        product.setImageSize(4);
        var saved = save(product);
        var bytes = new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x01};

        var updated = imageRepository.updateImage(saved.getId(), bytes);

        entityManager.clear();
        var image = imageRepository.findById(saved.getId()).orElseThrow();
        assertEquals(1, updated);
        assertArrayEquals(bytes, image.getImage());
        assertEquals("image/jpeg", image.getContentType());
        var reloaded = repository.findById(saved.getId()).orElseThrow();
        assertEquals("With image", reloaded.getName());
        assertEquals(4, reloaded.getImageSize());
    }

    @Test
    void updateImageReplacesTheCurrentBytes() {
        var saved = save(newProduct("Replace", "Caneca", "10.00"));
        imageRepository.updateImage(saved.getId(), new byte[] {1, 2, 3});

        imageRepository.updateImage(saved.getId(), new byte[] {9, 8});

        entityManager.clear();
        assertArrayEquals(new byte[] {9, 8}, imageRepository.findById(saved.getId()).orElseThrow().getImage());
    }

    @Test
    void updateImageOfAMissingProductChangesNothing() {
        var updated = imageRepository.updateImage(Long.MAX_VALUE, new byte[] {1});

        assertEquals(0, updated);
    }

    @Test
    void theProductEntityDoesNotMapTheImageColumn() {
        var attributes = entityManager.getMetamodel().entity(Product.class).getAttributes().stream()
                .map(attribute -> attribute.getName())
                .toList();

        assertTrue(attributes.contains("imageSize"));
        assertTrue(attributes.contains("imageContentType"));
        assertFalse(attributes.contains("image"));
    }

    @Test
    void searchKeepsTheProductsWithoutStock() {
        var soldOut = newProduct("Sold out", "X", "10.00");
        soldOut.setQuantity(0);
        save(soldOut);
        save(newProduct("In stock", "X", "10.00"));

        var result = searchByPattern("%");

        assertEquals(List.of("Sold out", "In stock"), names(result));
        assertEquals(0, result.getContent().get(0).getQuantity());
    }

    @Test
    void aProductWithoutImageHasNullBytes() {
        var saved = save(newProduct("No image", "Caneca", "10.00"));
        entityManager.clear();

        var image = imageRepository.findById(saved.getId()).orElseThrow();

        assertNull(image.getImage());
    }
}
