import React, { useEffect, useState } from 'react';
import { CalendarDays, Leaf, Pencil, Plus, Save, Trash2, X } from 'lucide-react';

const STORAGE_KEY = 'agriverse-my-field-crops';

const loadFieldCrops = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const crops = saved ? JSON.parse(saved) : [];
    return Array.isArray(crops)
      ? crops.filter(crop => (
        crop &&
        typeof crop.id === 'string' &&
        typeof crop.name === 'string' &&
        typeof crop.plantedMonth === 'string' &&
        Number.isFinite(crop.quantity) &&
        Number.isFinite(crop.area)
      ))
      : [];
  } catch (error) {
    console.warn('Could not load saved field crops:', error);
    return [];
  }
};

const EMPTY_FORM = {
  name: '',
  customName: '',
  plantedMonth: '',
  quantity: '',
  quantityUnit: 'kg',
  area: '',
  areaUnit: 'acre',
};

const COMMON_INDIAN_CROPS = [
  'Rice',
  'Wheat',
  'Maize',
  'Cotton',
  'Sugarcane',
  'Soybean',
  'Groundnut',
  'Tomato',
  'Potato',
  'Chilli',
  'Onion',
  'Pulses',
];

const formatMonth = value => {
  if (!value) return '';
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
};

export const MyFieldCropsTab = () => {
  const [crops, setCrops] = useState(loadFieldCrops);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(crops));
      window.dispatchEvent(new Event('agriverse-field-crops-updated'));
      setStorageError('');
    } catch (error) {
      console.error('Could not save field crops:', error);
      setStorageError('Could not save changes in this browser. Check available storage.');
    }
  }, [crops]);

  const updateForm = event => {
    setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
    setFormError('');
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = event => {
    event.preventDefault();
    const quantity = Number(form.quantity);
    const area = Number(form.area);
    const cropName = form.name === 'Other' ? form.customName.trim() : form.name;
    if (!cropName || !form.plantedMonth || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(area) || area <= 0) {
      setFormError('Enter a crop name, cultivation month, quantity, and area greater than zero.');
      return;
    }

    const record = {
      id: editingId || `${Date.now()}`,
      name: cropName,
      plantedMonth: form.plantedMonth,
      quantity,
      quantityUnit: form.quantityUnit,
      area,
      areaUnit: form.areaUnit,
    };
    setCrops(previous => (
      editingId
        ? previous.map(crop => crop.id === editingId ? record : crop)
        : [record, ...previous]
    ));
    resetForm();
  };

  const startEditing = crop => {
    setForm({
      name: COMMON_INDIAN_CROPS.includes(crop.name) ? crop.name : 'Other',
      customName: COMMON_INDIAN_CROPS.includes(crop.name) ? '' : crop.name,
      plantedMonth: crop.plantedMonth,
      quantity: String(crop.quantity),
      quantityUnit: crop.quantityUnit,
      area: String(crop.area),
      areaUnit: crop.areaUnit,
    });
    setEditingId(crop.id);
    setFormError('');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in duration-300">
      <header className="glass-panel rounded-2xl border border-emerald-500/30 p-6 space-y-2">
        <div className="flex items-center gap-3">
          <Leaf className="h-6 w-6 text-emerald-400" />
          <h1 className="text-xl font-extrabold text-slate-100">My Field Crops</h1>
        </div>
        <p className="text-sm text-slate-400">
          Record the crops currently in your fields, when they were planted, the quantity, and the area.
        </p>
        <p className="text-xs text-slate-500">Entries are saved in this browser on this device.</p>
      </header>

      <section className="glass-panel rounded-2xl border border-white/10 p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-100">
          {editingId ? <Pencil className="h-4 w-4 text-emerald-400" /> : <Plus className="h-4 w-4 text-emerald-400" />}
          {editingId ? 'Edit crop entry' : 'Add a crop'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-xs text-slate-300">
            <span>Crop name</span>
            <select
              name="name"
              value={form.name}
              onChange={updateForm}
              required
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-slate-100 focus:border-emerald-500/50 focus:outline-none"
            >
              <option value="">Select a crop</option>
              {COMMON_INDIAN_CROPS.map(crop => <option key={crop} value={crop}>{crop}</option>)}
              <option value="Other">Other</option>
            </select>
          </label>
          {form.name === 'Other' && (
            <label className="space-y-1 text-xs text-slate-300">
              <span>Crop name</span>
              <input
                name="customName"
                value={form.customName}
                onChange={updateForm}
                placeholder="Enter crop name"
                maxLength={80}
                required
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
              />
            </label>
          )}
          <label className="space-y-1 text-xs text-slate-300">
            <span>Planted in</span>
            <input
              type="month"
              name="plantedMonth"
              value={form.plantedMonth}
              onChange={updateForm}
              required
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-sm text-slate-100 focus:border-emerald-500/50 focus:outline-none"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-300">
            <span>Quantity</span>
            <div className="flex gap-2">
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={updateForm}
                min="0.01"
                step="any"
                required
                placeholder="e.g. 500"
                className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
              />
              <select name="quantityUnit" value={form.quantityUnit} onChange={updateForm} className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-sm text-slate-100">
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="tonne">tonne</option>
                <option value="bags">bags</option>
              </select>
            </div>
          </label>
          <label className="space-y-1 text-xs text-slate-300">
            <span>Field area</span>
            <div className="flex gap-2">
              <input
                type="number"
                name="area"
                value={form.area}
                onChange={updateForm}
                min="0.01"
                step="any"
                required
                placeholder="e.g. 2"
                className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
              />
              <select name="areaUnit" value={form.areaUnit} onChange={updateForm} className="h-10 rounded-xl border border-white/10 bg-slate-900 px-2 text-sm text-slate-100">
                <option value="acre">acre</option>
                <option value="hectare">hectare</option>
              </select>
            </div>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 font-bold text-slate-950 hover:bg-emerald-400">
              <Save className="h-4 w-4" />
              {editingId ? 'Save changes' : 'Add crop'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} aria-label="Cancel editing" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
        {formError && <p role="alert" className="mt-3 text-xs text-amber-300">{formError}</p>}
        {storageError && <p role="alert" className="mt-3 text-xs text-rose-300">{storageError}</p>}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100">Crops in your fields</h2>
          <span className="text-xs text-slate-400">{crops.length} {crops.length === 1 ? 'crop' : 'crops'}</span>
        </div>
        {crops.length === 0 ? (
          <div className="glass-panel rounded-2xl border border-white/10 p-8 text-center text-sm text-slate-400">
            No crops added yet. Use the form above to record what is growing in your fields.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {crops.map(crop => (
              <article key={crop.id} className="glass-panel rounded-2xl border border-white/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-100">{crop.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5 text-cyan-400" />
                      Planted {formatMonth(crop.plantedMonth)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => startEditing(crop)} aria-label={`Edit ${crop.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-emerald-300">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setCrops(previous => previous.filter(item => item.id !== crop.id))} aria-label={`Delete ${crop.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-xs">
                  <div>
                    <span className="block text-slate-500">Quantity</span>
                    <strong className="text-emerald-300">{crop.quantity} {crop.quantityUnit}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500">Field area</span>
                    <strong className="text-cyan-300">{crop.area} {crop.areaUnit}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
