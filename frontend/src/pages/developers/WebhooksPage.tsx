import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Globe,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { webhooksApi } from '../../api/webhooks';
import { WebhookConfigResponse } from '../../types/api';
import { useToast } from '../../components/common/Toast';

type SnippetLang = 'nodejs' | 'python' | 'springboot' | 'go' | 'php';

const WEBHOOK_SNIPPETS: { id: SnippetLang; label: string; code: string }[] = [
  {
    id: 'nodejs',
    label: 'Node.js (Express)',
    code: `// Node.js Express Webhook Verification Example
const crypto = require('crypto');

app.post('/mantu-webhook', (req, res) => {
  const secret = process.env.MANTU_WEBHOOK_SECRET;
  const signature = req.headers['x-mantu-signature'] || '';
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    const { event, payload } = req.body;
    console.log(\`Processed \${event} for Order \${payload.orderId}\`);
    return res.status(200).send('OK');
  }
  return res.status(400).send('Invalid signature');
});`,
  },
  {
    id: 'python',
    label: 'Python (FastAPI)',
    code: `# Python FastAPI Webhook Verification Example
import hashlib
import hmac
import os
from fastapi import FastAPI, Header, HTTPException, Request

app = FastAPI()

@app.post("/mantu-webhook")
async def mantu_webhook(request: Request, x_mantu_signature: str = Header(default="")):
    secret = os.environ["MANTU_WEBHOOK_SECRET"].encode("utf-8")
    body = await request.body()
    expected = hmac.new(secret, body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(x_mantu_signature.lower(), expected.lower()):
        raise HTTPException(status_code=400, detail="Invalid signature")

    data = await request.json()
    print(f"Processed {data.get('event')} for Order {data.get('payload', {}).get('orderId')}")
    return {"status": "ok"}`,
  },
  {
    id: 'springboot',
    label: 'Spring Boot (Java)',
    code: `// Spring Boot Webhook Verification Example
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@RestController
public class MantuWebhookController {

    @Value("\${mantu.webhook.secret}")
    private String webhookSecret;

    @PostMapping("/mantu-webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestHeader(value = "X-Mantu-Signature", defaultValue = "") String signature,
            @RequestBody String rawBody) throws Exception {

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String expected = HexFormat.of().formatHex(mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8)));

        boolean valid = MessageDigest.isEqual(
                signature.toLowerCase().getBytes(StandardCharsets.UTF_8),
                expected.getBytes(StandardCharsets.UTF_8)
        );
        if (!valid) {
            return ResponseEntity.badRequest().body("Invalid signature");
        }
        return ResponseEntity.ok("OK");
    }
}`,
  },
  {
    id: 'go',
    label: 'Go',
    code: `// Go net/http Webhook Verification Example
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"os"
)

func mantuWebhookHandler(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	mac := hmac.New(sha256.New, []byte(os.Getenv("MANTU_WEBHOOK_SECRET")))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	signature := r.Header.Get("X-Mantu-Signature")

	if !hmac.Equal([]byte(signature), []byte(expected)) {
		http.Error(w, "Invalid signature", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}`,
  },
  {
    id: 'php',
    label: 'PHP',
    code: `<?php
// PHP Webhook Verification Example
$secret = getenv('MANTU_WEBHOOK_SECRET');
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_MANTU_SIGNATURE'] ?? '';

$expected = hash_hmac('sha256', $payload, $secret);

if (!hash_equals($expected, strtolower($signature))) {
    http_response_code(400);
    echo 'Invalid signature';
    exit;
}

$data = json_decode($payload, true);
http_response_code(200);
echo 'OK';`,
  },
];

export const WebhooksPage: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfigResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'PAYMENT_CAPTURED',
    'PAYMENT_FAILED',
  ]);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [activeLang, setActiveLang] = useState<SnippetLang>('nodejs');
  const [copiedCode, setCopiedCode] = useState(false);

  const { showToast } = useToast();

  const availableEvents = [
    { id: 'PAYMENT_CAPTURED', label: 'payment.captured', desc: 'Triggered when charge is finalized' },
    { id: 'PAYMENT_FAILED', label: 'payment.failed', desc: 'Triggered on bank decline or fraud block' },
    { id: 'REFUND_PROCESSED', label: 'refund.processed', desc: 'Triggered when refund settled to customer' },
  ];

  const loadWebhooks = async () => {
    try {
      setIsLoading(true);
      const data = await webhooksApi.list();
      setWebhooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedEvents.length === 0) {
        showToast('Please select at least one event type', 'error');
        return;
      }
      const res = await webhooksApi.create({
        targetUrl,
        eventTypes: selectedEvents,
      });
      setIsAddOpen(false);
      setTargetUrl('');
      setNewWebhookSecret(res.rawSecret || null);
      loadWebhooks();
      showToast('Webhook registered successfully', 'success');
    } catch (err: any) {
      showToast('Failed to register webhook', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await webhooksApi.delete(id);
      loadWebhooks();
      showToast('Webhook endpoint deleted', 'info');
    } catch (err: any) {
      showToast('Failed to delete webhook', 'error');
    }
  };

  const toggleEvent = (eventId: string) => {
    if (selectedEvents.includes(eventId)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== eventId));
    } else {
      setSelectedEvents([...selectedEvents, eventId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-mantu-text">Webhooks Configuration</h2>
          <p className="text-xs text-mantu-muted mt-0.5">
            Deliver real-time transactional event notifications to your server.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddOpen(true)}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Webhook Endpoint
        </Button>
      </div>

      {                             }
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-mantu-border bg-slate-50/75 text-mantu-muted font-medium">
                <th className="py-3 px-4 font-semibold">Target URL</th>
                <th className="py-3 px-4 font-semibold">Subscribed Events</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Created Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mantu-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-mantu-muted">
                    Loading webhooks...
                  </td>
                </tr>
              ) : webhooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-mantu-muted">
                    No webhooks configured. Click "Add Webhook Endpoint" to receive real-time notifications.
                  </td>
                </tr>
              ) : (
                webhooks.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-mantu-text">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-mantu-muted shrink-0" />
                        <span className="truncate max-w-sm">{w.targetUrl}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {w.eventTypes.map((ev) => (
                          <span
                            key={ev}
                            className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={w.enabled ? 'success' : 'neutral'} dot>
                        {w.enabled ? 'ACTIVE' : 'DISABLED'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-mantu-muted text-[11px]">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(w.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {                                               }
      <Card title="Webhook Signature Verification" subtitle="HMAC SHA-256 Authentication Guide">
        <p className="text-xs text-mantu-muted leading-relaxed mb-3">
          Every HTTP POST from Mantu includes header <code className="font-mono font-semibold text-mantu-text">X-Mantu-Signature</code>. Validate this signature against your webhook secret before processing orders in your server.
        </p>
        <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
          {/* Language switcher bar */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/80 border-b border-slate-800 overflow-x-auto">
            <div className="flex items-center gap-1">
              {WEBHOOK_SNIPPETS.map((snippet) => (
                <button
                  key={snippet.id}
                  type="button"
                  onClick={() => setActiveLang(snippet.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                    activeLang === snippet.id
                      ? 'bg-mantu-accent text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  {snippet.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                const current = WEBHOOK_SNIPPETS.find((s) => s.id === activeLang);
                if (!current) return;
                navigator.clipboard.writeText(current.code);
                setCopiedCode(true);
                showToast(`${current.label} snippet copied`, 'success');
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 text-slate-100 text-[11px] font-mono overflow-x-auto whitespace-pre leading-relaxed">
            <code>{WEBHOOK_SNIPPETS.find((s) => s.id === activeLang)?.code}</code>
          </pre>
        </div>
      </Card>

      {                       }
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register Webhook Endpoint"
        description="Enter the HTTPS endpoint URL and select events to subscribe to."
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-mantu-text mb-1">
              Target URL
            </label>
            <input
              type="url"
              required
              placeholder="https://api.yourdomain.com/webhooks/mantu"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-mantu-border rounded focus:outline-none focus:border-mantu-accent"
            />
            <p className="text-[10px] text-mantu-muted mt-1">
              Must be a valid reachable HTTPS URL. Mantu retries 7 times with exponential backoff on HTTP 5xx.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-mantu-text mb-2">
              Subscribe to Event Types
            </label>
            <div className="space-y-2">
              {availableEvents.map((ev) => (
                <label
                  key={ev.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded border cursor-pointer transition-colors ${
                    selectedEvents.includes(ev.id)
                      ? 'border-mantu-accent bg-blue-50/30'
                      : 'border-mantu-border hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(ev.id)}
                    onChange={() => toggleEvent(ev.id)}
                    className="mt-0.5 rounded text-mantu-accent focus:ring-mantu-accent"
                  />
                  <div>
                    <span className="text-xs font-mono font-semibold text-mantu-text block">
                      {ev.id}
                    </span>
                    <span className="text-[11px] text-mantu-muted block">{ev.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Register Endpoint
            </Button>
          </div>
        </form>
      </Modal>

      {                         }
      {newWebhookSecret && (
        <Modal
          isOpen={!!newWebhookSecret}
          onClose={() => setNewWebhookSecret(null)}
          title="Save Webhook Secret"
          description="Use this secret to verify X-Mantu-Signature in your backend."
          maxWidth="md"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={newWebhookSecret}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-mantu-border rounded select-all font-semibold"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(newWebhookSecret);
                  setCopiedSecret(true);
                  setTimeout(() => setCopiedSecret(false), 2000);
                }}
              >
                {copiedSecret ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <div className="pt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setNewWebhookSecret(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
