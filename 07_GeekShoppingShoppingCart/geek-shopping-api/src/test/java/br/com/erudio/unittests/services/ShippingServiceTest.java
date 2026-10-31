package br.com.erudio.unittests.services;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import br.com.erudio.services.ShippingService;

@ExtendWith(MockitoExtension.class)
class ShippingServiceTest {

    @InjectMocks
    private ShippingService service;

    private void configure(String flatRate) {
        ReflectionTestUtils.setField(service, "flatRate", new BigDecimal(flatRate));
    }

    @Test
    @DisplayName("RN-3 a cart without items has no shipping")
    void noItemsNoShipping() {
        configure("10.00");

        assertEquals(new BigDecimal("0.00"), service.calculate(0));
    }

    @Test
    @DisplayName("RN-3 a negative number of items is treated as no items")
    void negativeItemCountNoShipping() {
        configure("10.00");

        assertEquals(new BigDecimal("0.00"), service.calculate(-1));
    }

    @Test
    @DisplayName("RN-2 a cart with items pays the configured flat rate")
    void itemsPayTheFlatRate() {
        configure("10.00");

        assertEquals(new BigDecimal("10.00"), service.calculate(1));
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 10, 99, Integer.MAX_VALUE})
    @DisplayName("RN-2 the flat rate does not depend on the number of units")
    void flatRateIgnoresTheQuantity(int itemCount) {
        configure("10.00");

        assertEquals(new BigDecimal("10.00"), service.calculate(itemCount));
    }

    @ParameterizedTest
    @CsvSource({"7.5,7.50", "12,12.00", "0.99,0.99", "100.10,100.10"})
    @DisplayName("RN-4 the shipping always has two decimal places")
    void alwaysTwoDecimalPlaces(String configured, String expected) {
        configure(configured);

        assertEquals(new BigDecimal(expected), service.calculate(1));
    }

    @ParameterizedTest
    @CsvSource({"10.005,10.01", "10.004,10.00", "10.015,10.02", "10.994,10.99", "10.995,11.00"})
    @DisplayName("RN-4 the configured value is rounded half up")
    void roundsHalfUp(String configured, String expected) {
        configure(configured);

        assertEquals(new BigDecimal(expected), service.calculate(1));
    }

    @Test
    @DisplayName("RN-4 the value comes from the configuration, so another value gives another shipping")
    void anotherConfiguredValue() {
        configure("10.00");
        var first = service.calculate(2);
        configure("25.50");
        var second = service.calculate(2);

        assertEquals(new BigDecimal("10.00"), first);
        assertEquals(new BigDecimal("25.50"), second);
    }

    @Test
    @DisplayName("RN-2 a flat rate configured as zero means free shipping")
    void zeroFlatRateIsFree() {
        configure("0");

        assertEquals(new BigDecimal("0.00"), service.calculate(5));
    }
}
