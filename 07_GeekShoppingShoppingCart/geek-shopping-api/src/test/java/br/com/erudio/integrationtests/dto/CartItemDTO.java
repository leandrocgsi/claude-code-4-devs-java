package br.com.erudio.integrationtests.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Objects;

public class CartItemDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private Long productId;
    private String name;
    private String imageUrl;
    private String color;
    private String size;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal lineTotal;
    private Integer stock;

    public CartItemDTO() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
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

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        CartItemDTO that = (CartItemDTO) o;
        return Objects.equals(getId(), that.getId()) && Objects.equals(getProductId(), that.getProductId()) && Objects.equals(getName(), that.getName()) && Objects.equals(getImageUrl(), that.getImageUrl()) && Objects.equals(getColor(), that.getColor()) && Objects.equals(getSize(), that.getSize()) && Objects.equals(getUnitPrice(), that.getUnitPrice()) && Objects.equals(getQuantity(), that.getQuantity()) && Objects.equals(getLineTotal(), that.getLineTotal()) && Objects.equals(getStock(), that.getStock());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getProductId(), getName(), getImageUrl(), getColor(), getSize(), getUnitPrice(), getQuantity(), getLineTotal(), getStock());
    }
}
