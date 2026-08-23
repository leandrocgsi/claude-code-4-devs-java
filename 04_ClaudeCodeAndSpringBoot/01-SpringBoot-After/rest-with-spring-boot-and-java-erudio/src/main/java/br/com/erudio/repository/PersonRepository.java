package br.com.erudio.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import br.com.erudio.model.Person;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {

    Page<Person> findByFirstNameContainingIgnoreCase(String firstName, Pageable pageable);

    Page<Person> findByGenderIgnoreCase(String gender, Pageable pageable);

    Page<Person> findByDeletedAtIsNull(Pageable pageable);

    Page<Person> findByFirstNameContainingIgnoreCaseAndDeletedAtIsNull(String firstName, Pageable pageable);

    Page<Person> findByGenderIgnoreCaseAndDeletedAtIsNull(String gender, Pageable pageable);

    Optional<Person> findByIdAndDeletedAtIsNull(Long id);

    @Query("SELECT p FROM Person p WHERE p.firstName LIKE %:firstName% AND p.deletedAt IS NULL")
    List<Person> findActiveByFirstName(@Param("firstName") String firstName);

    @Query(value = "SELECT * FROM person WHERE YEAR(created_at) = ?1 AND deleted_at IS NULL", nativeQuery = true)
    List<Person> findByCreationYear(Integer year);
}
