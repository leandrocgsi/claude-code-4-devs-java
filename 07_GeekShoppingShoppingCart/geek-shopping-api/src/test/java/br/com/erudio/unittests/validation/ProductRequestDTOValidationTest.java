package br.com.erudio.unittests.validation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import br.com.erudio.data.dto.request.ProductRequestDTO;
import br.com.erudio.unittests.mapper.mocks.MockProduct;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

class ProductRequestDTOValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    private ProductRequestDTO request;

    @BeforeAll
    static void createValidator() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        factory.close();
    }

    @BeforeEach
    void setUp() {
        request = new MockProduct().mockRequest(1);
    }

    private Set<String> invalidProperties() {
        return validator.validate(request).stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(Collectors.toSet());
    }

    private void assertOnlyInvalid(String property) {
        assertEquals(Set.of(property), invalidProperties());
    }

    @Test
    void validRequestHasNoViolations() {
        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void validRequestWithOnlyTheRequiredFields() {
        request.setOldPrice(null);
        request.setColor(null);
        request.setSize(null);
        request.setFeatured(null);
        request.setId(null);

        assertTrue(validator.validate(request).isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void nameIsRequired(String name) {
        request.setName(name);

        assertOnlyInvalid("name");
    }

    @Test
    void nameIsRequiredWhenNull() {
        request.setName(null);

        assertOnlyInvalid("name");
    }

    @Test
    void nameAcceptsTheLimitOf150Characters() {
        request.setName("a".repeat(150));

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void nameRejectsMoreThan150Characters() {
        request.setName("a".repeat(151));

        assertOnlyInvalid("name");
    }

    @Test
    void descriptionIsRequired() {
        request.setDescription(" ");

        assertOnlyInvalid("description");
    }

    @Test
    void descriptionAcceptsTheLimitOf255Characters() {
        request.setDescription("a".repeat(255));

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void descriptionRejectsMoreThan255Characters() {
        request.setDescription("a".repeat(256));

        assertOnlyInvalid("description");
    }

    @Test
    void priceIsRequired() {
        request.setPrice(null);

        assertOnlyInvalid("price");
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "0.00", "-0.01", "-10"})
    void priceMustBePositive(String price) {
        request.setPrice(new BigDecimal(price));
        request.setOldPrice(null);

        assertOnlyInvalid("price");
    }

    @Test
    void priceAcceptsTwoDecimalPlaces() {
        request.setPrice(new BigDecimal("0.01"));
        request.setOldPrice(null);

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void priceRejectsMoreThanTwoDecimalPlaces() {
        request.setPrice(new BigDecimal("10.001"));
        request.setOldPrice(null);

        assertOnlyInvalid("price");
    }

    @Test
    void priceAcceptsNineIntegerDigits() {
        request.setPrice(new BigDecimal("999999999.99"));
        request.setOldPrice(null);

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void priceRejectsMoreThanNineIntegerDigits() {
        request.setPrice(new BigDecimal("1000000000.00"));
        request.setOldPrice(null);

        assertOnlyInvalid("price");
    }

    @Test
    void oldPriceGreaterThanThePriceIsValid() {
        request.setPrice(new BigDecimal("25.00"));
        request.setOldPrice(new BigDecimal("25.01"));

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void oldPriceEqualToThePriceIsInvalid() {
        request.setPrice(new BigDecimal("25.00"));
        request.setOldPrice(new BigDecimal("25.00"));

        assertOnlyInvalid("oldPrice");
    }

    @Test
    void oldPriceLowerThanThePriceIsInvalid() {
        request.setPrice(new BigDecimal("25.00"));
        request.setOldPrice(new BigDecimal("10.00"));

        assertOnlyInvalid("oldPrice");
    }

    @Test
    void oldPriceViolationReportsTheDefaultMessage() {
        request.setPrice(new BigDecimal("25.00"));
        request.setOldPrice(new BigDecimal("10.00"));

        var messages = validator.validate(request).stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toSet());

        assertEquals(Set.of("must be greater than the price"), messages);
    }

    @Test
    void oldPriceMustBePositiveWhenInformed() {
        request.setPrice(new BigDecimal("1.00"));
        request.setOldPrice(new BigDecimal("-5.00"));

        assertTrue(invalidProperties().contains("oldPrice"));
    }

    @Test
    void oldPriceIsOptional() {
        request.setOldPrice(null);

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void categoryIsRequired() {
        request.setCategory("");

        assertOnlyInvalid("category");
    }

    @Test
    void categoryRejectsMoreThan100Characters() {
        request.setCategory("a".repeat(101));

        assertOnlyInvalid("category");
    }

    @Test
    void quantityIsRequired() {
        request.setQuantity(null);

        assertOnlyInvalid("quantity");
    }

    @Test
    void quantityCannotBeNegative() {
        request.setQuantity(-1);

        assertOnlyInvalid("quantity");
    }

    @Test
    void quantityZeroIsValid() {
        request.setQuantity(0);

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void colorRejectsMoreThan50Characters() {
        request.setColor("a".repeat(51));

        assertOnlyInvalid("color");
    }

    @Test
    void sizeRejectsMoreThan20Characters() {
        request.setSize("a".repeat(21));

        assertOnlyInvalid("size");
    }

    @Test
    void sizeAcceptsTheLimitOf20Characters() {
        request.setSize("a".repeat(20));

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void severalInvalidFieldsAreReportedTogether() {
        request.setName("");
        request.setPrice(BigDecimal.ZERO);
        request.setOldPrice(null);
        request.setQuantity(-1);

        assertEquals(Set.of("name", "price", "quantity"), invalidProperties());
    }
}
