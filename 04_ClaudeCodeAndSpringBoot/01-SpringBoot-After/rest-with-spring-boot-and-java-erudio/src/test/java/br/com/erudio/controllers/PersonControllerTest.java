package br.com.erudio.controllers;

import br.com.erudio.PersonServices;
import br.com.erudio.dto.PersonDTO;
import br.com.erudio.exception.PersonNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PersonController.class)
class PersonControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PersonServices personServices;

    @Test
    void findAll_returnsPagedPeople() throws Exception {
        PersonDTO dto = new PersonDTO();
        dto.setId(1L);
        dto.setFirstName("Albert");

        Page<PersonDTO> page = new PageImpl<>(List.of(dto), PageRequest.of(0, 10), 1);

        when(personServices.findAll(eq(null), eq(null), any())).thenReturn(page);

        mockMvc.perform(get("/person"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].firstName").value("Albert"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void findById_whenFound_returnsPerson() throws Exception {
        PersonDTO dto = new PersonDTO();
        dto.setId(1L);
        dto.setFirstName("Ada");

        when(personServices.findById("1")).thenReturn(dto);

        mockMvc.perform(get("/person/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.firstName").value("Ada"));
    }

    @Test
    void findById_whenNotFound_returns404() throws Exception {
        when(personServices.findById("99")).thenThrow(new PersonNotFoundException("No Person found with id 99"));

        mockMvc.perform(get("/person/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No Person found with id 99"));
    }

    @Test
    void create_withValidBody_returnsCreatedPerson() throws Exception {
        PersonDTO responseDTO = new PersonDTO();
        responseDTO.setId(1L);
        responseDTO.setFirstName("Marie");
        responseDTO.setLastName("Curie");
        responseDTO.setGender("Female");

        when(personServices.create(any(PersonDTO.class))).thenReturn(responseDTO);

        mockMvc.perform(post("/person")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Marie","lastName":"Curie","gender":"Female"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.firstName").value("Marie"));
    }

    @Test
    void create_withInvalidBody_returns400() throws Exception {
        mockMvc.perform(post("/person")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isNotEmpty());

        verify(personServices, never()).create(any());
    }

    @Test
    void update_returnsUpdatedPerson() throws Exception {
        PersonDTO responseDTO = new PersonDTO();
        responseDTO.setId(1L);
        responseDTO.setFirstName("Isaac");
        responseDTO.setLastName("Newton");
        responseDTO.setGender("Male");

        when(personServices.update(any(PersonDTO.class))).thenReturn(responseDTO);

        mockMvc.perform(put("/person")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"id":1,"firstName":"Isaac","lastName":"Newton","gender":"Male"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Isaac"));
    }

    @Test
    void delete_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/person/1"))
                .andExpect(status().isNoContent());

        verify(personServices).delete("1");
    }

    @Test
    void findByCreationYear_returnsListOfPeople() throws Exception {
        PersonDTO dto = new PersonDTO();
        dto.setId(1L);
        dto.setFirstName("Albert");

        when(personServices.findByCreationYear(2026)).thenReturn(List.of(dto));

        mockMvc.perform(get("/person/search/by-year").param("year", "2026"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].firstName").value("Albert"));
    }
}
