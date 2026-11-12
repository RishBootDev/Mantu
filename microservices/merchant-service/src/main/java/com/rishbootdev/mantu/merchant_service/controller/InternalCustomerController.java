package com.rishbootdev.mantu.merchant_service.controller;

import com.rishbootdev.mantu.common_library.dto.FindOrCreateCustomerRequest;
import com.rishbootdev.mantu.merchant_service.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/customers")
public class InternalCustomerController {

    private final CustomerService customerService;

    @PostMapping("/find-or-create")
    public UUID findOrCreate(@RequestBody FindOrCreateCustomerRequest request){
        return customerService.findOrCreate(request.merchantId(), request.email(), request.name(), request.phone());
    }
}
