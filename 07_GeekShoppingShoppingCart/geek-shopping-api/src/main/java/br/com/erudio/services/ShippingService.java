package br.com.erudio.services;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ShippingService {

    private static final int MONEY_SCALE = 2;

    @Value("${shipping.flat-rate}")
    private BigDecimal flatRate;

    public BigDecimal calculate(int itemCount) {
        if (itemCount <= 0) return BigDecimal.ZERO.setScale(MONEY_SCALE);
        return flatRate.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }
}
