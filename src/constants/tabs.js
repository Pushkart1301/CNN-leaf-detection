export const TAB_CATEGORIES = [
  {
    id: 'core',
    name: 'CORE FARM FEATURES',
    icon: 'LayoutDashboard',
    tabs: [
      { id: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard', desc: 'Main farm command center' },
      { id: 'my-field-crops', name: 'Add Crops', icon: 'Sprout', desc: 'Record crops currently growing in your fields' },
      // { id: 'image-detection', name: 'Image Detection', icon: 'Scan', desc: 'Upload crop images for detection' },
      { id: 'live-weather', name: 'Live Weather', icon: 'CloudSun', desc: 'Current field weather' },
      { id: 'ai-crop-doctor', name: 'AI Crop Doctor', icon: 'Stethoscope', desc: 'Crop diagnosis and guidance' },
      { id: 'disease-detection', name: 'Disease Detection', icon: 'Scan', desc: 'Leaf and crop disease analysis' },
      // { id: 'crop-health', name: 'Crop Health', icon: 'Activity', desc: 'Crop health monitoring' },
      { id: 'seed-recommendation', name: 'Seed Recommendation', icon: 'Sprout', desc: 'Best seed suggestions' },
      { id: 'fertilizer-planner', name: 'Fertilizer Planner', icon: 'FlaskConical', desc: 'Stage-wise fertilizer planning' },
      { id: 'irrigation-planner', name: 'Irrigation Planner', icon: 'Droplets', desc: 'Watering and irrigation plan' },
    ]
  },
  {
    id: 'government',
    name: 'GOVERNMENT & AI',
    icon: 'Landmark',
    tabs: [
      { id: 'govt-schemes', name: 'Government Schemes', icon: 'FileText', desc: 'Available schemes and support' },
      { id: 'ai-chat', name: 'AI Chat Assistant', icon: 'MessageSquare', desc: 'Farm guidance and support' },
      { id: 'ai-voice-assistant', name: 'AI Voice Assistant', icon: 'Mic', desc: 'Voice-based farm assistance' },
    ]
  },
  {
    id: 'community',
    name: 'PROFILE',
    icon: 'Award',
    tabs: [
      { id: 'profile-account', name: 'Profile & Account', icon: 'Award', desc: 'Farmer account details' },
    ]
  }
];

export const MOCK_USER = {
  name: 'Farmer',
  title: 'Premium Farmer',
  badge: '👑 Elite Tier',
  location: 'Vellore, Tamil Nadu',
  farmSize: '12.45 Acres',
  cropPrimary: 'Paddy (Rice - ADT 54)',
  aiTokens: '48,250 / 100,000',
  localModel: 'Qwen 2.5 7B (GGUF Q4_K_M)',
  mcpConnected: 18,
  systemStatus: 'Optimal ⚡ (0.4ms)'
};
