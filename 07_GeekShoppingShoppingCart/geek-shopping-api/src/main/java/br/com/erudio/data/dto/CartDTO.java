package br.com.erudio.data.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.hateoas.RepresentationModel;
import org.springframework.hateoas.server.core.Relation;

@Relation(collectionRelation = "carts")
public class CartDTO extends RepresentationModel<CartDTO> implements Serializable {

    private static final long serialVersionUID = 1L;

    private List<CartItemDTO> items = new ArrayList<>();
    private Integer itemCount;
    private BigDecimal subtotal;
    private BigDecimal shipping;
    private BigDecimal total;

    public CartDTO() {}

    public List<CartItemDTO> getItems() {
        return items;
    }

    public void setItems(List<CartItemDTO> items) {
        this.items = items;
    }

    public Integer getItemCount() {
        return itemCount;
    }

    public void setItemCount(Integer itemCount) {
        this.itemCount = itemCount;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getShipping() {
        return shipping;
    }

    public void setShipping(BigDecimal shipping) {
        this.shipping = shipping;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        CartDTO cartDTO = (CartDTO) o;
        return Objects.equals(getItems(), cartDTO.getItems()) && Objects.equals(getItemCount(), cartDTO.getItemCount()) && Objects.equals(getSubtotal(), cartDTO.getSubtotal()) && Objects.equals(getShipping(), cartDTO.getShipping()) && Objects.equals(getTotal(), cartDTO.getTotal());
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), getItems(), getItemCount(), getSubtotal(), getShipping(), getTotal());
    }
}
