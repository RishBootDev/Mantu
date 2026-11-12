package com.rishbootdev.mantu.merchant_service.mapper;

import com.rishbootdev.mantu.merchant_service.dto.response.ApiKeyResponse;
import com.rishbootdev.mantu.merchant_service.entity.ApiKey;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ApiKeyMapper {

    ApiKeyResponse toCreateResponse(ApiKey apiKey);

    List<ApiKeyResponse> toResponseList(List<ApiKey> apiKeyList);
}
