package br.com.erudio.integrationtests.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

public class ProductDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal oldPrice;
    private String category;
    private Integer quantity;
    private Boolean featured;
    private LocalDateTime createdAt;
    private String color;
    private String size;
    private Integer popularity;
    private BigDecimal rating;
    private Integer reviewCount;
    private String imageUrl;

    public ProductDTO() {}

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

    public Boolean getFeatured() {
        return featured;
    }

    public void setFeatured(Boolean featured) {
        this.featured = featured;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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

    public Integer getPopularity() {
        return popularity;
    }

    public void setPopularity(Integer popularity) {
        this.popularity = popularity;
    }

    public BigDecimal getRating() {
        return rating;
    }

    public void setRating(BigDecimal rating) {
        this.rating = rating;
    }

    public Integer getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(Integer reviewCount) {
        this.reviewCount = reviewCount;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        ProductDTO that = (ProductDTO) o;
        return Objects.equals(getId(), that.getId()) && Objects.equals(getName(), that.getName()) && Objects.equals(getDescription(), that.getDescription()) && Objects.equals(getPrice(), that.getPrice()) && Objects.equals(getOldPrice(), that.getOldPrice()) && Objects.equals(getCategory(), that.getCategory()) && Objects.equals(getQuantity(), that.getQuantity()) && Objects.equals(getFeatured(), that.getFeatured()) && Objects.equals(getCreatedAt(), that.getCreatedAt()) && Objects.equals(getColor(), that.getColor()) && Objects.equals(getSize(), that.getSize()) && Objects.equals(getPopularity(), that.getPopularity()) && Objects.equals(getRating(), that.getRating()) && Objects.equals(getReviewCount(), that.getReviewCount()) && Objects.equals(getImageUrl(), that.getImageUrl());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getName(), getDescription(), getPrice(), getOldPrice(), getCategory(), getQuantity(), getFeatured(), getCreatedAt(), getColor(), getSize(), getPopularity(), getRating(), getReviewCount(), getImageUrl());
    }
}
