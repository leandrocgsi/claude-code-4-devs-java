package br.com.erudio.integrationtests.dto.wrappers.json;

import java.io.Serializable;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import br.com.erudio.integrationtests.dto.ProductDTO;

public class ProductEmbeddedDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("products")
    private List<ProductDTO> products;

    public ProductEmbeddedDTO() {}

    public List<ProductDTO> getProducts() {
        return products;
    }

    public void setProducts(List<ProductDTO> products) {
        this.products = products;
    }
}
