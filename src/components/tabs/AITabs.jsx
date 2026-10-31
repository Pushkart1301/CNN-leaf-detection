import React, { useState } from 'react';
import { 
  MessageSquare, Mic, Bot, Workflow, FileSpreadsheet, Send, Sparkles, Terminal, Play, Plus, FileText
} from 'lucide-react';
import { AIBadgePanel } from '../ui/AIBadgePanel';
import AIAssistantTab from './AIAssistantTab';
import AIVoiceAssistantTab from './AIVoiceAssistantTab';

export const AITabs = ({ subTab, onNavigateTab }) => {
  const [agents] = useState([
    { id: 1, name: 'Plant Pathologist Agent', role: 'Disease & Leaf Scan', status: true, logs: 'Monitoring field #2 for brown spot...' },
    { id: 2, name: 'Market Arbitrage Agent', role: 'Mandi Price Scanner', status: true, logs: 'Checking Paddy prices across 12 mandis...' },
    { id: 3, name: 'Weather Emergency Agent', role: 'Storm & Flood Alert', status: false, logs: 'Standby mode...' },
  ]);

  switch (subTab) {
    case 'ai-chat':
      return <AIAssistantTab />;

    case 'ai-voice-assistant':
      return <AIVoiceAssistantTab onNavigateTab={onNavigateTab} />;

    default:
      return <AIAssistantTab />;
  }
};
