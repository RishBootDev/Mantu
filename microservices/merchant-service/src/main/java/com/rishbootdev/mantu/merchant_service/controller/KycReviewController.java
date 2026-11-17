package com.rishbootdev.mantu.merchant_service.controller;

import com.rishbootdev.mantu.merchant_service.entity.MerchantKycCase;
import com.rishbootdev.mantu.merchant_service.entity.MerchantKycDocument;
import com.rishbootdev.mantu.merchant_service.kyc.KycCaseStatus;
import com.rishbootdev.mantu.merchant_service.kyc.MerchantKycService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;


@RestController
@RequestMapping("/internal/kyc/review")
@RequiredArgsConstructor
public class KycReviewController {

    private final MerchantKycService merchantKycService;

    @GetMapping(value = "/{token}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> reviewPage(@PathVariable String token) {
        MerchantKycCase kycCase = merchantKycService.reviewCase(token);
        String html = """
                <!doctype html><html><body style=\"font-family:Arial;max-width:760px;margin:40px auto;color:#172554\">
                <h1>Mantu KYC manual review</h1><p><b>Merchant:</b> %s<br><b>Business:</b> %s<br><b>Case:</b> %s</p>
                <p>Inspect all documents through the secure links in the review email. Choose a decision and optionally provide instructions for the merchant.</p>
                <form method=\"post\" action=\"/internal/kyc/review/%s/decision\">
                <label>Review note (required for reject/waitlist)<br><textarea name=\"note\" rows=\"5\" style=\"width:100%%\"></textarea></label><br><br>
                <button name=\"decision\" value=\"APPROVED\" style=\"padding:10px;background:#15803d;color:white\">Approve</button>
                <button name=\"decision\" value=\"WAITLISTED\" style=\"padding:10px;background:#b45309;color:white\">Waitlist</button>
                <button name=\"decision\" value=\"REJECTED\" style=\"padding:10px;background:#b91c1c;color:white\">Reject</button></form></body></html>
                """.formatted(escape(kycCase.getMerchant().getName()), escape(kycCase.getMerchant().getBusinessName()), kycCase.getId(), token);
        return ResponseEntity.ok(html);
    }

    @PostMapping(value = "/{token}/decision", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> decision(@PathVariable String token, @RequestParam KycCaseStatus decision,
                                           @RequestParam(required = false) String note) {
        var outcome = merchantKycService.decide(token, decision, note, "manual-review-email-link");
        return ResponseEntity.ok("<html><body><h2>KYC decision recorded</h2><p>Status: " + outcome.kycStatus()
                + "</p><p>The merchant's onboarding state has been updated.</p></body></html>");
    }

    @GetMapping("/{token}/documents/{documentId}")
    public ResponseEntity<Resource> document(@PathVariable String token, @PathVariable java.util.UUID documentId) {
        MerchantKycDocument document = merchantKycService.requireDocumentForReview(token, documentId);
        Resource resource = merchantKycService.documentForReview(token, documentId);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(document.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(document.getOriginalFilename(), StandardCharsets.UTF_8).build().toString())
                .body(resource);
    }

    private static String escape(String value) {
        return value == null ? "—" : value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
