package br.com.erudio.model;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "products")
public class Product implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 255)
    private String description;

    @Column(nullable = false, precision = 65, scale = 2)
    private BigDecimal price;

    @Column(name = "old_price", precision = 65, scale = 2)
    private BigDecimal oldPrice;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Boolean featured;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(length = 50)
    private String color;

    @Column(name = "size", length = 20)
    private String size;

    @Column(nullable = false)
    private Integer popularity;

    @Column(precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount;

    @Column(name = "image_content_type", length = 50)
    private String imageContentType;

    @Column(name = "image_size")
    private Integer imageSize;

    public Product() {}

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

    public String getImageContentType() {
        return imageContentType;
    }

    public void setImageContentType(String imageContentType) {
        this.imageContentType = imageContentType;
    }

    public Integer getImageSize() {
        return imageSize;
    }

    public void setImageSize(Integer imageSize) {
        this.imageSize = imageSize;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Product product = (Product) o;
        return Objects.equals(getId(), product.getId()) && Objects.equals(getName(), product.getName()) && Objects.equals(getDescription(), product.getDescription()) && Objects.equals(getPrice(), product.getPrice()) && Objects.equals(getOldPrice(), product.getOldPrice()) && Objects.equals(getCategory(), product.getCategory()) && Objects.equals(getQuantity(), product.getQuantity()) && Objects.equals(getFeatured(), product.getFeatured()) && Objects.equals(getCreatedAt(), product.getCreatedAt()) && Objects.equals(getColor(), product.getColor()) && Objects.equals(getSize(), product.getSize()) && Objects.equals(getPopularity(), product.getPopularity()) && Objects.equals(getRating(), product.getRating()) && Objects.equals(getReviewCount(), product.getReviewCount()) && Objects.equals(getImageContentType(), product.getImageContentType()) && Objects.equals(getImageSize(), product.getImageSize());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getName(), getDescription(), getPrice(), getOldPrice(), getCategory(), getQuantity(), getFeatured(), getCreatedAt(), getColor(), getSize(), getPopularity(), getRating(), getReviewCount(), getImageContentType(), getImageSize());
    }
}
