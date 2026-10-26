package br.com.erudio.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import br.com.erudio.model.ProductImage;

public interface ProductImageRepository extends Repository<ProductImage, Long> {

    Optional<ProductImage> findById(Long id);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE ProductImage i SET i.image = :image WHERE i.id = :id")
    int updateImage(@Param("id") Long id, @Param("image") byte[] image);
}
