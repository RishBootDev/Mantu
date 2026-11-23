import { apiClient } from './client';
import {
  KycOnboardingResponse,
  KycDocumentType,
} from '../types/api';

const DEFAULT_MOCK_KYC: KycOnboardingResponse = {
  merchantStatus: 'PENDING_KYC',
  kycStatus: 'DRAFT',
  onboardingComplete: false,
  requiredDocuments: [
    'PAN',
    'BUSINESS_REGISTRATION',
    'ADDRESS_PROOF',
    'BANK_ACCOUNT_PROOF',
  ],
  uploadedDocuments: [],
  reviewerNote: null,
  submittedAt: null,
};

const normalizeKyc = (data: any): KycOnboardingResponse => {
  const docs = data.uploadedDocuments || data.documents || [];
  return {
    ...data,
    documents: docs,
    uploadedDocuments: docs,
  };
};

export const kycApi = {
  async getStatus(): Promise<KycOnboardingResponse> {
    try {
      const res = await apiClient.get<KycOnboardingResponse>('/v1/merchants/kyc');
      return normalizeKyc(res.data);
    } catch (err: any) {
      if (!err.response) {
        const stored = localStorage.getItem('mantu_mock_kyc');
        return stored ? JSON.parse(stored) : DEFAULT_MOCK_KYC;
      }
      throw err;
    }
  },

  async uploadDocument(type: KycDocumentType, file: File): Promise<KycOnboardingResponse> {
    try {
      const formData = new FormData();
      formData.append('document', file);
      const res = await apiClient.post<KycOnboardingResponse>(
        `/v1/merchants/kyc/documents?type=${type}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return normalizeKyc(res.data);
    } catch (err: any) {
      if (!err.response) {
        const current = await this.getStatus();
        const existingDocs = current.uploadedDocuments.filter((d) => d.documentType !== type);
        const newDoc = {
          id: `doc_${Date.now()}`,
          documentType: type,
          originalFilename: file.name,
          contentType: file.type || 'application/pdf',
          sizeBytes: file.size,
        };
        const updated: KycOnboardingResponse = {
          ...current,
          uploadedDocuments: [...existingDocs, newDoc],
          kycStatus: 'DRAFT',
        };
        localStorage.setItem('mantu_mock_kyc', JSON.stringify(updated));
        return updated;
      }
      throw err;
    }
  },

  async submitForReview(): Promise<KycOnboardingResponse> {
    try {
      const res = await apiClient.post<KycOnboardingResponse>('/v1/merchants/kyc/submit');
      return normalizeKyc(res.data);
    } catch (err: any) {
      if (!err.response) {
        const current = await this.getStatus();
        if (current.uploadedDocuments.length < 4) {
          const errResponse = {
            errorCode: 'KYC_DOCUMENTS_INCOMPLETE',
            errorDescription: 'Please upload all 4 required KYC documents before submitting.',
          };
          throw { response: { data: errResponse, status: 400 } };
        }
        const updated: KycOnboardingResponse = {
          ...current,
          kycStatus: 'UNDER_REVIEW',
          submittedAt: new Date().toISOString(),
        };
        localStorage.setItem('mantu_mock_kyc', JSON.stringify(updated));
        return updated;
      }
      throw err;
    }
  },

  async approveDemo(): Promise<KycOnboardingResponse> {
    try {
      const res = await apiClient.post<KycOnboardingResponse>('/v1/merchants/kyc/approve-demo');
      return normalizeKyc(res.data);
    } catch (err: any) {
      if (!err.response) {
        const current = await this.getStatus();
        const updated: KycOnboardingResponse = {
          ...current,
          merchantStatus: 'ACTIVE',
          kycStatus: 'APPROVED',
          onboardingComplete: true,
        };
        localStorage.setItem('mantu_mock_kyc', JSON.stringify(updated));
        return updated;
      }
      throw err;
    }
  },
};
