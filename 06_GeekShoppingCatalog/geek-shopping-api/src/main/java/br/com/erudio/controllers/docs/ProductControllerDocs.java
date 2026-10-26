package br.com.erudio.controllers.docs;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.PagedModel;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import br.com.erudio.data.dto.CategoryDTO;
import br.com.erudio.data.dto.FacetsDTO;
import br.com.erudio.data.dto.ProductDTO;
import br.com.erudio.data.dto.request.ProductRequestDTO;
import br.com.erudio.exception.ExceptionResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;

public interface ProductControllerDocs {

    @Operation(summary = "Find All Products",
        description = "Finds products with pagination, sorting by name, price, createdAt, popularity or rating, and filters combined with AND. "
            + "The color and productSize filters can be repeated and then work as OR.",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Success", responseCode = "200", content = @Content),
            @ApiResponse(description = "Bad Request", responseCode = "400",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class))),
            @ApiResponse(description = "Internal Server Error", responseCode = "500",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class)))
        })
    ResponseEntity<PagedModel<EntityModel<ProductDTO>>> findAll(
        @Parameter(description = "Page number, starting at 0")
        @RequestParam(value = "page", defaultValue = "0") @Min(0) Integer page,
        @Parameter(description = "Page size, from 1 to 100")
        @RequestParam(value = "size", defaultValue = "12") @Min(1) @Max(100) Integer size,
        @Parameter(description = "Sort direction: asc or desc")
        @RequestParam(value = "direction", defaultValue = "asc") String direction,
        @Parameter(description = "Sort field: name, price, createdAt, popularity or rating")
        @RequestParam(value = "sortBy", defaultValue = "name") String sortBy,
        @Parameter(description = "Text searched in the name and in the description")
        @RequestParam(value = "q", required = false) String q,
        @Parameter(description = "Category name")
        @RequestParam(value = "category", required = false) String category,
        @Parameter(description = "Minimum price")
        @RequestParam(value = "minPrice", required = false) @PositiveOrZero BigDecimal minPrice,
        @Parameter(description = "Maximum price")
        @RequestParam(value = "maxPrice", required = false) @PositiveOrZero BigDecimal maxPrice,
        @Parameter(description = "Color name, repeatable")
        @RequestParam(value = "color", required = false) List<String> colors,
        @Parameter(description = "Product size name, repeatable")
        @RequestParam(value = "productSize", required = false) List<String> productSizes,
        @Parameter(description = "Only featured products")
        @RequestParam(value = "featured", defaultValue = "false") Boolean featured);

    @Operation(summary = "Find Featured Products",
        description = "Finds the featured products, most popular first",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Success", responseCode = "200", content = @Content),
            @ApiResponse(description = "Bad Request", responseCode = "400",
                content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(description = "Internal Server Error", responseCode = "500",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class)))
        })
    ResponseEntity<PagedModel<EntityModel<ProductDTO>>> findFeatured(
        @Parameter(description = "Page number, starting at 0")
        @RequestParam(value = "page", defaultValue = "0") @Min(0) Integer page,
        @Parameter(description = "Page size, from 1 to 100")
        @RequestParam(value = "size", defaultValue = "12") @Min(1) @Max(100) Integer size);

    @Operation(summary = "Find Recent Products",
        description = "Finds the most recently created products first",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Success", responseCode = "200", content = @Content),
            @ApiResponse(description = "Bad Request", responseCode = "400",
                content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(description = "Internal Server Error", responseCode = "500",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class)))
        })
    ResponseEntity<PagedModel<EntityModel<ProductDTO>>> findRecent(
        @Parameter(description = "Page number, starting at 0")
        @RequestParam(value = "page", defaultValue = "0") @Min(0) Integer page,
        @Parameter(description = "Page size, from 1 to 100")
        @RequestParam(value = "size", defaultValue = "12") @Min(1) @Max(100) Integer size);

    @Operation(summary = "Find Product Facets",
        description = "Counts the filtered products by price range, color, size and category",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Success", responseCode = "200",
                content = @Content(schema = @Schema(implementation = FacetsDTO.class))),
            @ApiResponse(description = "Bad Request", responseCode = "400",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class))),
            @ApiResponse(description = "Internal Server Error", responseCode = "500",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class)))
        })
    FacetsDTO findFacets(
        @Parameter(description = "Text searched in the name and in the description")
        @RequestParam(value = "q", required = false) String q,
        @Parameter(description = "Category name")
        @RequestParam(value = "category", required = false) String category,
        @Parameter(description = "Minimum price")
        @RequestParam(value = "minPrice", required = false) @PositiveOrZero BigDecimal minPrice,
        @Parameter(description = "Maximum price")
        @RequestParam(value = "maxPrice", required = false) @PositiveOrZero BigDecimal maxPrice,
        @Parameter(description = "Color name, repeatable")
        @RequestParam(value = "color", required = false) List<String> colors,
        @Parameter(description = "Product size name, repeatable")
        @RequestParam(value = "productSize", required = false) List<String> productSizes,
        @Parameter(description = "Only featured products")
        @RequestParam(value = "featured", defaultValue = "false") Boolean featured);

    @Operation(summary = "Find Product Categories",
        description = "Lists the categories derived from the products, with the product count and an image of a product of the category",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Success", responseCode = "200",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = CategoryDTO.class)))),
            @ApiResponse(description = "Internal Server Error", responseCode = "500",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class)))
        })
    List<CategoryDTO> findCategories();

    @Operation(summary = "Finds a Product",
        description = "Find a specific Product by its ID",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Success", responseCode = "200",
                content = @Content(schema = @Schema(implementation = ProductDTO.class))),
            @ApiResponse(description = "Bad Request", responseCode = "400",
                content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(description = "Not Found", responseCode = "404",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class))),
            @ApiResponse(description = "Internal Server Error", responseCode = "500",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class)))
        })
    ProductDTO findById(@Parameter(description = "Product ID") @PathVariable("id") Long id);

    @Operation(summary = "Finds the image of a Product",
        description = "Returns the image bytes stored for the Product, with its content type and an ETag",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Success", responseCode = "200",
                content = {
                    @Content(mediaType = "image/jpeg"),
                    @Content(mediaType = "image/png"),
                    @Content(mediaType = "image/webp"),
                    @Content(mediaType = "image/gif")
                }),
            @ApiResponse(description = "Not Found", responseCode = "404",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class))),
            @ApiResponse(description = "Internal Server Error", responseCode = "500",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class)))
        })
    ResponseEntity<byte[]> findImage(@Parameter(description = "Product ID") @PathVariable("id") Long id);

    @Operation(summary = "Create a Product",
        description = "Creates a new Product from a multipart request: the part product carries the JSON and the optional part image carries the file (JPEG, PNG, WebP or GIF, up to 5 MB)",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Created", responseCode = "201",
                content = @Content(schema = @Schema(implementation = ProductDTO.class))),
            @ApiResponse(description = "Bad Request", responseCode = "400",
                content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(description = "Internal Server Error", responseCode = "500",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class)))
        })
    ResponseEntity<ProductDTO> create(
        @Valid @RequestPart("product") ProductRequestDTO product,
        @RequestPart(value = "image", required = false) MultipartFile image);

    @Operation(summary = "Update a Product",
        description = "Updates a Product from a multipart request: the part product carries the JSON with the id and the optional part image replaces the current image; without it the current image is kept",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Updated", responseCode = "200",
                content = @Content(schema = @Schema(implementation = ProductDTO.class))),
            @ApiResponse(description = "Bad Request", responseCode = "400",
                content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(description = "Not Found", responseCode = "404",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class))),
            @ApiResponse(description = "Internal Server Error", responseCode = "500",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class)))
        })
    ProductDTO update(
        @Valid @RequestPart("product") ProductRequestDTO product,
        @RequestPart(value = "image", required = false) MultipartFile image);

    @Operation(summary = "Delete a Product",
        description = "Deletes a Product by its ID",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "No Content", responseCode = "204", content = @Content),
            @ApiResponse(description = "Bad Request", responseCode = "400",
                content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(description = "Not Found", responseCode = "404",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class))),
            @ApiResponse(description = "Internal Server Error", responseCode = "500",
                content = @Content(schema = @Schema(implementation = ExceptionResponse.class)))
        })
    ResponseEntity<?> delete(@Parameter(description = "Product ID") @PathVariable("id") Long id);
}
