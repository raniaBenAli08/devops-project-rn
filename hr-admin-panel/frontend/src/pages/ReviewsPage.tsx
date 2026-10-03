import React from 'react';
import { useLocale } from '../contexts/LocaleContext';

const ReviewsPage: React.FC = () => {
  const { t } = useLocale();
  return (
    <div>
      <div className="page-heading">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Performance Reviews')}</h1>
          <p className="page-description">{t('Support growth through structured feedback.')}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-gray-500">
        {t('Performance reviews coming soon...')}
      </div>
    </div>
  );
};

export default ReviewsPage;
