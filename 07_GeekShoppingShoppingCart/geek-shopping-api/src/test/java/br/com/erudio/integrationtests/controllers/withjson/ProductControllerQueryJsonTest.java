package br.com.erudio.integrationtests.controllers.withjson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import br.com.erudio.integrationtests.ApiIntegrationTest;
import br.com.erudio.integrationtests.ProductApi;
import br.com.erudio.integrationtests.TestImages;
import br.com.erudio.integrationtests.dto.ProductDTO;
import br.com.erudio.integrationtests.dto.wrappers.json.WrapperProductDTO;
import io.restassured.response.Response;

class ProductControllerQueryJsonTest extends ApiIntegrationTest {

    private static final String TOKEN = UUID.randomUUID().toString().substring(0, 8);
    private static final String CATEGORY = "Query " + TOKEN;
    private static final String OTHER_CATEGORY = "Other " + TOKEN;

    private static final List<ProductDTO> created = new ArrayList<>();
    private static ProductDTO alpha;
    private static ProductDTO beta;
    private static ProductDTO gamma;
    private static ProductDTO delta;
    private static ProductDTO epsilon;
    private static ProductDTO other;
    private static byte[] gammaImage;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeAll
    static void createCatalog() {
        gammaImage = TestImages.png(256);
        alpha = register("Alpha " + TOKEN, CATEGORY, "10.00", "hot coffee", "Black", "M", true, 5, "15.00", null);
        beta = register("Beta " + TOKEN, CATEGORY, "20.00", "plain", "White", "G", false, 5, null, null);
        gamma = register("Gamma " + TOKEN, CATEGORY, "150.00", "sold out thing", "Black", "G", true, 0, null, gammaImage);
        delta = register("Delta " + TOKEN, CATEGORY, "250.00", "expensive", "Red", "M", false, 5, null, null);
        epsilon = register("Epsilon " + TOKEN, CATEGORY, "20.00", "same price as beta", "White", "M", false, 5, null, null);
        other = register("Zeta " + TOKEN, OTHER_CATEGORY, "99.99", "another category", null, null, false, 5, null, null);
    }

    @AfterAll
    static void cleanUp() {
        created.forEach(product -> ProductApi.delete(product.getId()));
    }

    private static ProductDTO register(
            String name, String category, String price, String description, String color, String size,
            boolean featured, int quantity, String oldPrice, byte[] image) {
        var body = ProductApi.product(name, category, price);
        body.put("description", description);
        body.put("color", color);
        body.put("size", size);
        body.put("featured", featured);
        body.put("quantity", quantity);
        if (oldPrice != null) body.put("oldPrice", new BigDecimal(oldPrice));
        var product = ProductApi.createOk(body, image, image == null ? null : "image/png");
        created.add(product);
        return product;
    }

    private static Response list(Object... queryParams) {
        Map<String, Object> parameters = new LinkedHashMap<>();
        parameters.put("category", CATEGORY);
        for (int i = 0; i < queryParams.length; i += 2) {
            var name = (String) queryParams[i];
            var value = queryParams[i + 1];
            parameters.merge(name, value, (current, next) -> current instanceof List<?> values
                ? Stream.concat(values.stream(), Stream.of(next)).toList()
                : List.of(current, next));
        }
        return ProductApi.base().queryParams(parameters).when().get();
    }

    private static List<Long> idsOf(Response response) {
        var embedded = objectMapper.readValue(response.asString(), WrapperProductDTO.class).getEmbedded();
        if (embedded == null) return List.of();
        return embedded.getProducts().stream().map(ProductDTO::getId).toList();
    }

    private static List<ProductDTO> productsOf(Response response) {
        return objectMapper.readValue(response.asString(), WrapperProductDTO.class).getEmbedded().getProducts();
    }

    @Test
    void categoryFilterReturnsOnlyThatCategory() {
        var response = list("size", 100);

        assertEquals(200, response.statusCode(), response.asString());
        assertEquals(Set.of(alpha.getId(), beta.getId(), gamma.getId(), delta.getId(), epsilon.getId()), Set.copyOf(idsOf(response)));
        assertEquals(5, response.jsonPath().getInt("page.totalElements"));
    }

    @Test
    void textSearchMatchesTheNameIgnoringCase() {
        var response = list("q", ("ALPHA " + TOKEN).toUpperCase());

        assertEquals(List.of(alpha.getId()), idsOf(response));
    }

    @Test
    void textSearchMatchesTheDescription() {
        var response = list("q", "HOT Coffee");

        assertEquals(List.of(alpha.getId()), idsOf(response));
    }

    @Test
    void percentAndUnderscoreInTheSearchAreLiteral() {
        assertEquals(List.of(), idsOf(list("q", "%")));
        assertEquals(List.of(), idsOf(list("q", "_")));
        assertEquals(List.of(), idsOf(list("q", "a_pha")));
    }

    @Test
    void priceRangeIsInclusive() {
        var response = list("minPrice", "20.00", "maxPrice", "150.00", "size", 100);

        assertEquals(Set.of(beta.getId(), gamma.getId(), epsilon.getId()), Set.copyOf(idsOf(response)));
    }

    @Test
    void repeatedColorMeansOr() {
        var response = list("color", "Black", "color", "Red", "size", 100);

        assertEquals(Set.of(alpha.getId(), gamma.getId(), delta.getId()), Set.copyOf(idsOf(response)));
    }

    @Test
    void productSizeFilterIsNotTheSameAsThePageSize() {
        var response = list("productSize", "G", "size", 100);

        assertEquals(Set.of(beta.getId(), gamma.getId()), Set.copyOf(idsOf(response)));
        assertEquals(100, response.jsonPath().getInt("page.size"));
    }

    @Test
    void featuredFilterReturnsOnlyFeatured() {
        var response = list("featured", true, "size", 100);

        assertEquals(Set.of(alpha.getId(), gamma.getId()), Set.copyOf(idsOf(response)));
    }

    @Test
    void filtersAreCombinedWithAnd() {
        var response = list("color", "Black", "featured", true, "maxPrice", "100.00");

        assertEquals(List.of(alpha.getId()), idsOf(response));
    }

    @Test
    void soldOutProductsStayInTheListing() {
        var products = productsOf(list("size", 100));

        var soldOut = products.stream().filter(product -> product.getId().equals(gamma.getId())).findFirst().orElseThrow();
        assertEquals(0, soldOut.getQuantity());
    }

    @Test
    void sortByPriceAscendingBreaksTiesById() {
        var ids = idsOf(list("sortBy", "price", "direction", "asc", "size", 100));

        assertEquals(List.of(alpha.getId(), beta.getId(), epsilon.getId(), gamma.getId(), delta.getId()), ids);
    }

    @Test
    void sortByPriceDescendingKeepsTheTieBreakById() {
        var ids = idsOf(list("sortBy", "price", "direction", "desc", "size", 100));

        assertEquals(List.of(delta.getId(), gamma.getId(), beta.getId(), epsilon.getId(), alpha.getId()), ids);
    }

    @Test
    void sortByNameInBothDirections() {
        assertEquals(
            List.of(alpha.getId(), beta.getId(), delta.getId(), epsilon.getId(), gamma.getId()),
            idsOf(list("sortBy", "name", "direction", "asc", "size", 100)));
        assertEquals(
            List.of(gamma.getId(), epsilon.getId(), delta.getId(), beta.getId(), alpha.getId()),
            idsOf(list("sortBy", "name", "direction", "desc", "size", 100)));
    }

    @Test
    void directionIsCaseInsensitive() {
        assertEquals(
            idsOf(list("sortBy", "name", "direction", "asc")),
            idsOf(list("sortBy", "name", "direction", "ASC")));
    }

    @Test
    void sortByCreatedAtDescendingReturnsTheNewestFirst() {
        var ids = idsOf(list("sortBy", "createdAt", "direction", "desc", "size", 100));

        assertEquals(epsilon.getId(), ids.get(0));
        assertEquals(alpha.getId(), ids.get(ids.size() - 1));
    }

    @Test
    void sortByPopularityIsAcceptedAndTiesAreBrokenById() {
        var ids = idsOf(list("sortBy", "popularity", "direction", "asc", "size", 100));

        assertEquals(List.of(alpha.getId(), beta.getId(), gamma.getId(), delta.getId(), epsilon.getId()), ids);
    }

    @Test
    void sortByRatingPutsTheProductsWithoutRatingLast() {
        jdbcTemplate.update("UPDATE products SET rating = ? WHERE id = ?", new BigDecimal("4.50"), delta.getId());
        jdbcTemplate.update("UPDATE products SET rating = ? WHERE id = ?", new BigDecimal("3.00"), beta.getId());
        try {
            var descending = idsOf(list("sortBy", "rating", "direction", "desc", "size", 100));
            var ascending = idsOf(list("sortBy", "rating", "direction", "asc", "size", 100));

            assertEquals(List.of(delta.getId(), beta.getId(), alpha.getId(), gamma.getId(), epsilon.getId()), descending);
            assertEquals(List.of(beta.getId(), delta.getId(), alpha.getId(), gamma.getId(), epsilon.getId()), ascending);
        } finally {
            jdbcTemplate.update("UPDATE products SET rating = NULL WHERE id IN (?, ?)", delta.getId(), beta.getId());
        }
    }

    @Test
    void ratingSetBySomeoneElseAppearsInTheResponse() {
        jdbcTemplate.update("UPDATE products SET rating = ?, review_count = 7 WHERE id = ?", new BigDecimal("4.25"), alpha.getId());
        try {
            var found = ProductApi.read(ProductApi.get(alpha.getId()));

            assertEquals(0, new BigDecimal("4.25").compareTo(found.getRating()));
            assertEquals(7, found.getReviewCount());
        } finally {
            jdbcTemplate.update("UPDATE products SET rating = NULL, review_count = 0 WHERE id = ?", alpha.getId());
        }
    }

    @Test
    void firstPageHasNoPrevLink() {
        var response = list("size", 2, "page", 0, "sortBy", "name");

        assertEquals(200, response.statusCode(), response.asString());
        assertEquals(2, response.jsonPath().getInt("page.size"));
        assertEquals(0, response.jsonPath().getInt("page.number"));
        assertEquals(5, response.jsonPath().getInt("page.totalElements"));
        assertEquals(3, response.jsonPath().getInt("page.totalPages"));
        Map<String, Object> links = response.jsonPath().getMap("_links");
        assertTrue(links.containsKey("self"));
        assertTrue(links.containsKey("first"));
        assertTrue(links.containsKey("next"));
        assertTrue(links.containsKey("last"));
        assertFalse(links.containsKey("prev"), links.toString());
        assertEquals(List.of(alpha.getId(), beta.getId()), idsOf(response));
    }

    @Test
    void middlePageHasPrevAndNext() {
        var response = list("size", 2, "page", 1, "sortBy", "name");

        Map<String, Object> links = response.jsonPath().getMap("_links");
        assertTrue(links.containsKey("prev"));
        assertTrue(links.containsKey("next"));
        assertEquals(List.of(delta.getId(), epsilon.getId()), idsOf(response));
    }

    @Test
    void lastPageHasNoNextLink() {
        var response = list("size", 2, "page", 2, "sortBy", "name");

        Map<String, Object> links = response.jsonPath().getMap("_links");
        assertTrue(links.containsKey("prev"));
        assertFalse(links.containsKey("next"), links.toString());
        assertEquals(List.of(gamma.getId()), idsOf(response));
    }

    @Test
    void pageBeyondTheEndIsEmptyNotAnError() {
        var response = list("size", 2, "page", 50);

        assertEquals(200, response.statusCode(), response.asString());
        assertEquals(List.of(), idsOf(response));
        assertEquals(5, response.jsonPath().getInt("page.totalElements"));
    }

    @Test
    void filterWithoutMatchesIsAnEmptyPage() {
        var response = list("q", "nothing-matches-" + TOKEN);

        assertEquals(200, response.statusCode(), response.asString());
        assertEquals(List.of(), idsOf(response));
        assertEquals(0, response.jsonPath().getInt("page.totalElements"));
        assertEquals(0, response.jsonPath().getInt("page.totalPages"));
    }

    @Test
    void everyItemOfAPageCarriesItsLinksWithHrefAndType() {
        var response = list("size", 100);

        List<Map<String, Object>> items = response.jsonPath().getList("_embedded.products");
        assertEquals(5, items.size());
        for (var item : items) {
            @SuppressWarnings("unchecked")
            var links = (Map<String, Map<String, String>>) item.get("_links");
            links.forEach((rel, link) -> {
                assertNotNull(link.get("href"), rel + " has no href");
                assertNotNull(link.get("type"), rel + " has no type");
                assertTrue(link.get("href").matches("https?://.+/api/product/v1.*"), link.get("href"));
            });
            assertTrue(links.containsKey("self"));
        }
    }

    @Test
    void listingNeverCarriesTheImageBytes() {
        List<Map<String, Object>> items = list("size", 100).jsonPath().getList("_embedded.products");

        assertEquals(5, items.size());
        for (var item : items) {
            assertFalse(item.containsKey("image"), "the listing must not carry the image column");
            assertFalse(item.containsKey("imageContentType"));
            assertFalse(item.containsKey("imageSize"));
        }
        var withImage = items.stream().filter(item -> gamma.getId().equals(((Number) item.get("id")).longValue())).findFirst().orElseThrow();
        assertTrue(withImage.get("imageUrl").toString().endsWith("/" + gamma.getId() + "/image"));
    }

    @Test
    void facetsCountTheFilteredSet() {
        var response = ProductApi.base().queryParam("category", CATEGORY).when().get("/facets");

        assertEquals(200, response.statusCode(), response.asString());
        List<Map<String, Object>> ranges = response.jsonPath().getList("priceRanges");
        assertEquals(6, ranges.size());
        assertEquals(0, ((Number) ranges.get(0).get("min")).intValue());
        assertEquals(100, ((Number) ranges.get(0).get("max")).intValue());
        assertNull(ranges.get(5).get("max"));
        assertEquals(3, ((Number) ranges.get(0).get("count")).intValue());
        assertEquals(1, ((Number) ranges.get(1).get("count")).intValue());
        assertEquals(1, ((Number) ranges.get(2).get("count")).intValue());
        assertEquals(5, ranges.stream().mapToInt(range -> ((Number) range.get("count")).intValue()).sum());

        assertEquals(Map.of("Black", 2, "Red", 1, "White", 2), countsOf(response.jsonPath().getList("colors")));
        assertEquals(Map.of("G", 2, "M", 3), countsOf(response.jsonPath().getList("sizes")));
        assertEquals(Map.of(CATEGORY, 5), countsOf(response.jsonPath().getList("categories")));
    }

    @Test
    void facetsAcceptTheSameFiltersAsTheListing() {
        var response = ProductApi.base().queryParams("category", CATEGORY, "color", "Black").when().get("/facets");

        assertEquals(Map.of("Black", 2), countsOf(response.jsonPath().getList("colors")));
        assertEquals(Map.of("G", 1, "M", 1), countsOf(response.jsonPath().getList("sizes")));
        assertEquals(Map.of(CATEGORY, 2), countsOf(response.jsonPath().getList("categories")));
    }

    @Test
    void facetsCountTheOtherCategorySeparately() {
        var response = ProductApi.base().queryParam("q", TOKEN).when().get("/facets");

        var categories = countsOf(response.jsonPath().getList("categories"));
        assertEquals(5, categories.get(CATEGORY));
        assertEquals(1, categories.get(OTHER_CATEGORY));
    }

    @Test
    void featuredShortcutReturnsTheFeaturedProducts() {
        var response = ProductApi.base().queryParam("size", 100).when().get("/featured");

        assertEquals(200, response.statusCode(), response.asString());
        var ids = idsOf(response);
        assertTrue(ids.contains(alpha.getId()));
        assertTrue(ids.contains(gamma.getId()));
        assertFalse(ids.contains(beta.getId()));
        assertTrue(productsOf(response).stream().allMatch(ProductDTO::getFeatured));
    }

    @Test
    void recentShortcutReturnsTheNewestFirst() {
        var response = ProductApi.base().queryParam("size", 3).when().get("/recent");

        assertEquals(200, response.statusCode(), response.asString());
        assertEquals(3, response.jsonPath().getInt("page.size"));
        var ids = idsOf(response);
        assertEquals(other.getId(), ids.get(0));
        assertEquals(epsilon.getId(), ids.get(1));
        assertEquals(delta.getId(), ids.get(2));
    }

    @Test
    void categoriesAreDerivedWithTheirCountAndImage() {
        var response = ProductApi.base().when().get("/categories");

        assertEquals(200, response.statusCode(), response.asString());
        List<Map<String, Object>> categories = response.jsonPath().getList("$");
        var query = categories.stream().filter(category -> CATEGORY.equals(category.get("name"))).findFirst().orElseThrow();
        assertEquals(5, ((Number) query.get("productCount")).intValue());
        assertTrue(query.get("imageUrl").toString().endsWith(ProductApi.PATH + "/" + gamma.getId() + "/image"), query.toString());
        var otherCategory = categories.stream().filter(category -> OTHER_CATEGORY.equals(category.get("name"))).findFirst().orElseThrow();
        assertEquals(1, ((Number) otherCategory.get("productCount")).intValue());
        assertNull(otherCategory.get("imageUrl"));
    }

    private static Map<String, Integer> countsOf(List<Map<String, Object>> items) {
        var counts = new java.util.HashMap<String, Integer>();
        items.forEach(item -> counts.put((String) item.get("name"), ((Number) item.get("count")).intValue()));
        return counts;
    }
}
