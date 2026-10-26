package br.com.erudio.integrationtests.controllers.withjson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.LongStream;

import org.junit.jupiter.api.Test;

import br.com.erudio.integrationtests.ApiIntegrationTest;
import br.com.erudio.integrationtests.ProductApi;
import br.com.erudio.integrationtests.dto.ProductDTO;

class ProductSeedJsonTest extends ApiIntegrationTest {

    private static final Set<Long> FEATURED_IDS = Set.of(1L, 4L, 8L, 9L, 10L, 11L);
    private static final Set<String> CATEGORIES = Set.of("Caneca", "Camiseta", "Boneco de ação", "Moletom", "Livro", "Acessório");

    private static List<ProductDTO> seed() {
        return LongStream.rangeClosed(1, 14)
            .mapToObj(id -> ProductApi.read(ProductApi.get(id)))
            .toList();
    }

    @Test
    void theMigrationsLeaveFourteenProductsWithIdsOneToFourteen() {
        var products = seed();

        assertEquals(Set.of(1L,2L,3L,4L,5L,6L,7L,8L,9L,10L,11L,12L,13L,14L), products.stream().map(ProductDTO::getId).collect(Collectors.toSet()));
        assertEquals(14, products.stream().map(ProductDTO::getName).collect(Collectors.toSet()).size());
    }

    @Test
    void theSeedHasSixCategories() {
        var categories = seed().stream().map(ProductDTO::getCategory).collect(Collectors.toSet());

        assertEquals(CATEGORIES, categories);
    }

    @Test
    void everySeedProductHasAnImageThatIsServed() {
        for (var product : seed()) {
            assertNotNull(product.getImageUrl(), product.getName());
            var image = ProductApi.base().when().get("/{id}/image", product.getId()).then().statusCode(200).extract().response();
            assertEquals("image/jpeg", image.contentType(), product.getName());
            assertTrue(image.asByteArray().length > 1000, product.getName());
        }
    }

    @Test
    void productThreeIsSoldOutAndNotFeatured() {
        var product = ProductApi.read(ProductApi.get(3L));

        assertEquals(0, product.getQuantity());
        assertFalse(product.getFeatured());
    }

    @Test
    void theFeaturedProductsAreTheOnesOfTheProposal() {
        var featured = seed().stream().filter(ProductDTO::getFeatured).map(ProductDTO::getId).collect(Collectors.toSet());

        assertEquals(FEATURED_IDS, featured);
    }

    @Test
    void creationDatesAreFixedBetweenTheFirstAndTheFourteenthOfOctober() {
        for (var product : seed()) {
            var day = product.getCreatedAt().toLocalDate();
            assertFalse(day.isBefore(LocalDate.of(2026, 10, 1)), product.getName());
            assertFalse(day.isAfter(LocalDate.of(2026, 10, 14)), product.getName());
            assertEquals(10, product.getCreatedAt().getHour(), product.getName());
        }
    }

    @Test
    void ratingStartsEmptyAndReviewCountAtZero() {
        for (var product : seed()) {
            assertNull(product.getRating(), product.getName());
            assertEquals(0, product.getReviewCount(), product.getName());
        }
    }

    @Test
    void productsAreStillListedWithTheirCategoryFacet() {
        var response = ProductApi.base().when().get("/facets");

        assertEquals(200, response.statusCode(), response.asString());
        List<String> categories = response.jsonPath().getList("categories.name");
        assertTrue(categories.containsAll(CATEGORIES), categories.toString());
    }
}
