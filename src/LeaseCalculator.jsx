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
    // 初期投資額：車両価格＋登録費＋車検費。修理費はリース料で月次回収するため含まない
    const totalLandlordCost = carPrice + registration + totalInspection;
    const totalRevenue = totalCollected + saleProfit;
    const netProfit = totalRevenue - totalLandlordCost;
    const roi = (netProfit / totalLandlordCost) * 100;

    return { months, mileage, residualRate, residualValue, depreciationTotal, depreciationMonthly, inspectionMonthly, repairMonthly, registrationMonthly, costMonthly, profitMonthly, shortTermPremium, mileageDiscount, downPaymentMonthly, downPayment, leaseMonthly, totalCollected, saleProfit, totalInspection, totalLandlordCost, totalRevenue, netProfit, roi };
  }, [carPrice, years, marginRate, annualRepair, registration, mileageIdx, downPayment]);

  const r = calc();

  const SliderRow = ({ label, value, setValue, min, max, step, format, sub }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: "#8a9bb0", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{label}</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: "#e2eaf5", fontFamily: "'Syne', sans-serif" }}>{format(value)}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: "#5a6a7a", marginBottom: 8 }}>{sub}</div>}
      <div style={{ position: "relative" }}>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => setValue(Number(e.target.value))}
          style={{ width: "100%", height: 4, appearance: "none", background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #1e3050 ${((value - min) / (max - min)) * 100}%, #1e3050 100%)`, borderRadius: 2, outline: "none", cursor: "pointer" }} />
      </div>
    </div>
  );

  const Row = ({ label, value, highlight, dimmed, border }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: border ? "1px solid #1e3050" : "none", opacity: dimmed ? 0.5 : 1 }}>
      <span style={{ fontSize: 12.5, color: highlight ? "#93c5fd" : "#6b7f96", letterSpacing: "0.04em" }}>{label}</span>
      <span style={{ fontSize: highlight ? 16 : 14, fontWeight: highlight ? 700 : 400, color: highlight ? "#e2eaf5" : "#8a9bb0", fontFamily: "'DM Mono', monospace" }}>{value}</span>
    </div>
  );

  const profitColor = r.netProfit >= 0 ? "#34d399" : "#f87171";

  return (
    <div style={{ minHeight: "100vh", background: "#060d1a", fontFamily: "'DM Sans', sans-serif", padding: "0 0 60px 0", color: "#c8d8ea" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #3b82f6; border: 3px solid #060d1a; box-shadow: 0 0 0 2px #3b82f6; cursor: pointer; transition: transform 0.15s; }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.25); }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ background: "linear-gradient(180deg, #0a1628 0%, #060d1a 100%)", borderBottom: "1px solid #1a2d4a", padding: "36px 24px 28px", marginBottom: 32 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#3b82f6", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Advisory Japan — Vehicle Leasing</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#e8f1fb", fontFamily: "'Syne', sans-serif", margin: 0, letterSpacing: "-0.02em" }}>リース料金 計算ツール</h1>
          <p style={{ fontSize: 13, color: "#4a6080", marginTop: 8, lineHeight: 1.6 }}>車検・修理：貸主負担　／　消耗品・保険：借主負担　／　売却益で利益回収</p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          <div style={{ background: "#0b1929", border: "1px solid #1a2d4a", borderRadius: 16, padding: "28px 24px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#3b82f6", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 24 }}>パラメーター設定</div>

            <SliderRow label="車両価格" value={carPrice} setValue={setCarPrice} min={500000} max={30000000} step={50000} format={v => `¥${(v/10000).toFixed(0)}万`} sub="新車購入価格（登録費除く）" />
            <SliderRow label="リース期間" value={years} setValue={setYears} min={1} max={10} step={1} format={v => `${v}年`} sub={`基準残価率：${(RESIDUAL_RATES_BASE[years]*100).toFixed(0)}%（距離補正前）`} />
            <SliderRow label="月次マージン" value={marginRate} setValue={setMarginRate} min={0} max={20} step={0.5} format={v => `${v}%`} sub="原価に上乗せする利益率（最小化推奨）" />
            <SliderRow label="年間修理予算" value={annualRepair} setValue={setAnnualRepair} min={0} max={300000} step={10000} format={v => `¥${(v/10000).toFixed(0)}万`} sub="貸主負担の修理積立（車検除く）" />
            <SliderRow label="初期登録費用" value={registration} setValue={setRegistration} min={0} max={200000} step={5000} format={v => `¥${v.toLocaleString()}`} sub="ナンバー取得・登録諸費用" />
            <SliderRow label="頭金" value={downPayment} setValue={setDownPayment} min={0} max={carPrice*0.5} step={10000} format={v => v===0?"なし":`¥${(v/10000).toFixed(0)}万`} sub={downPayment>0?`月額から ▼${formatYen(downPayment/(years*12))} 減額`:"頭金なし（月額に全額反映）"} />

            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#8a9bb0", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>年間走行距離上限</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: r.mileage.discountRate>0?"#34d399":r.mileage.discountRate<0?"#f87171":"#e2eaf5", fontFamily: "'Syne', sans-serif" }}>
                  {r.mileage.discountRate>0?`▼ ${(r.mileage.discountRate*100).toFixed(0)}%割引`:r.mileage.discountRate<0?`▲ ${(Math.abs(r.mileage.discountRate)*100).toFixed(0)}%割増`:"標準"}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#5a6a7a", marginBottom: 10 }}>
                距離が少ないほど残価↑・月額割引　　補正後残価率: <span style={{ color: "#7cb8ff" }}>{(r.residualRate*100).toFixed(0)}%</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {MILEAGE_OPTIONS.map((opt, i) => (
                  <button key={i} onClick={() => setMileageIdx(i)} style={{ padding: "8px 4px", borderRadius: 8, border: "1px solid", borderColor: mileageIdx===i?"#3b82f6":"#1a2d4a", background: mileageIdx===i?"rgba(59,130,246,0.15)":"#091525", color: mileageIdx===i?"#93c5fd":"#4a6080", fontSize: 10, fontFamily: "'DM Mono', monospace", cursor: "pointer", transition: "all 0.15s", lineHeight: 1.4, textAlign: "center" }}>
                    {opt.label.replace("（標準）", "")}
                    {opt.km===15000&&<div style={{ fontSize: 8, color: "#3b82f6", marginTop: 2 }}>標準</div>}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12, padding: "14px 16px", background: "#0a1929", borderRadius: 10, border: "1px solid #152338" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "#4a6080", textTransform: "uppercase", marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>車検スケジュール（貸主負担）</div>
              {Object.entries(INSPECTION_SCHEDULE).map(([yr, cost]) => (
                <div key={yr} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", opacity: parseInt(yr)<=years?1:0.3 }}>
                  <span style={{ fontSize: 12, color: "#4a6080" }}>{yr}年目</span>
                  <span style={{ fontSize: 12, color: parseInt(yr)<=years?"#7cb8ff":"#333", fontFamily: "'DM Mono', monospace" }}>¥{cost.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #1a2d4a", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#4a6080" }}>期間合計</span>
                <span style={{ fontSize: 12, color: "#7cb8ff", fontFamily: "'DM Mono', monospace" }}>¥{r.totalInspection.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "linear-gradient(135deg, #0d2040 0%, #0a1628 100%)", border: "1px solid #2a4a70", borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#3b82f6", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>月額リース料（借主）</div>
              <div style={{ fontSize: 42, fontWeight: 800, color: "#e8f1fb", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>{formatYen(r.leaseMonthly)}</div>
              <div style={{ fontSize: 12, color: "#3b6090", marginTop: 8 }}>/ 月　（消費税別）</div>
              <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[{l:"減価償却",v:r.depreciationMonthly},{l:"車検積立",v:r.inspectionMonthly},{l:"修理積立",v:r.repairMonthly},{l:"登録費按分",v:r.registrationMonthly}].map(({l,v})=>(
                  <div key={l} style={{ background: "#091525", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: "#3a5060", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>{l}</div>
                    <div style={{ fontSize: 13, color: "#7090a0", fontFamily: "'DM Mono', monospace", marginTop: 3 }}>{formatYen(v)}</div>
                  </div>
                ))}
              </div>
              {r.shortTermPremium>0&&(<div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#fbbf24", fontFamily: "'DM Mono', monospace" }}>短期割増（{years}年契約）</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24", fontFamily: "'DM Mono', monospace" }}>▲ {formatYen(r.shortTermPremium)}</span>
              </div>)}
              {r.downPayment>0&&(<div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>頭金按分（{formatYen(r.downPayment)}）</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#93c5fd", fontFamily: "'DM Mono', monospace" }}>▼ {formatYen(r.downPaymentMonthly)}</span>
              </div>)}
              {r.mileageDiscount!==0&&(<div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: r.mileageDiscount>0?"rgba(52,211,153,0.07)":"rgba(248,113,113,0.07)", border: `1px solid ${r.mileageDiscount>0?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: r.mileageDiscount>0?"#34d399":"#f87171", fontFamily: "'DM Mono', monospace" }}>走行距離割引（{r.mileage.label}）</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: r.mileageDiscount>0?"#34d399":"#f87171", fontFamily: "'DM Mono', monospace" }}>{r.mileageDiscount>0?`▼ ${formatYen(r.mileageDiscount)}`:`▲ ${formatYen(Math.abs(r.mileageDiscount))}`}</span>
              </div>)}
            </div>

            <div style={{ background: "#0b1929", border: "1px solid #1a2d4a", borderRadius: 16, padding: "20px 20px" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#3b82f6", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>貸主 収支サマリー</div>
              <Row label="初期投資総額" value={formatYen(r.totalLandlordCost)} border />
              <Row label={`リース回収（${r.months}ヶ月）`} value={formatYen(r.totalCollected)} border />
              <Row label={`売却益（残価 ${(r.residualRate*100).toFixed(0)}% × 査定率）`} value={formatYen(r.saleProfit)} border />
              <Row label="総収益" value={formatYen(r.totalRevenue)} border />
              <div style={{ marginTop: 16, padding: "16px", borderRadius: 12, background: r.netProfit>=0?"rgba(52,211,153,0.06)":"rgba(248,113,113,0.06)", border: `1px solid ${r.netProfit>=0?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, color: profitColor, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>純利益</div>
                  <div style={{ fontSize: 11, color: "#3a5060", marginTop: 2 }}>ROI: {r.roi.toFixed(1)}%</div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: profitColor, fontFamily: "'Syne', sans-serif" }}>{formatYen(r.netProfit)}</div>
              </div>
            </div>

            <div style={{ background: "#0b1929", border: "1px solid #1a2d4a", borderRadius: 16, padding: "20px 20px" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#3b82f6", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>残価・返却時</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[{l:"残価（帳簿上）",v:formatYen(r.residualValue)},{l:"査定売却益",v:formatYen(r.saleProfit)},{l:"減価総額",v:formatYen(r.depreciationTotal)},{l:"月次マージン計",v:formatYen(r.profitMonthly*r.months)}].map(({l,v})=>(
                  <div key={l} style={{ background: "#091525", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 9, color: "#3a5060", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 14, color: "#7090a0", fontFamily: "'DM Mono', monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: "12px 16px", background: "#080f1c", borderRadius: 10, border: "1px solid #111e30" }}>
              <div style={{ fontSize: 10, color: "#2a4060", lineHeight: 1.7 }}>
                ※ 残価率は中古車市場の一般的な参考値。査定売却益は残価の85%で試算。<br />
                ※ 消耗品（タイヤ・オイル等）・自動車保険は借主負担。<br />
                ※ 消費税は別途計算。金利・損害保険は含まず。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
