package br.com.erudio.services;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

import java.util.logging.Logger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import br.com.erudio.controllers.ProductController;
import br.com.erudio.data.dto.ProductDTO;
import br.com.erudio.exception.RequiredObjectIsNullException;
import br.com.erudio.mapper.DozerMapper;
import br.com.erudio.model.Product;
import br.com.erudio.repositories.ProductRepository;

@Service
public class ProductService {

    Logger logger = Logger.getLogger(ProductService.class.getName());

    @Autowired
    private ProductRepository repository;

    public ProductDTO findById(Long id) {
        logger.info("Finding one product!");
        var entity = repository.getById(id);
        var dto = DozerMapper.parseObject(entity, ProductDTO.class);
        dto.add(linkTo(methodOn(ProductController.class).findById(id)).withSelfRel());
        return dto;
    }

    public Page<ProductDTO> findAll(Pageable pageable) {
        logger.info("Finding all products!");
        return repository.findAll(pageable)
            .map(entity -> {
                var dto = DozerMapper.parseObject(entity, ProductDTO.class);
                dto.add(linkTo(methodOn(ProductController.class).findById(dto.getId())).withSelfRel());
                return dto;
            });
    }

    public ProductDTO create(ProductDTO product) {
        if (product == null) throw new RequiredObjectIsNullException();
        logger.info("Creating one product!");
        var entity = DozerMapper.parseObject(product, Product.class);
        var dto = DozerMapper.parseObject(repository.save(entity), ProductDTO.class);
        dto.add(linkTo(methodOn(ProductController.class).findById(dto.getId())).withSelfRel());
        return dto;
    }

    public ProductDTO update(ProductDTO product) {
        if (product == null) throw new RequiredObjectIsNullException();
        logger.info("Updating one product!");
        var entity = repository.getById(product.getId());
        entity.setName(product.getName());
        entity.setDescription(product.getDescription());
        entity.setPrice(product.getPrice());
        entity.setCategory(product.getCategory());
        entity.setImageUrl(product.getImageUrl());
        entity.setQuantity(product.getQuantity());
        var dto = DozerMapper.parseObject(repository.save(entity), ProductDTO.class);
        dto.add(linkTo(methodOn(ProductController.class).findById(dto.getId())).withSelfRel());
        return dto;
    }

    public void delete(Long id) {
        logger.info("Deleting one product!");
        var entity = repository.getById(id);
        repository.delete(entity);
    }
}
