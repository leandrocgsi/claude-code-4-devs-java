package br.com.erudio.model;

import java.io.Serializable;
import java.util.Arrays;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
public class ProductImage implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    private Long id;

    @Lob
    @Column(name = "image")
    private byte[] image;

    @Column(name = "image_content_type", insertable = false, updatable = false)
    private String contentType;

    public ProductImage() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public byte[] getImage() {
        return image;
    }

    public void setImage(byte[] image) {
        this.image = image;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        ProductImage that = (ProductImage) o;
        return Objects.equals(getId(), that.getId()) && Arrays.equals(getImage(), that.getImage()) && Objects.equals(getContentType(), that.getContentType());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), Arrays.hashCode(getImage()), getContentType());
    }
}
