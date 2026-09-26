package br.com.erudio.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.erudio.exception.ResourceNotFoundException;
import br.com.erudio.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

    default Product getById(Long id) {
        return findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("No records found for this ID!"));
    }
}
