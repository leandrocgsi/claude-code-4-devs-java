package br.com.erudio.data.dto;

import java.util.List;

public record FacetsDTO(
        List<PriceRangeDTO> priceRanges,
        List<FacetItemDTO> colors,
        List<FacetItemDTO> sizes,
        List<FacetItemDTO> categories) {}
