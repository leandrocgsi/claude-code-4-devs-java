package br.com.erudio.services;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.PagedModel;
import org.springframework.data.web.PagedResourcesAssembler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import br.com.erudio.controllers.ProductController;
import br.com.erudio.data.dto.CategoryDTO;
import br.com.erudio.data.dto.FacetItemDTO;
import br.com.erudio.data.dto.FacetsDTO;
import br.com.erudio.data.dto.PriceRangeDTO;
import br.com.erudio.data.dto.ProductDTO;
import br.com.erudio.data.dto.request.ProductFilter;
import br.com.erudio.data.dto.request.ProductRequestDTO;
import br.com.erudio.exception.BadRequestException;
import br.com.erudio.exception.InvalidImageException;
import br.com.erudio.exception.RequiredObjectIsNullException;
import br.com.erudio.exception.ResourceNotFoundException;
import br.com.erudio.file.ImageTypeDetector;
import br.com.erudio.mapper.DozerMapper;
import br.com.erudio.model.Product;
import br.com.erudio.model.ProductImage;
import br.com.erudio.repositories.ProductImageRepository;
import br.com.erudio.repositories.ProductRepository;

@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;
    private static final int PRICE_BUCKET_WIDTH = 100;
    private static final int LAST_PRICE_BUCKET = 5;
    private static final BigDecimal MAX_FILTER_PRICE = new BigDecimal("1000000000000");
    private static final List<String> NO_VALUES = List.of("");
    private static final Map<String, String> SORTABLE_FIELDS = Map.of(
            "name", "name",
            "price", "price",
            "createdAt", "createdAt",
            "popularity", "popularity",
            "rating", "rating");

    @Autowired
    private ProductRepository repository;

    @Autowired
    private ProductImageRepository imageRepository;

    @Autowired
    private PagedResourcesAssembler<ProductDTO> assembler;

    public ProductDTO findById(Long id) {
        logger.info("Finding one product!");
        return toDto(repository.getById(id));
    }

    public PagedModel<EntityModel<ProductDTO>> findAll(
            Integer page, Integer size, String direction, String sortBy, ProductFilter filter) {
        logger.info("Finding all products!");
        validateFilter(filter);
        var pageable = buildPageable(page, size, direction, sortBy);
        var products = search(filter, pageable);
        var selfLink = linkTo(methodOn(ProductController.class).findAll(
                page,
                size,
                direction,
                sortBy,
                filter.q(),
                filter.category(),
                filter.minPrice(),
                filter.maxPrice(),
                filter.colors(),
                filter.sizes(),
                filter.featuredOnly()))
            .withSelfRel();
        return buildPagedModel(products, selfLink);
    }

    public PagedModel<EntityModel<ProductDTO>> findFeatured(Integer page, Integer size) {
        logger.info("Finding featured products!");
        var filter = new ProductFilter(null, null, null, null, null, null, true);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("popularity"), Sort.Order.asc("id")));
        var selfLink = linkTo(methodOn(ProductController.class).findFeatured(page, size)).withSelfRel();
        return buildPagedModel(search(filter, pageable), selfLink);
    }

    public PagedModel<EntityModel<ProductDTO>> findRecent(Integer page, Integer size) {
        logger.info("Finding recent products!");
        var filter = new ProductFilter(null, null, null, null, null, null, false);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        var selfLink = linkTo(methodOn(ProductController.class).findRecent(page, size)).withSelfRel();
        return buildPagedModel(search(filter, pageable), selfLink);
    }

    public FacetsDTO findFacets(ProductFilter filter) {
        logger.info("Finding product facets!");
        validateFilter(filter);
        var p = toSearchParams(filter);

        var priceCounts = new long[LAST_PRICE_BUCKET + 1];
        repository.countByPriceBucket(
                p.pattern(), p.category(), p.minPrice(), p.maxPrice(),
                p.colorCount(), p.colors(), p.sizeCount(), p.sizes(), p.featuredOnly())
            .forEach(row -> priceCounts[Math.min(((Number) row[0]).intValue(), LAST_PRICE_BUCKET)] += ((Number) row[1]).longValue());

        List<PriceRangeDTO> priceRanges = new ArrayList<>();
        for (int i = 0; i <= LAST_PRICE_BUCKET; i++) {
            Integer max = i < LAST_PRICE_BUCKET ? (i + 1) * PRICE_BUCKET_WIDTH : null;
            priceRanges.add(new PriceRangeDTO(i * PRICE_BUCKET_WIDTH, max, priceCounts[i]));
        }

        var colors = toFacetItems(repository.countByColor(
                p.pattern(), p.category(), p.minPrice(), p.maxPrice(),
                p.colorCount(), p.colors(), p.sizeCount(), p.sizes(), p.featuredOnly()));
        var sizes = toFacetItems(repository.countBySize(
                p.pattern(), p.category(), p.minPrice(), p.maxPrice(),
                p.colorCount(), p.colors(), p.sizeCount(), p.sizes(), p.featuredOnly()));
        var categories = toFacetItems(repository.countByCategoryFiltered(
                p.pattern(), p.category(), p.minPrice(), p.maxPrice(),
                p.colorCount(), p.colors(), p.sizeCount(), p.sizes(), p.featuredOnly()));

        return new FacetsDTO(priceRanges, colors, sizes, categories);
    }

    public List<CategoryDTO> findCategories() {
        logger.info("Finding product categories!");
        Map<String, Long> imageProductByCategory = new HashMap<>();
        repository.findLatestImageProductIdByCategory()
            .forEach(row -> imageProductByCategory.put((String) row[0], ((Number) row[1]).longValue()));
        return repository.countProductsByCategory().stream()
            .map(row -> {
                var name = (String) row[0];
                var imageProductId = imageProductByCategory.get(name);
                var imageUrl = imageProductId == null ? null : imagePath(imageProductId);
                return new CategoryDTO(name, ((Number) row[1]).longValue(), imageUrl);
            })
            .toList();
    }

    public ProductImage findImage(Long id) {
        logger.info("Finding the image of one product!");
        return imageRepository.findById(id)
            .filter(image -> image.getImage() != null)
            .orElseThrow(() -> new ResourceNotFoundException("No image found for this ID!"));
    }

    @Transactional
    public ProductDTO create(ProductRequestDTO product, MultipartFile image) {
        if (product == null) throw new RequiredObjectIsNullException();
        logger.info("Creating one product!");
        var upload = readImage(image);
        var entity = DozerMapper.parseObject(product, Product.class);
        entity.setId(null);
        entity.setFeatured(Boolean.TRUE.equals(product.getFeatured()));
        entity.setCreatedAt(LocalDateTime.now());
        entity.setPopularity(0);
        entity.setRating(null);
        entity.setReviewCount(0);
        applyImageMetadata(entity, upload);
        var saved = repository.save(entity);
        storeImage(saved.getId(), upload);
        return toDto(saved);
    }

    @Transactional
    public ProductDTO update(ProductRequestDTO product, MultipartFile image) {
        if (product == null) throw new RequiredObjectIsNullException();
        if (product.getId() == null) throw new BadRequestException("The product id is required");
        logger.info("Updating one product!");
        var upload = readImage(image);
        var entity = repository.getById(product.getId());
        entity.setName(product.getName());
        entity.setDescription(product.getDescription());
        entity.setPrice(product.getPrice());
        entity.setOldPrice(product.getOldPrice());
        entity.setCategory(product.getCategory());
        entity.setQuantity(product.getQuantity());
        entity.setColor(product.getColor());
        entity.setSize(product.getSize());
        entity.setFeatured(Boolean.TRUE.equals(product.getFeatured()));
        applyImageMetadata(entity, upload);
        var saved = repository.save(entity);
        storeImage(saved.getId(), upload);
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        logger.info("Deleting one product!");
        var entity = repository.getById(id);
        repository.delete(entity);
    }

    private ImageUpload readImage(MultipartFile image) {
        if (image == null || image.isEmpty()) return null;
        if (image.getSize() > MAX_IMAGE_SIZE) throw new InvalidImageException("The image exceeds the maximum upload size of 5 MB");
        byte[] bytes;
        try {
            bytes = image.getBytes();
        } catch (IOException e) {
            throw new InvalidImageException("The image could not be read");
        }
        var contentType = ImageTypeDetector.detect(bytes)
            .orElseThrow(() -> new InvalidImageException("Unsupported image type, use JPEG, PNG, WebP or GIF"));
        return new ImageUpload(bytes, contentType);
    }

    private void applyImageMetadata(Product entity, ImageUpload upload) {
        if (upload == null) return;
        entity.setImageContentType(upload.contentType());
        entity.setImageSize(upload.bytes().length);
    }

    private void storeImage(Long id, ImageUpload upload) {
        if (upload == null) return;
        imageRepository.updateImage(id, upload.bytes());
    }

    private void validateFilter(ProductFilter filter) {
        if (filter.minPrice() != null &&
                filter.maxPrice() != null &&
                filter.minPrice().compareTo(filter.maxPrice()) > 0) {
            throw new BadRequestException("minPrice must not be greater than maxPrice");
        }
    }

    private Pageable buildPageable(Integer page, Integer size, String direction, String sortBy) {
        var sortDirection = parseDirection(direction);
        var property = SORTABLE_FIELDS.get(sortBy);
        if (property == null) throw new BadRequestException("sortBy must be one of: name, price, createdAt, popularity, rating");
        var order = new Sort.Order(sortDirection, property);
        if ("rating".equals(property)) order = order.nullsLast();
        return PageRequest.of(page, size, Sort.by(order, Sort.Order.asc("id")));
    }

    private Sort.Direction parseDirection(String direction) {
        if ("asc".equalsIgnoreCase(direction)) return Sort.Direction.ASC;
        if ("desc".equalsIgnoreCase(direction)) return Sort.Direction.DESC;
        throw new BadRequestException("direction must be asc or desc");
    }

    private Page<Product> search(ProductFilter filter, Pageable pageable) {
        var p = toSearchParams(filter);
        return repository.search(
                p.pattern(), p.category(), p.minPrice(), p.maxPrice(),
                p.colorCount(), p.colors(), p.sizeCount(), p.sizes(), p.featuredOnly(),
                pageable);
    }

    private SearchParams toSearchParams(ProductFilter filter) {
        List<String> colors = filter.colors() == null ? List.of() : filter.colors();
        List<String> sizes = filter.sizes() == null ? List.of() : filter.sizes();
        return new SearchParams(
                likePattern(filter.q()),
                filter.category() == null ? "" : filter.category().trim(),
                filter.minPrice() == null ? BigDecimal.ZERO : filter.minPrice(),
                filter.maxPrice() == null ? MAX_FILTER_PRICE : filter.maxPrice(),
                colors.size(),
                colors.isEmpty() ? NO_VALUES : colors,
                sizes.size(),
                sizes.isEmpty() ? NO_VALUES : sizes,
                filter.featuredOnly());
    }

    private String likePattern(String q) {
        if (q == null || q.isBlank()) return "%";
        var escaped = q.trim()
            .toLowerCase(Locale.ROOT)
            .replace("!", "!!")
            .replace("%", "!%")
            .replace("_", "!_");
        return "%" + escaped + "%";
    }

    private List<FacetItemDTO> toFacetItems(List<Object[]> rows) {
        return rows.stream()
            .map(row -> new FacetItemDTO((String) row[0], ((Number) row[1]).longValue()))
            .toList();
    }

    private PagedModel<EntityModel<ProductDTO>> buildPagedModel(Page<Product> products, Link selfLink) {
        var dtos = products.map(this::toDto);
        return assembler.toModel(dtos, selfLink);
    }

    private ProductDTO toDto(Product entity) {
        var dto = DozerMapper.parseObject(entity, ProductDTO.class);
        if (entity.getImageSize() != null) dto.setImageUrl(imagePath(entity.getId()));
        addHateoasLinks(dto);
        return dto;
    }

    private String imagePath(Long id) {
        return linkTo(methodOn(ProductController.class).findImage(id)).toUri().getPath();
    }

    private void addHateoasLinks(ProductDTO dto) {
        dto.add(linkTo(methodOn(ProductController.class)
            .findById(dto.getId()))
            .withSelfRel().withType("GET"));

        dto.add(linkTo(methodOn(ProductController.class)
            .findAll(0, 12, "asc", "name", null, null, null, null, null, null, false))
            .withRel("findAll").withType("GET"));

        dto.add(linkTo(methodOn(ProductController.class)
            .create(null, null))
            .withRel("create").withType("POST"));

        dto.add(linkTo(methodOn(ProductController.class)
            .update(null, null))
            .withRel("update").withType("PUT"));

        dto.add(linkTo(methodOn(ProductController.class)
            .delete(dto.getId()))
            .withRel("delete").withType("DELETE"));

        if (dto.getImageUrl() != null) {
            dto.add(linkTo(methodOn(ProductController.class)
                .findImage(dto.getId()))
                .withRel("image").withType("GET"));
        }
    }

    private record ImageUpload(byte[] bytes, String contentType) {}

    private record SearchParams(
            String pattern,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            int colorCount,
            List<String> colors,
            int sizeCount,
            List<String> sizes,
            boolean featuredOnly) {}
}
