package br.com.erudio.controllers.docs;

import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import br.com.erudio.data.dto.ProductDTO;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Product", description = "Endpoints for Managing Products")
public interface ProductControllerDocs {

    @Operation(summary = "Find All Products",
        description = "Finds All Products",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Success", responseCode = "200",
                content = @Content(
                    mediaType = MediaType.APPLICATION_JSON_VALUE,
                    array = @ArraySchema(schema = @Schema(implementation = ProductDTO.class)))),
            @ApiResponse(description = "No Content",            responseCode = "204", content = @Content),
            @ApiResponse(description = "Bad Request",           responseCode = "400", content = @Content),
            @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
        })
    Page<ProductDTO> findAll(
        @RequestParam(value = "page",      defaultValue = "0")   Integer page,
        @RequestParam(value = "size",      defaultValue = "12")  Integer size,
        @RequestParam(value = "direction", defaultValue = "asc") String direction);

    @Operation(summary = "Finds a Product",
        description = "Find a specific Product by its ID",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Success", responseCode = "200",
                content = @Content(schema = @Schema(implementation = ProductDTO.class))),
            @ApiResponse(description = "Bad Request",           responseCode = "400", content = @Content),
            @ApiResponse(description = "Not Found",             responseCode = "404", content = @Content),
            @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
        })
    ProductDTO findById(@Parameter(description = "Product ID") @PathVariable("id") Long id);

    @Operation(summary = "Create a Product",
        description = "Creates a new Product by passing in a JSON representation",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Created", responseCode = "200",
                content = @Content(schema = @Schema(implementation = ProductDTO.class))),
            @ApiResponse(description = "Bad Request",           responseCode = "400", content = @Content),
            @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
        })
    ProductDTO create(@RequestBody ProductDTO product);

    @Operation(summary = "Update a Product",
        description = "Updates a Product by passing in a JSON representation",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "Updated", responseCode = "200",
                content = @Content(schema = @Schema(implementation = ProductDTO.class))),
            @ApiResponse(description = "Bad Request",           responseCode = "400", content = @Content),
            @ApiResponse(description = "Not Found",             responseCode = "404", content = @Content),
            @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
        })
    ProductDTO update(@RequestBody ProductDTO product);

    @Operation(summary = "Delete a Product",
        description = "Deletes a Product by its ID",
        tags = {"Product"},
        responses = {
            @ApiResponse(description = "No Content",            responseCode = "204", content = @Content),
            @ApiResponse(description = "Bad Request",           responseCode = "400", content = @Content),
            @ApiResponse(description = "Not Found",             responseCode = "404", content = @Content),
            @ApiResponse(description = "Internal Server Error", responseCode = "500", content = @Content)
        })
    ResponseEntity<?> delete(@Parameter(description = "Product ID") @PathVariable("id") Long id);
}
