package com.rishbootdev.mantu.merchant_service.entity;

import com.rishbootdev.mantu.common_library.entity.BaseEntity;
import com.rishbootdev.mantu.merchant_service.kyc.KycCaseStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "merchant_kyc_case")
public class MerchantKycCase extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "merchant_id", nullable = false, unique = true)
    private Merchant merchant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private KycCaseStatus status = KycCaseStatus.DRAFT;

    @Column(length = 64)
    private String reviewerTokenHash;

    private LocalDateTime reviewerTokenExpiresAt;
    private LocalDateTime submittedAt;
    private LocalDateTime decidedAt;

    @Column(length = 30)
    private String decision;

    @Column(length = 1000)
    private String reviewerNote;

    @Column(length = 200)
    private String reviewedBy;

    @Version
    private long version;
}
