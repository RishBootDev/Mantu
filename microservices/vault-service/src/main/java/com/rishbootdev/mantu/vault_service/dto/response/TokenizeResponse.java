package com.rishbootdev.mantu.vault_service.dto.response;


import com.rishbootdev.mantu.common_library.enums.CardBrand;

public record TokenizeResponse(

        String token,
        String lastFour,
        CardBrand brand,
        Integer expiryMonth,
        Integer expiryYear
) {
}
