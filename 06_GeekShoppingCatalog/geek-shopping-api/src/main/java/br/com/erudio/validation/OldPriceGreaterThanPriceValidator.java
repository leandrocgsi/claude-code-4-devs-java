package br.com.erudio.validation;

import br.com.erudio.data.dto.request.ProductRequestDTO;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class OldPriceGreaterThanPriceValidator implements ConstraintValidator<OldPriceGreaterThanPrice, ProductRequestDTO> {

    @Override
    public boolean isValid(ProductRequestDTO product, ConstraintValidatorContext context) {
        if (product == null || product.getOldPrice() == null || product.getPrice() == null) return true;
        if (product.getOldPrice().compareTo(product.getPrice()) > 0) return true;
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                .addPropertyNode("oldPrice")
                .addConstraintViolation();
        return false;
    }
}
