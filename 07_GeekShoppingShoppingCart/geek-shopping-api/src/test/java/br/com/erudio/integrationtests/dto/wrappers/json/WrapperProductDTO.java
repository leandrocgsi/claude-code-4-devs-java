package br.com.erudio.integrationtests.dto.wrappers.json;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonProperty;

public class WrapperProductDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("_embedded")
    private ProductEmbeddedDTO embedded;

    public WrapperProductDTO() {}

    public ProductEmbeddedDTO getEmbedded() {
        return embedded;
    }

    public void setEmbedded(ProductEmbeddedDTO embedded) {
        this.embedded = embedded;
    }
}
