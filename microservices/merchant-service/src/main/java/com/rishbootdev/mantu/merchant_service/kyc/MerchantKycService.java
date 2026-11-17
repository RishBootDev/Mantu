package com.rishbootdev.mantu.merchant_service.kyc;

import com.rishbootdev.mantu.common_library.enums.MerchantStatus;
import com.rishbootdev.mantu.common_library.exceptions.BusinessRuleViolationException;
import com.rishbootdev.mantu.common_library.exceptions.ResourceNotFoundException;
import com.rishbootdev.mantu.merchant_service.dto.response.KycDocumentResponse;
import com.rishbootdev.mantu.merchant_service.dto.response.KycOnboardingResponse;
import com.rishbootdev.mantu.merchant_service.dto.response.MerchantOnboardingStatusResponse;
import com.rishbootdev.mantu.merchant_service.entity.Merchant;
import com.rishbootdev.mantu.merchant_service.entity.MerchantKycCase;
import com.rishbootdev.mantu.merchant_service.entity.MerchantKycDocument;
import com.rishbootdev.mantu.merchant_service.repository.MerchantKycCaseRepository;
import com.rishbootdev.mantu.merchant_service.repository.MerchantKycDocumentRepository;
import com.rishbootdev.mantu.merchant_service.repository.MerchantRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MerchantKycService {

    private static final Set<KycDocumentType> REQUIRED_DOCUMENTS = EnumSet.of(
            KycDocumentType.PAN, KycDocumentType.BUSINESS_REGISTRATION,
            KycDocumentType.ADDRESS_PROOF, KycDocumentType.BANK_ACCOUNT_PROOF
    );

    private final MerchantRepository merchantRepository;
    private final MerchantKycCaseRepository kycCaseRepository;
    private final MerchantKycDocumentRepository documentRepository;
    private final KycDocumentStorage documentStorage;
    private final KycProperties properties;
    private final KycReviewMailService reviewMailService;

    @Transactional
    public void createDraftFor(Merchant merchant) {
        kycCaseRepository.save(MerchantKycCase.builder().merchant(merchant).status(KycCaseStatus.DRAFT).build());
    }

    @Transactional
    public KycOnboardingResponse upload(UUID merchantId, KycDocumentType type, MultipartFile document) {
        MerchantKycCase kycCase = requireCase(merchantId);
        if (!(kycCase.getStatus() == KycCaseStatus.DRAFT || kycCase.getStatus() == KycCaseStatus.REJECTED || kycCase.getStatus() == KycCaseStatus.WAITLISTED)) {
            throw new BusinessRuleViolationException("Documents cannot be changed while a review is in progress", "KYC_CASE_LOCKED");
        }
        validate(document);
        documentRepository.findByKycCase_IdAndDocumentType(kycCase.getId(), type).ifPresent(documentRepository::delete);
        String storageKey = documentStorage.store(merchantId.toString(), document);
        documentRepository.save(MerchantKycDocument.builder()
                .kycCase(kycCase).documentType(type).originalFilename(safeFilename(document.getOriginalFilename()))
                .storageKey(storageKey).contentType(document.getContentType()).sizeBytes(document.getSize()).build());
        kycCase.setStatus(KycCaseStatus.DRAFT);
        kycCase.setReviewerNote(null);
        return status(merchantId);
    }

    @Transactional
    public KycOnboardingResponse submit(UUID merchantId) {
        MerchantKycCase kycCase = requireCase(merchantId);
        if (!(kycCase.getStatus() == KycCaseStatus.DRAFT || kycCase.getStatus() == KycCaseStatus.REJECTED || kycCase.getStatus() == KycCaseStatus.WAITLISTED)) {
            throw new BusinessRuleViolationException("KYC case cannot be submitted in its current state", "KYC_CASE_NOT_SUBMITTABLE");
        }
        List<MerchantKycDocument> documents = documents(kycCase);
        Set<KycDocumentType> uploaded = documents.stream().map(MerchantKycDocument::getDocumentType).collect(java.util.stream.Collectors.toSet());
        if (!uploaded.containsAll(REQUIRED_DOCUMENTS)) {
            throw new BusinessRuleViolationException("All required KYC documents must be uploaded", "KYC_DOCUMENTS_INCOMPLETE");
        }
        String rawToken = reviewerToken();
        kycCase.setStatus(KycCaseStatus.UNDER_REVIEW);
        kycCase.setSubmittedAt(LocalDateTime.now());
        kycCase.setReviewerTokenHash(sha256(rawToken));
        kycCase.setReviewerTokenExpiresAt(LocalDateTime.now().plus(properties.getReviewerLinkTtl()));
        reviewMailService.sendReviewRequest(kycCase, documents, rawToken);
        return status(merchantId);
    }

    @Transactional
    public KycOnboardingResponse status(UUID merchantId) {
        MerchantKycCase kycCase = requireCase(merchantId);
        return response(kycCase, documents(kycCase));
    }

    @Transactional
    public MerchantOnboardingStatusResponse onboardingStatus(UUID merchantId) {
        Merchant merchant = merchantRepository.findById(merchantId).orElseThrow(() -> new ResourceNotFoundException("merchant", merchantId));
        return new MerchantOnboardingStatusResponse(merchant.getStatus(), merchant.getStatus() == MerchantStatus.ACTIVE);
    }

    @Transactional
    public MerchantKycCase reviewCase(String token) {
        MerchantKycCase result = kycCaseRepository.findByReviewerTokenHash(sha256(token))
                .orElseThrow(() -> new ResourceNotFoundException("KYC review link", "expired-or-invalid"));
        if (result.getStatus() != KycCaseStatus.UNDER_REVIEW) {
            throw new BusinessRuleViolationException("This KYC case is no longer awaiting review", "KYC_REVIEW_ALREADY_DECIDED");
        }
        return result;
    }

    @Transactional
    public KycOnboardingResponse decide(String token, KycCaseStatus decision, String reviewerNote, String reviewerIdentity) {
        if (!(decision == KycCaseStatus.APPROVED || decision == KycCaseStatus.REJECTED || decision == KycCaseStatus.WAITLISTED)) {
            throw new BusinessRuleViolationException("Invalid manual KYC decision", "KYC_INVALID_DECISION");
        }
        if (decision != KycCaseStatus.APPROVED && (reviewerNote == null || reviewerNote.isBlank())) {
            throw new BusinessRuleViolationException("A review note is required for rejection or waitlist", "KYC_REVIEW_NOTE_REQUIRED");
        }
        MerchantKycCase unlockedCase = reviewCase(token);
        MerchantKycCase kycCase = kycCaseRepository.findWithLockById(unlockedCase.getId()).orElseThrow();
        kycCase.setStatus(decision);
        kycCase.setDecision(decision.name());
        kycCase.setReviewerNote(reviewerNote == null ? null : reviewerNote.trim());
        kycCase.setReviewedBy(reviewerIdentity);
        kycCase.setDecidedAt(LocalDateTime.now());
        kycCase.setReviewerTokenHash(null);
        kycCase.setReviewerTokenExpiresAt(null);
        if (decision == KycCaseStatus.APPROVED) {
            kycCase.getMerchant().setStatus(MerchantStatus.ACTIVE);
        }
        return response(kycCase, documents(kycCase));
    }

    @Transactional
    public Resource documentForReview(String token, UUID documentId) {
        MerchantKycCase kycCase = reviewCase(token);
        MerchantKycDocument document = documentRepository.findById(documentId)
                .filter(item -> item.getKycCase().getId().equals(kycCase.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("KYC document", documentId));
        return documentStorage.load(document.getStorageKey());
    }

    public MerchantKycDocument requireDocumentForReview(String token, UUID documentId) {
        MerchantKycCase kycCase = reviewCase(token);
        return documentRepository.findById(documentId).filter(item -> item.getKycCase().getId().equals(kycCase.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("KYC document", documentId));
    }

    private MerchantKycCase requireCase(UUID merchantId) {
        return kycCaseRepository.findByMerchant_Id(merchantId).orElseThrow(() -> new ResourceNotFoundException("KYC case", merchantId));
    }

    private List<MerchantKycDocument> documents(MerchantKycCase kycCase) {
        return documentRepository.findByKycCase_IdOrderByCreatedAtAsc(kycCase.getId());
    }

    private KycOnboardingResponse response(MerchantKycCase kycCase, List<MerchantKycDocument> documents) {
        return new KycOnboardingResponse(kycCase.getMerchant().getStatus(), kycCase.getStatus(),
                kycCase.getMerchant().getStatus() == MerchantStatus.ACTIVE, REQUIRED_DOCUMENTS.stream().sorted().toList(),
                documents.stream().map(document -> new KycDocumentResponse(document.getId(), document.getDocumentType(), document.getOriginalFilename(), document.getContentType(), document.getSizeBytes())).toList(),
                kycCase.getReviewerNote(), kycCase.getSubmittedAt());
    }

    private void validate(MultipartFile document) {
        if (document.isEmpty() || document.getSize() > properties.getMaxDocumentBytes()) {
            throw new BusinessRuleViolationException("KYC document is empty or exceeds the size limit", "KYC_DOCUMENT_INVALID");
        }
        if (document.getContentType() == null || !properties.getAllowedContentTypes().contains(document.getContentType())) {
            throw new BusinessRuleViolationException("Only PDF, JPEG, and PNG KYC documents are allowed", "KYC_DOCUMENT_TYPE_INVALID");
        }
    }

    private static String reviewerToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256(String value) {
        try {
            return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 unavailable", exception);
        }
    }

    private static String safeFilename(String filename) {
        return filename == null ? "document" : filename.replaceAll("[^a-zA-Z0-9._ -]", "_");
    }
}
