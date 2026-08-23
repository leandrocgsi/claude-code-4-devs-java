package br.com.erudio;

import br.com.erudio.dto.PersonDTO;
import br.com.erudio.model.Person;
import br.com.erudio.repository.PersonRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class PersonServices {

    private Logger logger = Logger.getLogger(PersonServices.class.getName());

    @Autowired
    private PersonRepository repository;

    @Autowired
    private ModelMapper modelMapper;

    public List<PersonDTO> findAll() {
        logger.info("Finding all People!");
        return repository.findAll()
                .stream()
                .map(person -> modelMapper.map(person, PersonDTO.class))
                .collect(Collectors.toList());
    }

    public PersonDTO findById(String id) {
        logger.info("Finding one Person!");
        Person person = repository.findById(Long.parseLong(id)).orElse(null);
        return person != null ? modelMapper.map(person, PersonDTO.class) : null;
    }

    public PersonDTO create(PersonDTO personDTO) {
        logger.info("Creating one Person!");
        Person person = modelMapper.map(personDTO, Person.class);
        Person savedPerson = repository.save(person);
        return modelMapper.map(savedPerson, PersonDTO.class);
    }

    public PersonDTO update(PersonDTO personDTO) {
        logger.info("Updating one Person!");
        Person person = modelMapper.map(personDTO, Person.class);
        Person updatedPerson = repository.save(person);
        return modelMapper.map(updatedPerson, PersonDTO.class);
    }

    public void delete(String id) {
        logger.info("Deleting one Person!");
        repository.deleteById(Long.parseLong(id));
    }
}

