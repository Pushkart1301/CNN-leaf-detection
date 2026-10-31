import React, { useState } from 'react';
import { 
  Landmark, FileText, CheckCircle, ShieldAlert, Calculator, Lock, ShieldCheck, Eye
} from 'lucide-react';
import { AIBadgePanel } from '../ui/AIBadgePanel';
import GovernmentSchemesTab from './GovernmentSchemesTab';

export const GovtTabs = ({ subTab }) => {
  switch (subTab) {
    case 'govt-schemes':
    default:
      return <GovernmentSchemesTab />;
  }
};
