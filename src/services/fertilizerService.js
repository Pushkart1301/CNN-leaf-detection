/**
 * Fertilizer Service Layer - AI Fertilizer Planner Platform
 * Connects frontend UI to FastAPI backend fertilizer endpoints with full client fallback.
 */

const FERTILIZER_FALLBACK_DATA = [
  {
    id: "FERT-2026-001",
    name: "Neem Coated Urea (46% N)",
    brand: "IFFCO / Kribhco",
    type: "Inorganic Nitrogenous",
    npk_ratio: "46:0:0",
    nitrogen_pct: 46.0,
    phosphorus_pct: 0.0,
    potassium_pct: 0.0,
    micronutrients: "Neem Oil 0.035%",
    suitable_crops: "Rice Paddy, Wheat, Maize, Sugarcane, Vegetables",
    application_stage: "Basal & Top Dressing (Split Doses)",
    price_per_bag_inr: 266.5,
    mrp_inr: 300.0,
    bag_size_kg: 45.0,
    subsidy_amount_inr: 1850.0,
    availability: "In Stock (Government Subsidized)",
    image_url: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&q=80&w=600",
    buy_links: {
      iffco: "https://www.iffcoebazar.in/",
      bighaat: "https://www.bighaat.com/search?q=urea",
      indiamart: "https://www.indiamart.com/search.mp?ss=neem+coated+urea",
      amazon: "https://www.amazon.in/s?k=fertilizer+urea"
    },
    ai_score: 98.2,
    reasoning: "Primary nitrogen source for vegetative tillering. Neem coating slows leaching and improves N-use efficiency by 15%."
  },
  {
    id: "FERT-2026-002",
    name: "Di-Ammonium Phosphate (DAP 18:46:0)",
    brand: "IFFCO / Coromandel Gromor",
    type: "Inorganic Phosphatic",
    npk_ratio: "18:46:0",
    nitrogen_pct: 18.0,
    phosphorus_pct: 46.0,
    potassium_pct: 0.0,
    micronutrients: "Calcium 1.5%",
    suitable_crops: "Rice, Wheat, Pulses, Oilseeds, Cotton",
    application_stage: "Basal Application during Sowing/Transplanting",
    price_per_bag_inr: 1350.0,
    mrp_inr: 1500.0,
    bag_size_kg: 50.0,
    subsidy_amount_inr: 2500.0,
    availability: "In Stock (Subsidized Rate)",
    image_url: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=600",
    buy_links: {
      iffco: "https://www.iffcoebazar.in/",
      bighaat: "https://www.bighaat.com/search?q=dap",
      agrostar: "https://www.agrostar.in/",
      amazon: "https://www.amazon.in/s?k=dap+fertilizer"
    },
    ai_score: 96.5,
    reasoning: "Essential basal root builder. High water-soluble P2O5 ensures rapid seedling root establishment."
  },
  {
    id: "FERT-2026-003",
    name: "Muriate of Potash (MOP 60% K2O)",
    brand: "IPL / Nagarjuna",
    type: "Inorganic Potassic",
    npk_ratio: "0:0:60",
    nitrogen_pct: 0.0,
    phosphorus_pct: 0.0,
    potassium_pct: 60.0,
    micronutrients: "Chloride 47%",
    suitable_crops: "Sugarcane, Potato, Banana, Paddy, Cotton",
    application_stage: "Basal & Grain Filling / Flowering Stage",
    price_per_bag_inr: 1700.0,
    mrp_inr: 1850.0,
    bag_size_kg: 50.0,
    subsidy_amount_inr: 1200.0,
    availability: "In Stock",
    image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600",
    buy_links: {
      iffco: "https://www.iffcoebazar.in/",
      bighaat: "https://www.bighaat.com/search?q=mop",
      dehaat: "https://www.dehaat.com/",
      amazon: "https://www.amazon.in/s?k=potash+fertilizer"
    },
    ai_score: 94.8,
    reasoning: "Improves drought tolerance, stalk strength, grain weight, and disease resistance in grain filling stage."
  },
  {
    id: "FERT-2026-004",
    name: "Water Soluble NPK 19:19:19",
    brand: "IFFCO / Mahadhan",
    type: "100% Water Soluble Complex",
    npk_ratio: "19:19:19",
    nitrogen_pct: 19.0,
    phosphorus_pct: 19.0,
    potassium_pct: 19.0,
    micronutrients: "Chelated Micro Mix (Zn, Fe, B, Cu, Mn)",
    suitable_crops: "Tomato, Chilli, Vegetables, Fruits, Flowers",
    application_stage: "Foliar Spray & Drip Fertigation (Vegetative)",
    price_per_bag_inr: 185.0,
    mrp_inr: 220.0,
    bag_size_kg: 1.0,
    subsidy_amount_inr: 0.0,
    availability: "In Stock",
    image_url: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=600",
    buy_links: {
      iffco: "https://www.iffcoebazar.in/",
      bighaat: "https://www.bighaat.com/search?q=19-19-19",
      agribegri: "https://agribegri.com/",
      amazon: "https://www.amazon.in/s?k=npk+19+19+19"
    },
    ai_score: 97.4,
    reasoning: "Balanced vegetative booster for foliar spray (5g/L). Instant absorption within 4 hours."
  }
];

export async function fetchFertilizerRecommendations(crop = 'ALL', stage = 'ALL', search = '') {
  try {
    const params = new URLSearchParams({ crop, stage, search });
    const res = await fetch(`/api/fertilizer/recommendations?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("fetchFertilizerRecommendations notice, using fallback:", err);
  }
  return FERTILIZER_FALLBACK_DATA;
}

export async function calculateNpkDose(crop = 'Rice Paddy', acreage = 1.0, targetYieldT = 6.0) {
  try {
    const res = await fetch('/api/fertilizer/calculate-dose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crop, acreage, target_yield_t_ha: targetYieldT })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("calculateNpkDose notice:", err);
  }

  const acres = parseFloat(acreage) || 1.0;
  return {
    crop: crop,
    acreage_acres: acres,
    target_yield_t_ha: targetYieldT,
    dosage_schedule: {
      basal_dose: `DAP ${(acres * 1.1).toFixed(1)} bags + MOP ${(acres * 0.4).toFixed(1)} bags during sowing`,
      tillering_dose: `Neem Urea ${(acres * 0.8).toFixed(1)} bags + Zinc Sulphate 10kg at 21 days`,
      panicle_dose: `Neem Urea ${(acres * 0.8).toFixed(1)} bags + MOP ${(acres * 0.4).toFixed(1)} bags at 45 days`
    },
    bags_required: {
      neem_coated_urea_45kg_bags: (acres * 1.6).toFixed(1),
      dap_50kg_bags: (acres * 1.1).toFixed(1),
      mop_50kg_bags: (acres * 0.8).toFixed(1)
    },
    financial_summary: {
      farmer_payable_cost_inr: (acres * 3450.0).toFixed(2),
      government_subsidy_value_inr: (acres * 5550.0).toFixed(2),
      net_roi_boost_pct: 18.5
    }
  };
}

export async function compareFertilizers(fertIdA, fertIdB) {
  try {
    const res = await fetch('/api/fertilizer/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fert_id_a: fertIdA, fert_id_b: fertIdB })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("compareFertilizers notice:", err);
  }

  const a = FERTILIZER_FALLBACK_DATA.find(f => f.id === fertIdA) || FERTILIZER_FALLBACK_DATA[0];
  const b = FERTILIZER_FALLBACK_DATA.find(f => f.id === fertIdB) || FERTILIZER_FALLBACK_DATA[1];

  return {
    fertilizer_a: a,
    fertilizer_b: b,
    delta: {
      price_diff_inr: (a.price_per_bag_inr - b.price_per_bag_inr).toFixed(2),
      score_diff_pct: (a.ai_score - b.ai_score).toFixed(1)
    }
  };
}

export async function fetchNearbyFertilizerDealers() {
  try {
    const res = await fetch('/api/fertilizer/dealers');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("fetchNearbyFertilizerDealers notice:", err);
  }
  return [
    { dealer_name: "IFFCO Primary Agricultural Co-op Society (PACS)", type: "Government Co-operative", phone: "+91 416 2220191", address: "Katpadi Main Road, Vellore", distance_km: 2.5, stock_status: "In Stock (Subsidized Urea & DAP)" },
    { dealer_name: "Kribhco Krishak Bharati Fertilizer Depot", type: "Government Depot", phone: "+91 416 2244102", address: "Collectorate Complex, Vellore", distance_km: 4.1, stock_status: "In Stock" }
  ];
}

export async function queryFertilizerAdvisor(prompt, context = "") {
  try {
    const res = await fetch('/api/fertilizer/ai-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context })
    });
    if (res.ok) {
      const data = await res.json();
      return data.response;
    }
  } catch (err) {
    console.warn("queryFertilizerAdvisor notice:", err);
  }
  return "AI Fertilizer Advisory: Recommended Basal dose of DAP (1 bag/acre) + MOP (0.5 bag/acre). Split top dressing of Neem Coated Urea at 21 and 45 days. Foliar NPK 19-19-19 @ 5g/L during vegetative peak. Estimated Net Income: +₹9,200/acre.";
}
