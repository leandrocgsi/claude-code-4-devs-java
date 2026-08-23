package br.com.erudio.controllers;

import br.com.erudio.PersonServices;
import br.com.erudio.dto.PersonDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/person")
public class PersonController {

    @Autowired
    private PersonServices service;

    @Operation(summary = "List all people")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "People found and returned")
    })
    @RequestMapping(method = RequestMethod.GET,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public Page<PersonDTO> findAll(
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String gender,
            Pageable pageable) {
        return service.findAll(firstName, gender, pageable);
    }

    @Operation(summary = "Find active people created in a given year")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "People found and returned")
    })
    @RequestMapping(value = "/search/by-year",
        method = RequestMethod.GET,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public List<PersonDTO> findByCreationYear(@RequestParam Integer year) {
        return service.findByCreationYear(year);
    }

    @Operation(summary = "Find a person by id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Person found and returned"),
            @ApiResponse(responseCode = "404", description = "Person not found or has been deleted"),
            @ApiResponse(responseCode = "500", description = "Id is not a valid number")
    })
    @RequestMapping(value = "/{id}",
        method = RequestMethod.GET,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public PersonDTO findById(@PathVariable("id") String id) {
        return service.findById(id);
    }

    @Operation(summary = "Create a new person")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Person created and returned"),
            @ApiResponse(responseCode = "400", description = "Validation failed for one or more fields")
    })
    @RequestMapping(
        method = RequestMethod.POST,
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public PersonDTO create(@Valid @RequestBody PersonDTO personDTO) {
        return service.create(personDTO);
    }

    @Operation(summary = "Update an existing person")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Person updated and returned"),
            @ApiResponse(responseCode = "400", description = "Validation failed for one or more fields")
    })
    @RequestMapping(
        method = RequestMethod.PUT,
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public PersonDTO update(@Valid @RequestBody PersonDTO personDTO) {
        return service.update(personDTO);
    }

    @Operation(summary = "Delete a person by id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Person deleted"),
            @ApiResponse(responseCode = "500", description = "Id is not a valid number")
    })
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @RequestMapping(value = "/{id}",
            method = RequestMethod.DELETE
    )
    public void delete(@PathVariable("id") String id) {
        service.delete(id);
    }
}
