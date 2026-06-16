import React from 'react';
import LandingManager from '../../LandingManager';

export default function LandingPageManager({ onShowToast }: { onShowToast: (msg: string) => void }) {
  return <LandingManager onShowToast={onShowToast} />;
}
