package com.rishbootdev.mantu.merchant_service.kyc;

import com.rishbootdev.mantu.merchant_service.entity.MerchantKycCase;
import com.rishbootdev.mantu.merchant_service.entity.MerchantKycDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class KycReviewMailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final KycProperties properties;

    public void sendReviewRequest(MerchantKycCase kycCase, List<MerchantKycDocument> documents, String token) {
        if (properties.getReviewMailbox() == null || properties.getReviewMailbox().isBlank()) {
            log.warn("KYC case {} submitted but KYC_REVIEW_MAILBOX is not configured", kycCase.getId());
            return;
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("KYC case {} submitted but no JavaMailSender is configured", kycCase.getId());
            return;
        }
        try {
            String reviewUrl = properties.getReviewBaseUrl() + "/internal/kyc/review/" + token;
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            helper.setTo(properties.getReviewMailbox());
            helper.setSubject("KYC review required: " + kycCase.getMerchant().getBusinessName());
            helper.setText(html(kycCase, documents, reviewUrl), true);
            mailSender.send(message);
        } catch (Exception exception) {
            log.error("Unable to send KYC review email for case={}", kycCase.getId(), exception);
        }
    }

    private String html(MerchantKycCase kycCase, List<MerchantKycDocument> documents, String reviewUrl) {
        String documentRows = documents.stream().map(document -> """
                <tr><td style=\"padding:10px;border-bottom:1px solid #e5e7eb\">%s</td>
                <td style=\"padding:10px;border-bottom:1px solid #e5e7eb\">%s</td>
                <td style=\"padding:10px;border-bottom:1px solid #e5e7eb\"><a href=\"%s/documents/%s\">View securely</a></td></tr>
                """.formatted(document.getDocumentType(), escape(document.getOriginalFilename()), reviewUrl, document.getId()))
                .reduce("", String::concat);
        return """
                <!doctype html><html><body style=\"margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#1f2937\">
                <div style=\"max-width:680px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px #dbe3ef\">
                  <div style=\"padding:24px;background:#172554;color:#fff\"><h2 style=\"margin:0\">Mantu manual KYC review</h2><p style=\"margin:8px 0 0\">A merchant has submitted their onboarding documents.</p></div>
                  <div style=\"padding:24px\"><p><b>Merchant:</b> %s<br><b>Business:</b> %s<br><b>Case ID:</b> %s</p>
                  <table style=\"width:100%%;border-collapse:collapse\"><thead><tr style=\"text-align:left;background:#f8fafc\"><th style=\"padding:10px\">Type</th><th style=\"padding:10px\">File</th><th style=\"padding:10px\">Private access</th></tr></thead><tbody>%s</tbody></table>
                  <p style=\"margin-top:24px\">Open the secure review page to inspect documents and confirm a decision. This link expires automatically and approval cannot occur from an email-preview scanner.</p>
                  <a href=\"%s\" style=\"display:inline-block;padding:12px 20px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px\">Review: approve, reject, or waitlist</a>
                  <p style=\"font-size:12px;color:#64748b\">Do not forward this message or download documents outside approved systems.</p></div></div></body></html>
                """.formatted(escape(kycCase.getMerchant().getName()), escape(kycCase.getMerchant().getBusinessName()), kycCase.getId(), documentRows, reviewUrl);
    }

    private static String escape(String value) {
        if (value == null) return "—";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
