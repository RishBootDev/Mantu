package com.rishbootdev.mantu.merchant_service.repository;



import com.rishbootdev.mantu.common_library.enums.MerchantStatus;
import com.rishbootdev.mantu.merchant_service.entity.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;
import java.util.UUID;


public interface MerchantRepository extends JpaRepository<Merchant, UUID> {
    boolean existsByEmail(String email);

    List<Merchant> findByStatus(MerchantStatus merchantStatus);

}
