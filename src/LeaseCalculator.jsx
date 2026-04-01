import { useState, useCallback } from "react";

const formatYen = (n) => n < 0 ? `▲ ¥${Math.abs(Math.round(n)).toLocaleString()}` : `¥${Math.round(n).toLocaleString()}`;
const RESIDUAL_RATES_BASE = { 1: 0.92, 2: 0.85, 3: 0.78, 4: 0.70, 5: 0.63, 6: 0.56, 7: 0.50, 8: 0.45, 9: 0.41, 10: 0.37 };
const MILEAGE_OPTIONS = [
  { km: 3000, label: "3,000km", residualBonus: 0.12, discountRate: 0.15 },
  { km: 5000, label: "5,000km", residualBonus: 0.09, discountRate: 0.11 },
  { km: 8000, label: "8,000km", residualBonus: 0.05, discountRate: 0.06 },
  { km: 10000, label: "10,000km", residualBonus: 0.02, discountRate: 0.02 },
  { km: 15000, label: "15,000km（標準）", residualBonus: 0.00, discountRate: 0.00 },
  { km: 20000, label: "20,000km", residualBonus: -0.04, discountRate: -0.04 },
  { km: 30000, label: "30,000km", residualBonus: -0.10, discountRate: -0.08 },
];
const INSPECTION_SCHEDULE = { 3: 120000, 5: 80000, 7: 120000, 9: 80000 };
