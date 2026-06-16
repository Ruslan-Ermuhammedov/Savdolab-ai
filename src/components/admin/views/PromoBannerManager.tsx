import React from 'react';
import AdminBanners from '../../AdminBanners';

export default function PromoBannerManager({ onShowToast }: { onShowToast: (msg: string) => void }) {
  return <AdminBanners onShowToast={onShowToast} />;
}
