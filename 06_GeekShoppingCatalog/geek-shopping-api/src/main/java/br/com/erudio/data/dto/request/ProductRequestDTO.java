package br.com.erudio.data.dto.request;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Objects;

import br.com.erudio.validation.OldPriceGreaterThanPrice;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

@OldPriceGreaterThanPrice
public class ProductRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;

    @NotBlank
    @Size(max = 150)
    private String name;

    @NotBlank
    @Size(max = 255)
    private String description;

    @NotNull
    @Positive
    @Digits(integer = 9, fraction = 2)
    private BigDecimal price;

    @Positive
    @Digits(integer = 9, fraction = 2)
    private BigDecimal oldPrice;

    @NotBlank
    @Size(max = 100)
    private String category;

    @NotNull
    @PositiveOrZero
    private Integer quantity;

    @Size(max = 50)
    private String color;

    @Size(max = 20)
    private String size;

    private Boolean featured;

    public ProductRequestDTO() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BigDecimal getOldPrice() {
        return oldPrice;
    }

    public void setOldPrice(BigDecimal oldPrice) {
        this.oldPrice = oldPrice;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public Boolean getFeatured() {
        return featured;
    }

    public void setFeatured(Boolean featured) {
        this.featured = featured;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        ProductRequestDTO that = (ProductRequestDTO) o;
        return Objects.equals(getId(), that.getId()) && Objects.equals(getName(), that.getName()) && Objects.equals(getDescription(), that.getDescription()) && Objects.equals(getPrice(), that.getPrice()) && Objects.equals(getOldPrice(), that.getOldPrice()) && Objects.equals(getCategory(), that.getCategory()) && Objects.equals(getQuantity(), that.getQuantity()) && Objects.equals(getColor(), that.getColor()) && Objects.equals(getSize(), that.getSize()) && Objects.equals(getFeatured(), that.getFeatured());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getName(), getDescription(), getPrice(), getOldPrice(), getCategory(), getQuantity(), getColor(), getSize(), getFeatured());
    }
}
