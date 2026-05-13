"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PricingPlan {
  id: string;
  tier: string;
  price: string;
  sub: string;
  note: string;
  cta: string;
  popular: boolean;
  perCert: string | null;
  save: string | null;
}

/**
 * Page: AdminPricing
 * Purpose: Full CRUD module for pricing plans.
 */
export default function AdminPricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([
    {
      id: "single",
      tier: "SINGLE",
      price: "₹218",
      sub: "1 certificate",
      note: "This certificate only",
      cta: "Choose single",
      popular: false,
      perCert: null,
      save: null,
    },
    {
      id: "bundle3",
      tier: "BUNDLE OF 3",
      price: "₹590",
      sub: "₹197 per certificate",
      note: "3 certificates of your choice",
      cta: "Choose bundle",
      popular: true,
      perCert: "₹197",
      save: "SAVE ₹64",
    },
    {
      id: "bundle5",
      tier: "BUNDLE OF 5",
      price: "₹944",
      sub: "₹189 per certificate",
      note: "5 certificates of your choice",
      cta: "Choose bundle",
      popular: false,
      perCert: "₹189",
      save: "SAVE ₹146",
    },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PricingPlan>>({});

  function handleSave() {
    if (editingId) {
      setPlans(plans.map((p) => (p.id === editingId ? { ...p, ...formData } as PricingPlan : p)));
      setEditingId(null);
    } else {
      const newPlan: PricingPlan = {
        id: formData.id || String(plans.length + 1),
        tier: formData.tier || "",
        price: formData.price || "",
        sub: formData.sub || "",
        note: formData.note || "",
        cta: formData.cta || "",
        popular: formData.popular || false,
        perCert: formData.perCert || null,
        save: formData.save || null,
      };
      setPlans([...plans, newPlan]);
    }
    setFormData({});
  }

  function handleEdit(p: PricingPlan) {
    setEditingId(p.id);
    setFormData(p);
  }

  function handleDelete(id: string) {
    setPlans(plans.filter((p) => p.id !== id));
  }

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Pricing Management</h1>

      {/* Create/Edit Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border-default bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Pricing Plan" : "Add New Pricing Plan"}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Plan ID</label>
              <input
                type="text"
                value={formData.id || ""}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
                placeholder="e.g., single, bundle3"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Tier Name</label>
              <input
                type="text"
                value={formData.tier || ""}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
                placeholder="e.g., SINGLE, BUNDLE OF 3"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Price</label>
              <input
                type="text"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
                placeholder="e.g., ₹218"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Sub-price</label>
              <input
                type="text"
                value={formData.sub || ""}
                onChange={(e) => setFormData({ ...formData, sub: e.target.value })}
                className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
                placeholder="e.g., 1 certificate, ₹197 per certificate"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Note</label>
            <input
              type="text"
              value={formData.note || ""}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
              placeholder="e.g., This certificate only"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">CTA Text</label>
              <input
                type="text"
                value={formData.cta || ""}
                onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
                placeholder="e.g., Choose single"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Per Certificate</label>
              <input
                type="text"
                value={formData.perCert || ""}
                onChange={(e) => setFormData({ ...formData, perCert: e.target.value })}
                className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
                placeholder="e.g., ₹197 (optional)"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Save Text</label>
              <input
                type="text"
                value={formData.save || ""}
                onChange={(e) => setFormData({ ...formData, save: e.target.value })}
                className="w-full rounded-xl border border-border-default p-3 focus:border-primary focus:outline-none"
                placeholder="e.g., SAVE ₹64 (optional)"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="popular"
                checked={formData.popular || false}
                onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                className="w-5 h-5 rounded border-border-default text-primary focus:ring-primary"
              />
              <label htmlFor="popular" className="text-sm font-semibold">Mark as Popular</label>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="rounded-xl bg-primary px-6 py-2.5 font-semibold text-white hover:bg-primary-hover transition-colors"
            >
              {editingId ? "Update" : "Add"} Plan
            </motion.button>
            {editingId && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setEditingId(null); setFormData({}); }}
                className="rounded-xl border border-border-default px-6 py-2.5 font-semibold hover:border-primary transition-colors"
              >
                Cancel
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Pricing Plans List */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border-default bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold mb-4">All Pricing Plans ({plans.length})</h2>
        <div className="space-y-3">
          {plans.map((p) => (
            <motion.div
              key={p.id}
              whileHover={{ y: -2, boxShadow: "0 8px 16px rgba(255,107,53,0.12)" }}
              className={`rounded-xl border p-4 transition-all ${
                p.popular ? "border-2 border-primary" : "border-border-default"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {p.popular && (
                      <span className="inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                        MOST POPULAR
                      </span>
                    )}
                    <span className="inline-block rounded-full bg-soft-orange px-2 py-0.5 text-xs font-semibold text-primary">
                      {p.tier}
                    </span>
                  </div>
                  <p className="text-3xl font-extrabold">{p.price}</p>
                  {p.sub && <p className="text-sm text-text-muted mt-1">{p.sub}</p>}
                  {p.save && (
                    <span className="mt-2 inline-block rounded-full bg-soft-orange px-3 py-0.5 text-xs font-bold text-primary">
                      {p.save}
                    </span>
                  )}
                  <p className="text-sm text-text-secondary mt-2">{p.note}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(p)}
                    className="rounded-lg bg-soft-orange px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
