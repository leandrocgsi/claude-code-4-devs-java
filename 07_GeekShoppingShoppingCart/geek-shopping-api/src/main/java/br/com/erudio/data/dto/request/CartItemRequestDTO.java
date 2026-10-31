package br.com.erudio.data.dto.request;

import java.io.Serializable;
import java.util.Objects;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class CartItemRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull
    @Positive
    private Long productId;

    @NotNull
    @Min(1)
    private Integer quantity;

    @Size(max = 50)
    private String color;

    @Size(max = 20)
    private String size;

    public CartItemRequestDTO() {}

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
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

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        CartItemRequestDTO that = (CartItemRequestDTO) o;
        return Objects.equals(getProductId(), that.getProductId()) && Objects.equals(getQuantity(), that.getQuantity()) && Objects.equals(getColor(), that.getColor()) && Objects.equals(getSize(), that.getSize());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getProductId(), getQuantity(), getColor(), getSize());
    }
}
