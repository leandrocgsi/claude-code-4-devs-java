package br.com.erudio.data.dto.request;

import java.math.BigDecimal;
import java.util.List;

public record ProductFilter(
        String q,
        String category,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        List<String> colors,
        List<String> sizes,
        boolean featuredOnly) {}
