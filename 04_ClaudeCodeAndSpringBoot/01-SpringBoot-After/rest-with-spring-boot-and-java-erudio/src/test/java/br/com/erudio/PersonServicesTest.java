package br.com.erudio;

import br.com.erudio.dto.AddressDTO;
import br.com.erudio.dto.PersonDTO;
import br.com.erudio.exception.PersonNotFoundException;
import br.com.erudio.mapper.PersonMapper;
import br.com.erudio.model.Address;
import br.com.erudio.model.Person;
import br.com.erudio.repository.AddressRepository;
import br.com.erudio.repository.PersonRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PersonServicesTest {

    @Mock
    private PersonRepository repository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private PersonMapper mapper;

    @InjectMocks
    private PersonServices personServices;

    @Test
    void findAll_withFirstNameFilter_callsFindByFirstNameContainingIgnoreCaseAndDeletedAtIsNull() {
        Pageable pageable = PageRequest.of(0, 10);

        Person person = new Person();
        person.setId(1L);
        person.setFirstName("Albert");

        PersonDTO dto = new PersonDTO();
        dto.setId(1L);
        dto.setFirstName("Albert");

        when(repository.findByFirstNameContainingIgnoreCaseAndDeletedAtIsNull("Albert", pageable))
                .thenReturn(new PageImpl<>(List.of(person)));
        when(mapper.toDTO(person)).thenReturn(dto);

        Page<PersonDTO> result = personServices.findAll("Albert", null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("Albert", result.getContent().get(0).getFirstName());
        verify(repository, never()).findByDeletedAtIsNull(any());
        verify(repository, never()).findByGenderIgnoreCaseAndDeletedAtIsNull(any(), any());
    }

    @Test
    void findAll_withGenderFilter_callsFindByGenderIgnoreCaseAndDeletedAtIsNull() {
        Pageable pageable = PageRequest.of(0, 10);

        Person person = new Person();
        person.setId(2L);
        person.setGender("Female");

        PersonDTO dto = new PersonDTO();
        dto.setId(2L);
        dto.setGender("Female");

        when(repository.findByGenderIgnoreCaseAndDeletedAtIsNull("Female", pageable))
                .thenReturn(new PageImpl<>(List.of(person)));
        when(mapper.toDTO(person)).thenReturn(dto);

        Page<PersonDTO> result = personServices.findAll(null, "Female", pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("Female", result.getContent().get(0).getGender());
        verify(repository, never()).findByDeletedAtIsNull(any());
        verify(repository, never()).findByFirstNameContainingIgnoreCaseAndDeletedAtIsNull(any(), any());
    }

    @Test
    void findAll_withoutFilters_callsFindByDeletedAtIsNull() {
        Pageable pageable = PageRequest.of(0, 10);

        Person person = new Person();
        person.setId(3L);

        PersonDTO dto = new PersonDTO();
        dto.setId(3L);

        when(repository.findByDeletedAtIsNull(pageable))
                .thenReturn(new PageImpl<>(List.of(person)));
        when(mapper.toDTO(person)).thenReturn(dto);

        Page<PersonDTO> result = personServices.findAll(null, null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(3L, result.getContent().get(0).getId());
    }

    @Test
    void findById_whenFound_returnsMappedDTO() {
        Person person = new Person();
        person.setId(1L);

        PersonDTO dto = new PersonDTO();
        dto.setId(1L);

        when(repository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(person));
        when(mapper.toDTO(person)).thenReturn(dto);

        PersonDTO result = personServices.findById("1");

        assertEquals(1L, result.getId());
    }

    @Test
    void findById_whenNotFound_throwsPersonNotFoundException() {
        when(repository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());

        assertThrows(PersonNotFoundException.class, () -> personServices.findById("99"));
        verify(repository).findByIdAndDeletedAtIsNull(99L);
        verify(mapper, never()).toDTO(any());
    }

    @Test
    void create_withoutAddress_savesPersonAndReturnsDTO() {
        PersonDTO inputDTO = new PersonDTO();
        inputDTO.setFirstName("Ada");

        Person person = new Person();
        person.setFirstName("Ada");

        Person savedPerson = new Person();
        savedPerson.setId(1L);
        savedPerson.setFirstName("Ada");

        PersonDTO outputDTO = new PersonDTO();
        outputDTO.setId(1L);
        outputDTO.setFirstName("Ada");

        when(mapper.toEntity(inputDTO)).thenReturn(person);
        when(repository.save(person)).thenReturn(savedPerson);
        when(mapper.toDTO(savedPerson)).thenReturn(outputDTO);

        PersonDTO result = personServices.create(inputDTO);

        assertEquals(outputDTO, result);
        verify(repository).save(person);
        verify(addressRepository, never()).save(any());
    }

    @Test
    void create_withAddress_persistsAddressBeforeSavingPerson() {
        AddressDTO addressDTO = new AddressDTO();
        addressDTO.setCity("London");

        PersonDTO inputDTO = new PersonDTO();
        inputDTO.setFirstName("Ada");
        inputDTO.setAddress(addressDTO);

        Address address = new Address();
        address.setCity("London");

        Person person = new Person();
        person.setFirstName("Ada");
        person.setAddress(address);

        Address savedAddress = new Address();
        savedAddress.setId(5L);
        savedAddress.setCity("London");

        Person savedPerson = new Person();
        savedPerson.setId(1L);

        PersonDTO outputDTO = new PersonDTO();
        outputDTO.setId(1L);

        when(mapper.toEntity(inputDTO)).thenReturn(person);
        when(addressRepository.save(address)).thenReturn(savedAddress);
        when(repository.save(person)).thenReturn(savedPerson);
        when(mapper.toDTO(savedPerson)).thenReturn(outputDTO);

        PersonDTO result = personServices.create(inputDTO);

        assertEquals(savedAddress, person.getAddress());
        assertEquals(1L, result.getId());
        verify(addressRepository).save(address);
    }

    @Test
    void update_savesPersonAndReturnsDTO() {
        PersonDTO inputDTO = new PersonDTO();
        inputDTO.setId(1L);
        inputDTO.setFirstName("Ada");

        Person person = new Person();
        person.setId(1L);
        person.setFirstName("Ada");

        Person updatedPerson = new Person();
        updatedPerson.setId(1L);
        updatedPerson.setFirstName("Ada");

        PersonDTO outputDTO = new PersonDTO();
        outputDTO.setId(1L);
        outputDTO.setFirstName("Ada");

        when(mapper.toEntity(inputDTO)).thenReturn(person);
        when(repository.save(person)).thenReturn(updatedPerson);
        when(mapper.toDTO(updatedPerson)).thenReturn(outputDTO);

        PersonDTO result = personServices.update(inputDTO);

        assertEquals("Ada", result.getFirstName());
        verify(addressRepository, never()).save(any());
    }

    @Test
    void findByCreationYear_returnsMappedList() {
        Person person = new Person();
        person.setId(1L);

        PersonDTO dto = new PersonDTO();
        dto.setId(1L);

        when(repository.findByCreationYear(2026)).thenReturn(List.of(person));
        when(mapper.toDTO(person)).thenReturn(dto);

        List<PersonDTO> result = personServices.findByCreationYear(2026);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void delete_whenFound_setsDeletedAtAndSaves() {
        Person person = new Person();
        person.setId(1L);

        when(repository.findById(1L)).thenReturn(Optional.of(person));

        personServices.delete("1");

        assertNotNull(person.getDeletedAt());
        verify(repository).save(person);
        verify(repository, never()).deleteById(any());
    }

    @Test
    void delete_whenNotFound_throwsEmptyResultDataAccessException() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(EmptyResultDataAccessException.class, () -> personServices.delete("99"));
    }
}
