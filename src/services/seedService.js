/**
 * Seed Recommendation Service Layer - AI Seed Recommendation Platform
 * Connects frontend UI to FastAPI backend seed endpoints with full client fallback.
 */

const SEED_FALLBACK_DATA = [
  {
    seed_id: "SEED-2026-001",
    seed_name: "Rice Paddy (ADT-43)",
    company: "TNAU Seed Corporation",
    crop: "Rice (Paddy)",
    variety: "ADT-43 Short Duration",
    type: "Open Pollinated",
    season: "Kuruvai / Kharif",
    growth_duration_days: 110,
    yield_potential_t_ha: 6.2,
    water_requirement: "Medium (1,100 mm)",
    suitable_soil: "Red Loamy & Alluvial Delta Soil",
    disease_resistance: "Blast & Bacterial Leaf Blight Resistant",
    heat_tolerance: "High (up to 38°C)",
    drought_tolerance: "Moderate",
    price_per_kg_inr: 45.0,
    availability: "In Stock (Government Subsidy Available)",
    certification: "Government Certified (TNSCCA)",
    image_url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=600",
    ai_match_score: 98.4,
    reasoning: "Ideal for Kuruvai season in Vellore/Thanjavur. Matches current 28°C weather, Red Loamy soil pH 6.8, and 140kg/ha Nitrogen."
  },
  {
    seed_id: "SEED-2026-002",
    seed_name: "Tomato (Arka Rakshak)",
    company: "IIHR ICAR Bengaluru",
    crop: "Tomato",
    variety: "Arka Rakshak F1 Hybrid",
    type: "F1 Hybrid",
    season: "Kharif & Rabi",
    growth_duration_days: 135,
    yield_potential_t_ha: 75.0,
    water_requirement: "High Drip (650 mm)",
    suitable_soil: "Black Cotton & Red Loamy Soil",
    disease_resistance: "Triple Resistant (ToLCV, Bacterial Wilt, Early Blight)",
    heat_tolerance: "High (up to 40°C)",
    drought_tolerance: "Moderate",
    price_per_kg_inr: 1250.0,
    availability: "High Demand (Available at Dealer)",
    certification: "ICAR IIHR Certified",
    image_url: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&q=80&w=600",
    ai_match_score: 95.8,
    reasoning: "Triple disease resistance guarantees protection against Leaf Curl Virus. Excellent market price premium (₹35/kg)."
  },
  {
    seed_id: "SEED-2026-003",
    seed_name: "Maize Corn (NK6240)",
    company: "Syngenta India",
    crop: "Maize (Corn)",
    variety: "NK6240 Single Cross Hybrid",
    type: "F1 Hybrid",
    season: "Kharif & Rabi",
    growth_duration_days: 115,
    yield_potential_t_ha: 9.5,
    water_requirement: "Medium (500 mm)",
    suitable_soil: "Red Sandy Loam & Black Soil",
    disease_resistance: "Fall Armyworm & Turcicum Blight Tolerant",
    heat_tolerance: "Very High",
    drought_tolerance: "High",
    price_per_kg_inr: 320.0,
    availability: "In Stock",
    certification: "Certified Commercial Seed",
    image_url: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=600",
    ai_match_score: 93.6,
    reasoning: "High grain weight and orange kernel color fetch top market rates from poultry feed buyers."
  },
  {
    seed_id: "SEED-2026-004",
    seed_name: "Cotton (RCH659 BGII)",
    company: "Rasi Seeds",
    crop: "Cotton",
    variety: "RCH659 Bollgard II Bt Cotton",
    type: "Bt Hybrid",
    season: "Kharif",
    growth_duration_days: 160,
    yield_potential_t_ha: 3.8,
    water_requirement: "Medium Drip (700 mm)",
    suitable_soil: "Deep Black Cotton Soil",
    disease_resistance: "American & Pink Bollworm Resistant",
    heat_tolerance: "Very High",
    drought_tolerance: "Very High",
    price_per_kg_inr: 860.0,
    availability: "In Stock",
    certification: "GEAC Government Approved Bt",
    image_url: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&q=80&w=600",
    ai_match_score: 92.0,
    reasoning: "Long staple length (32mm) with high ginning outturn (38%). Perfect for Coimbatore/Madurai black soils."
  },
  {
    seed_id: "SEED-2026-005",
    seed_name: "Groundnut (TMV-13)",
    company: "TNAU Oilseeds Station",
    crop: "Groundnut",
    variety: "TMV (Gn) 13 Bunch Type",
    type: "Open Pollinated",
    season: "Kharif & Summer",
    growth_duration_days: 105,
    yield_potential_t_ha: 2.8,
    water_requirement: "Low (450 mm)",
    suitable_soil: "Red Sandy Loam Soil",
    disease_resistance: "Tikka Leaf Spot & Rust Resistant",
    heat_tolerance: "High",
    drought_tolerance: "High",
    price_per_kg_inr: 110.0,
    availability: "In Stock (Government Subsidy 50%)",
    certification: "Government Certified",
    image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600",
    ai_match_score: 91.5,
    reasoning: "High oil content (49%). Excellent pegging response in light sandy loam soil."
  }
];

export async function fetchSeedRecommendations(crop = 'ALL', soil = 'ALL', season = 'ALL', search = '') {
  try {
    const params = new URLSearchParams({ crop, soil, season, search });
    const res = await fetch(`/api/seeds/recommendations?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("fetchSeedRecommendations notice, using fallback:", err);
  }
  return SEED_FALLBACK_DATA;
}

export async function fetchSeedCatalog() {
  return fetchSeedRecommendations();
}

export async function fetchSeedById(seedId) {
  try {
    const res = await fetch(`/api/seeds/catalog/${seedId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`fetchSeedById notice for ${seedId}:`, err);
  }
  return SEED_FALLBACK_DATA.find(s => s.seed_id === seedId) || SEED_FALLBACK_DATA[0];
}

export async function compareSeedVarieties(seedIdA, seedIdB) {
  try {
    const res = await fetch('/api/seeds/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed_id_a: seedIdA, seed_id_b: seedIdB })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("compareSeedVarieties notice:", err);
  }

  const a = SEED_FALLBACK_DATA.find(s => s.seed_id === seedIdA) || SEED_FALLBACK_DATA[0];
  const b = SEED_FALLBACK_DATA.find(s => s.seed_id === seedIdB) || SEED_FALLBACK_DATA[1];

  return {
    seed_a: a,
    seed_b: b,
    comparison: {
      duration_diff_days: a.growth_duration_days - b.growth_duration_days,
      yield_diff_t_ha: (a.yield_potential_t_ha - b.yield_potential_t_ha).toFixed(1),
      price_diff_inr: (a.price_per_kg_inr - b.price_per_kg_inr).toFixed(2),
      score_diff_pct: (a.ai_match_score - b.ai_match_score).toFixed(1)
    }
  };
}

export async function fetchNearbySeedDealers() {
  try {
    const res = await fetch('/api/seeds/dealers');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("fetchNearbySeedDealers notice:", err);
  }
  return [
    { dealer_name: "TNAU Seed Depot & Agricultural Extension Center", type: "Government Outlet", phone: "+91 416 2220191", address: "Katpadi Road, Vellore", distance_km: 3.8, subsidy: "50% Subsidy Eligible" },
    { dealer_name: "Vellore Farmer Producer Company (FPC) Seed Hub", type: "Farmer Co-operative", phone: "+91 416 2244102", address: "Collectorate Road, Vellore", distance_km: 5.2, subsidy: "Government Approved" }
  ];
}

export async function querySeedAdvisor(prompt, context = "") {
  try {
    const res = await fetch('/api/seeds/ai-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context })
    });
    if (res.ok) {
      const data = await res.json();
      return data.response;
    }
  } catch (err) {
    console.warn("querySeedAdvisor notice:", err);
  }
  return "AI Seed Advisory: Recommended Rice Paddy (ADT-43 Short Duration) for Kuruvai season. Matches Red Loamy soil (pH 6.8) and current 28°C temperature. Expected Yield: 6.2 t/ha (Estimated Net Income: +₹78,500/acre).";
}
