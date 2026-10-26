package br.com.erudio.repositories;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.erudio.exception.ResourceNotFoundException;
import br.com.erudio.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

    String FILTERS = """
            (LOWER(p.name) LIKE :pattern ESCAPE '!' OR LOWER(p.description) LIKE :pattern ESCAPE '!')
            AND (:category = '' OR p.category = :category)
            AND p.price >= :minPrice
            AND p.price <= :maxPrice
            AND (:colorCount = 0 OR p.color IN :colors)
            AND (:sizeCount = 0 OR p.size IN :sizes)
            AND (:featuredOnly = false OR p.featured = true)
            """;

    default Product getById(Long id) {
        return findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("No records found for this ID!"));
    }

    @Query(value = "SELECT p FROM Product p WHERE " + FILTERS,
        countQuery = "SELECT COUNT(p) FROM Product p WHERE " + FILTERS)
    Page<Product> search(
        @Param("pattern") String pattern,
        @Param("category") String category,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("colorCount") int colorCount,
        @Param("colors") List<String> colors,
        @Param("sizeCount") int sizeCount,
        @Param("sizes") List<String> sizes,
        @Param("featuredOnly") boolean featuredOnly,
        Pageable pageable);

    @Query("SELECT p.color, COUNT(p) FROM Product p WHERE p.color IS NOT NULL AND " + FILTERS + " GROUP BY p.color ORDER BY p.color")
    List<Object[]> countByColor(
        @Param("pattern") String pattern,
        @Param("category") String category,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("colorCount") int colorCount,
        @Param("colors") List<String> colors,
        @Param("sizeCount") int sizeCount,
        @Param("sizes") List<String> sizes,
        @Param("featuredOnly") boolean featuredOnly);

    @Query("SELECT p.size, COUNT(p) FROM Product p WHERE p.size IS NOT NULL AND " + FILTERS + " GROUP BY p.size ORDER BY p.size")
    List<Object[]> countBySize(
        @Param("pattern") String pattern,
        @Param("category") String category,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("colorCount") int colorCount,
        @Param("colors") List<String> colors,
        @Param("sizeCount") int sizeCount,
        @Param("sizes") List<String> sizes,
        @Param("featuredOnly") boolean featuredOnly);

    @Query("SELECT p.category, COUNT(p) FROM Product p WHERE " + FILTERS + " GROUP BY p.category ORDER BY p.category")
    List<Object[]> countByCategoryFiltered(
        @Param("pattern") String pattern,
        @Param("category") String category,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("colorCount") int colorCount,
        @Param("colors") List<String> colors,
        @Param("sizeCount") int sizeCount,
        @Param("sizes") List<String> sizes,
        @Param("featuredOnly") boolean featuredOnly);

    @Query("SELECT FLOOR(p.price / 100), COUNT(p) FROM Product p WHERE " + FILTERS + " GROUP BY FLOOR(p.price / 100)")
    List<Object[]> countByPriceBucket(
        @Param("pattern") String pattern,
        @Param("category") String category,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("colorCount") int colorCount,
        @Param("colors") List<String> colors,
        @Param("sizeCount") int sizeCount,
        @Param("sizes") List<String> sizes,
        @Param("featuredOnly") boolean featuredOnly);

    @Query("SELECT p.category, COUNT(p) FROM Product p GROUP BY p.category ORDER BY p.category")
    List<Object[]> countProductsByCategory();

    @Query("SELECT p.category, MAX(p.id) FROM Product p WHERE p.imageSize IS NOT NULL GROUP BY p.category")
    List<Object[]> findLatestImageProductIdByCategory();
}
