import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useLocale } from '../contexts/LocaleContext';

interface Document {
  id: number;
  employeeId: number;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
}

interface DocumentsTabProps {
  employeeId: number;
}

const typeLabels: Record<string, string> = {
  CONTRACT: 'Contract',
  ID: 'ID Document',
  CERTIFICATE: 'Certificate',
  OTHER: 'Other',
};

const DocumentsTab: React.FC<DocumentsTabProps> = ({ employeeId }) => {
  const { t, locale } = useLocale();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const response = await apiClient.get(`/documents/employee/${employeeId}`);
      setDocuments(response.data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [employeeId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('employeeId', String(employeeId));
    formData.append('type', 'OTHER');

    try {
      await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchDocuments();
    } catch (err) {
      console.error('Failed to upload document:', err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{t('Documents')}</h3>
        <label className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer text-sm">
          {t('Upload Document')}
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {documents.length === 0 ? (
        <p className="text-gray-500 text-center py-8">{t('No documents uploaded yet')}</p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {t(typeLabels[doc.type] || doc.type)} &bull; {formatSize(doc.fileSize)} &bull;{' '}
                    {new Date(doc.uploadedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                  </p>
                </div>
              </div>
              <a
                href={doc.fileUrl}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                download
              >
                {t('Download')}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;
