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
import java.util.List;

@RestController
@RequestMapping("/internal/kyc/review")
@RequiredArgsConstructor
public class KycReviewController {

    private final MerchantKycService merchantKycService;

    @GetMapping(value = "/{token}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> reviewPage(@PathVariable String token) {
        MerchantKycCase kycCase = merchantKycService.reviewCase(token);
        List<MerchantKycDocument> docs = merchantKycService.documentsForReview(token);

        StringBuilder docRows = new StringBuilder();
        for (MerchantKycDocument doc : docs) {
            docRows.append("""
                <tr>
                    <td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:600;">%s</td>
                    <td style="padding:10px;border-bottom:1px solid #e2e8f0;">%s</td>
                    <td style="padding:10px;border-bottom:1px solid #e2e8f0;">
                        <a href="/internal/kyc/review/%s/documents/%s" target="_blank" style="display:inline-block;padding:6px 14px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:500;">View document</a>
                    </td>
                </tr>
            """.formatted(doc.getDocumentType(), escape(doc.getOriginalFilename()), token, doc.getId()));
        }

        String html = """
                <!doctype html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Mantu KYC Manual Review</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 40px 20px; }
                        .container { max-width: 760px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; }
                        .header { background: #0f172a; color: #ffffff; padding: 24px 32px; }
                        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; }
                        .header p { margin: 6px 0 0; font-size: 14px; color: #94a3b8; }
                        .content { padding: 32px; }
                        .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
                        .meta-item { font-size: 13px; }
                        .meta-label { color: #64748b; font-weight: 500; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
                        .meta-value { color: #0f172a; font-weight: 600; margin-top: 2px; }
                        table { width: 100%%; border-collapse: collapse; margin-bottom: 28px; font-size: 14px; }
                        th { text-align: left; background: #f8fafc; padding: 10px; color: #475569; font-weight: 600; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
                        textarea { width: 100%%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-family: inherit; font-size: 14px; resize: vertical; margin-top: 6px; }
                        textarea:focus { outline: none; border-color: #2563eb; ring: 2px solid #93c5fd; }
                        .btn-group { display: flex; gap: 12px; margin-top: 20px; }
                        .btn { padding: 10px 20px; border: none; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; transition: opacity 0.2s; }
                        .btn:hover { opacity: 0.9; }
                        .btn-approve { background: #16a34a; color: #ffffff; }
                        .btn-waitlist { background: #d97706; color: #ffffff; }
                        .btn-reject { background: #dc2626; color: #ffffff; }
                    </style>
                </head>
                <body>
                <div class="container">
                    <div class="header">
                        <h1>Mantu KYC Manual Review</h1>
                        <p>Merchant onboarding compliance verification</p>
                    </div>
                    <div class="content">
                        <div class="meta-grid">
                            <div class="meta-item"><div class="meta-label">Merchant Name</div><div class="meta-value">%s</div></div>
                            <div class="meta-item"><div class="meta-label">Business Name</div><div class="meta-value">%s</div></div>
                            <div class="meta-item"><div class="meta-label">Case ID</div><div class="meta-value" style="font-family: monospace;">%s</div></div>
                        </div>

                        <h3 style="font-size: 16px; margin: 0 0 12px; color: #0f172a;">Submitted Verification Documents</h3>
                        <table>
                            <thead>
                                <tr><th>Document Type</th><th>Original Filename</th><th>Secure Link</th></tr>
                            </thead>
                            <tbody>
                                %s
                            </tbody>
                        </table>

                        <form method="post" action="/internal/kyc/review/%s/decision">
                            <label style="font-size: 14px; font-weight: 600; color: #334155;">
                                Reviewer Note
                                <span style="font-weight: 400; color: #64748b; font-size: 12px;">(Required when waitlisting or rejecting)</span>
                                <textarea name="note" rows="4" placeholder="Enter comments, instructions or reason for decision..."></textarea>
                            </label>

                            <div class="btn-group">
                                <button type="submit" name="decision" value="APPROVED" class="btn btn-approve">Approve Merchant</button>
                                <button type="submit" name="decision" value="WAITLISTED" class="btn btn-waitlist">Waitlist</button>
                                <button type="submit" name="decision" value="REJECTED" class="btn btn-reject">Reject Application</button>
                            </div>
                        </form>
                    </div>
                </div>
                </body>
                </html>
                """.formatted(
                    escape(kycCase.getMerchant().getName()),
                    escape(kycCase.getMerchant().getBusinessName()),
                    kycCase.getId(),
                    docRows.toString(),
                    token
                );
        return ResponseEntity.ok(html);
    }

    @PostMapping(value = "/{token}/decision", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> decision(@PathVariable String token, @RequestParam KycCaseStatus decision,
                                           @RequestParam(required = false) String note) {
        var outcome = merchantKycService.decide(token, decision, note, "manual-review-email-link");
        String color = outcome.kycStatus() == KycCaseStatus.APPROVED ? "#16a34a" : outcome.kycStatus() == KycCaseStatus.WAITLISTED ? "#d97706" : "#dc2626";
        String html = """
                <!doctype html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>KYC Decision Recorded - Mantu</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 60px 20px; text-align: center; }
                        .card { max-width: 500px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
                        .badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; font-weight: 700; color: #fff; font-size: 14px; margin: 12px 0 20px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h2 style="margin:0 0 12px; color: #0f172a;">KYC Decision Recorded</h2>
                        <div class="badge" style="background: %s">%s</div>
                        <p style="color: #64748b; font-size: 14px; line-height: 1.5;">The decision has been recorded and the merchant's onboarding status has been updated in real-time.</p>
                    </div>
                </body>
                </html>
                """.formatted(color, outcome.kycStatus());
        return ResponseEntity.ok(html);
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
