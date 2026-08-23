package br.com.erudio.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import br.com.erudio.model.Address;

@Repository
public interface AddressRepository extends JpaRepository<Address, Long> {

}
