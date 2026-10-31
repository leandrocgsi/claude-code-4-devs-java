package br.com.erudio.repositories;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.erudio.model.Cart;
import br.com.erudio.model.CartStatus;

public interface CartRepository extends JpaRepository<Cart, Long> {

    @Query("""
            SELECT DISTINCT c FROM Cart c
            LEFT JOIN FETCH c.items i
            LEFT JOIN FETCH i.product
            WHERE c.token = :token
            """)
    Optional<Cart> findWithItemsByToken(@Param("token") String token);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Cart c WHERE c.status = :status AND c.updatedAt < :limit")
    int deleteAbandoned(@Param("status") CartStatus status, @Param("limit") LocalDateTime limit);
}
