import React, { useState } from 'react';
import { FarmStateProvider } from './context/FarmStateContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/ui/AuthModal';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AIDrawer } from './components/layout/AIDrawer';
import { CommandPalette } from './components/layout/CommandPalette';
import { AIShimmerSkeleton } from './components/ui/AIShimmerSkeleton';

import { DashboardTab } from './components/tabs/DashboardTab';
import { MyFieldCropsTab } from './components/tabs/MyFieldCropsTab';
import {
  LiveWeatherTab,
  AICropDoctorTab,
  DiseaseDetectionTab,
  CropHealthTab,
  SeedRecommendationTab,
  FertilizerPlannerTab,
  IrrigationPlannerTab
} from './components/tabs/CoreTabs';
import { GovtTabs } from './components/tabs/GovtTabs';
import { AITabs } from './components/tabs/AITabs';
import { CommunityTabs } from './components/tabs/CommunityTabs';

function MainContent() {
  const { showAuthModal, setShowAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isLoadingTab, setIsLoadingTab] = useState(false);

  const handleTabChange = (tabId) => {
    setIsLoadingTab(true);
    setActiveTab(tabId);
    setTimeout(() => {
      setIsLoadingTab(false);
    }, 400);
  };

  const renderActiveTabContent = () => {
    if (isLoadingTab) {
      return <AIShimmerSkeleton title={`Loading ${activeTab.toUpperCase()} Data...`} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab onSelectTab={handleTabChange} toggleAIDrawer={() => setIsAIDrawerOpen(true)} />;
      case 'my-field-crops':
        return <MyFieldCropsTab />;
      case 'image-detection':
        return <DiseaseDetectionTab />;
      case 'live-weather':
        return <LiveWeatherTab />;
      case 'ai-crop-doctor':
        return <AICropDoctorTab />;
      case 'disease-detection':
        return <DiseaseDetectionTab />;
      case 'crop-health':
        return <CropHealthTab />;
      case 'seed-recommendation':
        return <SeedRecommendationTab />;
      case 'fertilizer-planner':
        return <FertilizerPlannerTab />;
      case 'irrigation-planner':
        return <IrrigationPlannerTab />;
      case 'govt-schemes':
        return <GovtTabs subTab={activeTab} />;
      case 'ai-chat':
      case 'ai-voice-assistant':
        return <AITabs subTab={activeTab} />;
      case 'profile-account':
      default:
        return <CommunityTabs subTab={activeTab} />;
    }
  };

  return (
    <FarmStateProvider>
      <div className="min-h-screen bg-[#02040a] text-slate-100 aurora-bg flex flex-col font-sans selection:bg-emerald-500 selection:text-black relative">
        
        {/* Top Header */}
        <Header 
          onOpenCommand={() => setIsCommandOpen(true)}
          toggleAIDrawer={() => setIsAIDrawerOpen(!isAIDrawerOpen)}
          isAIDrawerOpen={isAIDrawerOpen}
        />

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left 50-Tab Dock */}
          <Sidebar 
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />

          {/* Center Active Tab Content Viewport */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar h-[calc(100vh-4rem)]">
            {renderActiveTabContent()}
          </main>
        </div>

        {/* Slide-over Right AI Assistant Drawer */}
        <AIDrawer 
          isOpen={isAIDrawerOpen}
          onClose={() => setIsAIDrawerOpen(false)}
          activeTab={activeTab}
        />

        {/* Ctrl+K Global Command Palette */}
        <CommandPalette 
          isOpen={isCommandOpen}
          onClose={() => setIsCommandOpen(false)}
          onSelectTab={handleTabChange}
        />

        {/* Global Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />

      </div>
    </FarmStateProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
