package br.com.erudio.controllers;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.IanaLinkRelations;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.erudio.controllers.docs.ProductControllerDocs;
import br.com.erudio.data.dto.CategoryDTO;
import br.com.erudio.data.dto.FacetsDTO;
import br.com.erudio.data.dto.ProductDTO;
import br.com.erudio.data.dto.request.ProductFilter;
import br.com.erudio.data.dto.request.ProductRequestDTO;
import br.com.erudio.services.ProductService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/product/v1")
@Tag(name = "Product", description = "Endpoints for Managing Products")
public class ProductController implements ProductControllerDocs {

    @Autowired
    private ProductService service;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ResponseEntity<PagedModel<EntityModel<ProductDTO>>> findAll(
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "12") Integer size,
            @RequestParam(value = "direction", defaultValue = "asc") String direction,
            @RequestParam(value = "sortBy", defaultValue = "name") String sortBy,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(value = "maxPrice", required = false) BigDecimal maxPrice,
            @RequestParam(value = "color", required = false) List<String> colors,
            @RequestParam(value = "productSize", required = false) List<String> productSizes,
            @RequestParam(value = "featured", defaultValue = "false") Boolean featured) {
        var filter = new ProductFilter(q, category, minPrice, maxPrice, colors, productSizes, featured);
        return ResponseEntity.ok(service.findAll(page, size, direction, sortBy, filter));
    }

    @GetMapping(value = "/featured", produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ResponseEntity<PagedModel<EntityModel<ProductDTO>>> findFeatured(
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "12") Integer size) {
        return ResponseEntity.ok(service.findFeatured(page, size));
    }

    @GetMapping(value = "/recent", produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ResponseEntity<PagedModel<EntityModel<ProductDTO>>> findRecent(
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "12") Integer size) {
        return ResponseEntity.ok(service.findRecent(page, size));
    }

    @GetMapping(value = "/facets", produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public FacetsDTO findFacets(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(value = "maxPrice", required = false) BigDecimal maxPrice,
            @RequestParam(value = "color", required = false) List<String> colors,
            @RequestParam(value = "productSize", required = false) List<String> productSizes,
            @RequestParam(value = "featured", defaultValue = "false") Boolean featured) {
        var filter = new ProductFilter(q, category, minPrice, maxPrice, colors, productSizes, featured);
        return service.findFacets(filter);
    }

    @GetMapping(value = "/categories", produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public List<CategoryDTO> findCategories() {
        return service.findCategories();
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ProductDTO findById(@PathVariable("id") Long id) {
        return service.findById(id);
    }

    @GetMapping(value = "/{id}/image", produces = {
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/webp",
            MediaType.IMAGE_GIF_VALUE,
            MediaType.APPLICATION_JSON_VALUE})
    @Override
    public ResponseEntity<byte[]> findImage(@PathVariable("id") Long id) {
        var image = service.findImage(id);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(image.getContentType()))
            .eTag(DigestUtils.md5DigestAsHex(image.getImage()))
            .cacheControl(CacheControl.noCache().cachePublic())
            .body(image.getImage());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ResponseEntity<ProductDTO> create(
            @RequestPart("product") ProductRequestDTO product,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        var created = service.create(product, image);
        var location = created.getRequiredLink(IanaLinkRelations.SELF).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ProductDTO update(
            @RequestPart("product") ProductRequestDTO product,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        return service.update(product, image);
    }

    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    @Override
    public ResponseEntity<?> delete(@PathVariable("id") Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
