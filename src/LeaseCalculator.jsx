import { useState, useCallback } from "react";


const formatYen = (n) =>
  n < 0
    ? `▲ ¥${Math.abs(Math.round(n)).toLocaleString()}`
    : `¥${Math.round(n).toLocaleString()}`;


const RESIDUAL_RATES_BASE = {
  1: 0.92, 2: 0.85, 3: 0.78, 4: 0.70, 5: 0.63,
  6: 0.56, 7: 0.50, 8: 0.45, 9: 0.41, 10: 0.37,
};


const MILEAGE_OPTIONS = [
  { km: 3000,  label: "3,000km",  residualBonus: 0.12, discountRate: 0.15 },
  { km: 5000,  label: "5,000km",  residualBonus: 0.09, discountRate: 0.11 },
  { km: 8000,  label: "8,000km",  residualBonus: 0.05, discountRate: 0.06 },
  { km: 10000, label: "10,000km", residualBonus: 0.02, discountRate: 0.02 },
  { km: 15000, label: "15,000km（標準）", residualBonus: 0.00, discountRate: 0.00 },
  { km: 20000, label: "20,000km", residualBonus: -0.04, discountRate: -0.04 },
  { km: 30000, label: "30,000km", residualBonus: -0.10, discountRate: -0.08 },
];


const INSPECTION_SCHEDULE = {
  3: 120000, 5: 80000, 7: 120000, 9: 80000,
};


export default function LeaseCalculator() {
  const [carPrice, setCarPrice] = useState(2000000);
  const [years, setYears] = useState(10);
  const [marginRate, setMarginRate] = useState(8);
  const [annualRepair, setAnnualRepair] = useState(50000);
  const [registration, setRegistration] = useState(80000);
  const [mileageIdx, setMileageIdx] = useState(4);
  const [downPayment, setDownPayment] = useState(0);


  const calc = useCallback(() => {
    const months = years * 12;
    const mileage = MILEAGE_OPTIONS[mileageIdx];
    const baseResidualRate = RESIDUAL_RATES_BASE[years] ?? 0.20;
    const residualRate = Math.min(0.95, Math.max(0.10, baseResidualRate + mileage.residualBonus));
    const residualValue = carPrice * residualRate;
    const depreciationTotal = carPrice - residualValue;
    const depreciationMonthly = depreciationTotal / months;


    let totalInspection = 0;
    Object.entries(INSPECTION_SCHEDULE).forEach(([yr, cost]) => {
      if (parseInt(yr) <= years) totalInspection += cost;
    });
    const inspectionMonthly = totalInspection / months;
    const repairMonthly = annualRepair / 12;
    const registrationMonthly = registration / months;
    const costMonthly = depreciationMonthly + inspectionMonthly + repairMonthly + registrationMonthly;
    const profitMonthly = costMonthly * (marginRate / 100);
    const mileageDiscount = costMonthly * mileage.discountRate;
    const downPaymentMonthly = downPayment / months;
    const SHORT_TERM_PREMIUM = { 1: 0.25, 2: 0.18, 3: 0.12, 4: 0.07, 5: 0.04, 6: 0.02, 7: 0.01, 8: 0, 9: 0, 10: 0 };
    const shortTermPremium = costMonthly * (SHORT_TERM_PREMIUM[years] ?? 0);
    const leaseMonthly = Math.max(0, costMonthly + profitMonthly + shortTermPremium - mileageDiscount - downPaymentMonthly);
    const totalCollected = leaseMonthly * months;
    const saleFactor = 0.85 + (mileage.residualBonus * 0.3);
    const saleProfit = residualValue * Math.min(0.95, Math.max(0.70, saleFactor));
    const totalLandlordCost = carPrice + registration + totalInspection;
    const totalRevenue = totalCollected + saleProfit;
    const netProfit = totalRevenue - totalLandlordCost;
