import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { KycDocumentType, KycDocumentResponse } from '../../types/api';
import { Button } from '../common/Button';

interface DropzoneProps {
  type: KycDocumentType;
  title: string;
  description: string;
  acceptedFormats?: string;
  uploadedDoc?: KycDocumentResponse;
  isReadOnly?: boolean;
  onUpload: (type: KycDocumentType, file: File) => Promise<void>;
}

export const DocumentUploadDropzone: React.FC<DropzoneProps> = ({
  type,
  title,
  description,
  acceptedFormats = '.pdf, .jpg, .jpeg, .png',
  uploadedDoc,
  isReadOnly = false,
  onUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setErrorMsg(null);
                                
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File exceeds 10MB limit.');
      return;
    }
                    
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      setErrorMsg('Invalid file format. Only PDF, JPG, and PNG are supported.');
      return;
    }

    try {
      setIsUploading(true);
      await onUpload(type, file);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.errorDescription || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (isReadOnly) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="border border-mantu-border rounded bg-white p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-xs font-semibold text-mantu-text flex items-center gap-1.5">
            {uploadedDoc ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
            {title}
          </h4>
          <p className="text-[11px] text-mantu-muted mt-0.5">{description}</p>
        </div>
        {uploadedDoc && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            Uploaded
          </span>
        )}
      </div>

      {uploadedDoc ? (
        <div className="mt-3 flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 overflow-hidden">
            <FileText className="w-4 h-4 text-mantu-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-mantu-text truncate">
                {uploadedDoc.originalFilename}
              </p>
              <p className="text-[10px] text-mantu-muted font-mono">
                {formatBytes(uploadedDoc.sizeBytes)} • {uploadedDoc.contentType}
              </p>
            </div>
          </div>
          {!isReadOnly && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={acceptedFormats}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <Button
                variant="outline"
                size="sm"
                isLoading={isUploading}
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<RefreshCw className="w-3 h-3" />}
              >
                Replace
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`mt-3 border-2 border-dashed rounded p-4 text-center transition-colors ${
            dragActive
              ? 'border-mantu-accent bg-mantu-accent-subtle'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptedFormats}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <UploadCloud className="w-6 h-6 text-mantu-muted mx-auto mb-1.5" />
          <p className="text-xs text-mantu-text font-medium">
            Drag & drop file or{' '}
            <button
              type="button"
              disabled={isReadOnly || isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-mantu-accent hover:underline focus:outline-none"
            >
              browse
            </button>
          </p>
          <p className="text-[10px] text-mantu-muted mt-1">
            Max 10 MB • PDF, JPG, PNG
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
