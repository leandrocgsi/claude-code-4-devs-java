package br.com.erudio;

import br.com.erudio.dto.PersonDTO;
import br.com.erudio.exception.PersonNotFoundException;
import br.com.erudio.mapper.PersonMapper;
import br.com.erudio.model.Person;
import br.com.erudio.repository.AddressRepository;
import br.com.erudio.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class PersonServices {

    private Logger logger = Logger.getLogger(PersonServices.class.getName());

    @Autowired
    private PersonRepository repository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private PersonMapper mapper;

    public Page<PersonDTO> findAll(String firstName, String gender, Pageable pageable) {
        logger.info("Finding all People!");

        if (firstName != null && !firstName.isBlank()) {
            return repository.findByFirstNameContainingIgnoreCaseAndDeletedAtIsNull(firstName, pageable)
                    .map(mapper::toDTO);
        }

        if (gender != null && !gender.isBlank()) {
            return repository.findByGenderIgnoreCaseAndDeletedAtIsNull(gender, pageable)
                    .map(mapper::toDTO);
        }

        return repository.findByDeletedAtIsNull(pageable)
                .map(mapper::toDTO);
    }

    public List<PersonDTO> findByCreationYear(Integer year) {
        logger.info("Finding People by creation year!");
        return repository.findByCreationYear(year)
                .stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public PersonDTO findById(String id) {
        logger.info("Finding one Person!");
        Person person = repository.findByIdAndDeletedAtIsNull(Long.parseLong(id))
                .orElseThrow(() -> new PersonNotFoundException("No Person found with id " + id));
        return mapper.toDTO(person);
    }

    public PersonDTO create(PersonDTO personDTO) {
        logger.info("Creating one Person!");
        Person person = mapper.toEntity(personDTO);
        persistAddressIfPresent(person);
        Person savedPerson = repository.save(person);
        return mapper.toDTO(savedPerson);
    }

    public PersonDTO update(PersonDTO personDTO) {
        logger.info("Updating one Person!");
        Person person = mapper.toEntity(personDTO);
        persistAddressIfPresent(person);
        Person updatedPerson = repository.save(person);
        return mapper.toDTO(updatedPerson);
    }

    private void persistAddressIfPresent(Person person) {
        if (person.getAddress() != null) {
            person.setAddress(addressRepository.save(person.getAddress()));
        }
    }

    public void delete(String id) {
        logger.info("Deleting one Person!");
        Person person = repository.findById(Long.parseLong(id))
                .orElseThrow(() -> new EmptyResultDataAccessException("No Person entity with id " + id + " exists!", 1));
        person.setDeletedAt(LocalDateTime.now());
        repository.save(person);
    }
}

