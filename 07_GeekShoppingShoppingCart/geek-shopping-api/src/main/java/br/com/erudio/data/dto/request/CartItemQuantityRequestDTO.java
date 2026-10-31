package br.com.erudio.data.dto.request;

import java.io.Serializable;
import java.util.Objects;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CartItemQuantityRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull
    @Min(1)
    private Integer quantity;

    public CartItemQuantityRequestDTO() {}

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        CartItemQuantityRequestDTO that = (CartItemQuantityRequestDTO) o;
        return Objects.equals(getQuantity(), that.getQuantity());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getQuantity());
    }
}
