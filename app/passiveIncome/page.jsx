"use client";

// This file is the main page for the passive income calculator app. It manages state, calculations, and renders the UI.


import { useEffect, useMemo, useState } from "react";
const SECONDS_PER_DAY = 86400;
const DAYS_PER_MONTH = 30.4375;
const DAYS_PER_YEAR = 365;
const DEFAULT_STATE = {
  incomeSources: [
    {
      id: "income-1",
      name: "Passive income",
      type: "passive",
      amount: 5,
      frequency: "day",
      enabled: true,
    },
  ],
  expenses: [
    {
      id: "expense-1",
      name: "Food",
      amount: 0,
      frequency: "day",
      enabled: true,
    },
  ],
  assets: [{ id: "asset-1", name: "Cash", value: 0 }],
  debts: [
    {
      id: "debt-1",
      name: "Credit card",
      balance: 0,
      apr: 0,
      minimumPayment: 0,
    },
  ],
};
function createId(prefix) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function safeNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, n);
}
function currency(value, digits = 2) {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(safe);
}
function number(value, digits = 2) {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(safe);
}
function frequencyToDaily(amount, frequency) {
  const value = safeNumber(amount);
  switch (frequency) {
    case "second":
      return value * 86400;
    case "minute":
      return value * 1440;
    case "hour":
      return value * 24;
    case "week":
      return value / 7;
    case "month":
      return value / DAYS_PER_MONTH;
    case "year":
      return value / DAYS_PER_YEAR;
    case "day":
    default:
      return value;
  }
}
function dailyToFrequency(daily) {
  return {
    second: daily / SECONDS_PER_DAY,
    minute: daily / 1440,
    hour: daily / 24,
    day: daily,
    week: daily * 7,
    month: daily * DAYS_PER_MONTH,
    year: daily * DAYS_PER_YEAR,
  };
}
function calculateDebtPayoffDays(balance, dailyAllocation) {
  if (balance <= 0) {
    return 0;
  }
  if (dailyAllocation <= 0) {
    return Infinity;
  }
  return balance / dailyAllocation;
}
function formatDuration(days) {
  if (!Number.isFinite(days)) {
    return "No payoff projected";
  }
  if (days <= 0) {
    return "Paid off";
  }
  if (days < 1) {
    const hours = Math.max(1, Math.ceil(days * 24));
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  if (days < 60) {
    const rounded = Math.ceil(days);
    return `${rounded} day${rounded === 1 ? "" : "s"}`;
  }
  if (days < 730) {
    const months = days / DAYS_PER_MONTH;
    return `${number(months, 1)} months`;
  }
  const years = days / DAYS_PER_YEAR;
  return `${number(years, 1)} years`;
}
function loadInitialState() {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }
  try {
    const raw = window.localStorage.getItem("money-velocity-state");
    if (!raw) {
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    return {
      incomeSources: Array.isArray(parsed.incomeSources)
        ? parsed.incomeSources
        : DEFAULT_STATE.incomeSources,
      expenses: Array.isArray(parsed.expenses)
        ? parsed.expenses
        : DEFAULT_STATE.expenses,
      assets: Array.isArray(parsed.assets)
        ? parsed.assets
        : DEFAULT_STATE.assets,
      debts: Array.isArray(parsed.debts) ? parsed.debts : DEFAULT_STATE.debts,
    };
  } catch {
    return DEFAULT_STATE;
  }
}
export default function Page() {
  const [data, setData] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(null);
  const [activeTab, setActiveTab] = useState("income");
  useEffect(() => {
    const initial = loadInitialState();
    setData(initial);
    const time = Date.now();
    setStartedAt(time);
    setNow(time);
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    window.localStorage.setItem("money-velocity-state", JSON.stringify(data));
  }, [data, hydrated]);
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 100);
    return () => {
      window.clearInterval(timer);
    };
  }, [hydrated]);
  const calculations = useMemo(() => {
    const enabledIncome = data.incomeSources.filter(
      (source) => source.enabled !== false,
    );
    const enabledExpenses = data.expenses.filter(
      (expense) => expense.enabled !== false,
    );
    const incomeRows = enabledIncome.map((source) => ({
      ...source,
      daily: frequencyToDaily(source.amount, source.frequency),
    }));
    const expenseRows = enabledExpenses.map((expense) => ({
      ...expense,
      daily: frequencyToDaily(expense.amount, expense.frequency),
    }));
    const grossDailyIncome = incomeRows.reduce(
      (total, source) => total + source.daily,
      0,
    );
    const passiveDailyIncome = incomeRows
      .filter((source) => source.type === "passive")
      .reduce((total, source) => total + source.daily, 0);
    const activeDailyIncome = incomeRows
      .filter((source) => source.type === "active")
      .reduce((total, source) => total + source.daily, 0);
    const recurringDailyExpenses = expenseRows.reduce(
      (total, expense) => total + expense.daily,
      0,
    );
    const netDailyIncome = grossDailyIncome - recurringDailyExpenses;
    const grossRates = dailyToFrequency(grossDailyIncome);
    const passiveRates = dailyToFrequency(passiveDailyIncome);
    const activeRates = dailyToFrequency(activeDailyIncome);
    const netRates = dailyToFrequency(netDailyIncome);
    const totalAssets = data.assets.reduce(
      (total, asset) => total + safeNumber(asset.value),
      0,
    );
    const totalDebt = data.debts.reduce(
      (total, debt) => total + safeNumber(debt.balance),
      0,
    );
    const netWorth = totalAssets - totalDebt;
    const minimumPaymentsMonthly = data.debts.reduce(
      (total, debt) => total + safeNumber(debt.minimumPayment),
      0,
    );
    const minimumPaymentsDaily = minimumPaymentsMonthly / DAYS_PER_MONTH;
    const repaymentPower = Math.max(0, netDailyIncome);
    const debtFreeDays = calculateDebtPayoffDays(totalDebt, repaymentPower);
    const expenseCoverage =
      recurringDailyExpenses > 0
        ? passiveDailyIncome / recurringDailyExpenses
        : passiveDailyIncome > 0
          ? 1
          : 0;
    const autonomyPercent = Math.max(0, Math.min(100, expenseCoverage * 100));
    return {
      incomeRows,
      expenseRows,
      grossDailyIncome,
      passiveDailyIncome,
      activeDailyIncome,
      recurringDailyExpenses,
      netDailyIncome,
      grossRates,
      passiveRates,
      activeRates,
      netRates,
      totalAssets,
      totalDebt,
      netWorth,
      minimumPaymentsMonthly,
      minimumPaymentsDaily,
      repaymentPower,
      debtFreeDays,
      autonomyPercent,
    };
  }, [data]);
  const elapsedSeconds =
    startedAt && now ? Math.max(0, (now - startedAt) / 1000) : 0;
  const generatedSinceOpen = elapsedSeconds * calculations.grossRates.second;
  const netGeneratedSinceOpen = elapsedSeconds * calculations.netRates.second;
  function updateCollectionItem(collection, id, field, value) {
    setData((current) => ({
      ...current,
      [collection]: current[collection].map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  }
  function removeCollectionItem(collection, id) {
    setData((current) => ({
      ...current,
      [collection]: current[collection].filter((item) => item.id !== id),
    }));
  }
  function addIncome() {
    setData((current) => ({
      ...current,
      incomeSources: [
        ...current.incomeSources,
        {
          id: createId("income"),
          name: "New income source",
          type: "passive",
          amount: 0,
          frequency: "day",
          enabled: true,
        },
      ],
    }));
    setActiveTab("income");
  }
  function addExpense() {
    setData((current) => ({
      ...current,
      expenses: [
        ...current.expenses,
        {
          id: createId("expense"),
          name: "New expense",
          amount: 0,
          frequency: "month",
          enabled: true,
        },
      ],
    }));
    setActiveTab("expenses");
  }
  function addAsset() {
    setData((current) => ({
      ...current,
      assets: [
        ...current.assets,
        { id: createId("asset"), name: "New asset", value: 0 },
      ],
    }));
    setActiveTab("assets");
  }
  function addDebt() {
    setData((current) => ({
      ...current,
      debts: [
        ...current.debts,
        {
          id: createId("debt"),
          name: "New debt",
          balance: 0,
          apr: 0,
          minimumPayment: 0,
        },
      ],
    }));
    setActiveTab("debts");
  }
  function resetData() {
    const confirmed = window.confirm("Reset all financial data?");
    if (!confirmed) {
      return;
    }
    setData(DEFAULT_STATE);
    const time = Date.now();
    setStartedAt(time);
    setNow(time);
  }
  return (
    <main className="page">
      {" "}
      <style>{` * { box-sizing: border-box; } body { margin: 0; background: #08090b; } button, input, select { font: inherit; } .page { min-height: 100vh; background: radial-gradient( circle at top, rgba(255,255,255,0.045), transparent 32rem ), #08090b; color: #f5f7fa; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; } .shell { width: min(1180px, 100%); margin: 0 auto; } .topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 36px; } .brand { font-size: 14px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; } .muted { color: #838995; } .button { appearance: none; border: 1px solid #292d34; color: #f5f7fa; background: #12151a; border-radius: 10px; min-height: 42px; padding: 0 14px; cursor: pointer; } .button:hover { background: #191d23; } .button.primary { background: #f5f7fa; color: #08090b; border-color: #f5f7fa; font-weight: 650; } .button.danger { color: #ff9292; } .hero { margin-bottom: 32px; } .eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0.16em; color: #737a86; margin-bottom: 10px; } .velocity { font-size: clamp( 36px, 7vw, 76px ); line-height: 0.95; letter-spacing: -0.055em; font-weight: 720; overflow-wrap: anywhere; } .velocity-unit { font-size: clamp( 16px, 2vw, 22px ); color: #737a86; margin-left: 8px; letter-spacing: -0.02em; font-weight: 500; } .hero-subtext { margin-top: 18px; color: #878e99; display: flex; flex-wrap: wrap; gap: 18px; font-size: 14px; } .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 28px; } .metric { border: 1px solid #22262d; background: rgba(16, 18, 22, 0.86); padding: 18px; border-radius: 16px; min-width: 0; } .metric-label { color: #747c88; font-size: 12px; margin-bottom: 10px; } .metric-value { font-size: 23px; font-weight: 650; letter-spacing: -0.025em; overflow-wrap: anywhere; } .metric-secondary { color: #747c88; font-size: 12px; margin-top: 8px; } .section { border-top: 1px solid #22262d; padding-top: 28px; margin-top: 28px; } .section-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 20px; } .section-title { font-size: 22px; font-weight: 650; letter-spacing: -0.025em; } .section-description { color: #747c88; font-size: 13px; margin-top: 5px; max-width: 640px; } .autonomy-layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(220px, 0.5fr); gap: 18px; } .progress-panel, .payoff-panel { background: #101216; border: 1px solid #22262d; border-radius: 16px; padding: 20px; } .progress-track { width: 100%; height: 10px; background: #252931; border-radius: 999px; overflow: hidden; margin-top: 18px; } .progress-fill { height: 100%; background: #f3f5f7; border-radius: inherit; transition: width 300ms ease; } .big-number { font-size: 34px; font-weight: 680; letter-spacing: -0.04em; } .tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; } .tab { appearance: none; border: 1px solid #242832; background: #0d0f13; color: #858c98; border-radius: 10px; padding: 9px 13px; cursor: pointer; } .tab.active { background: #f5f7fa; border-color: #f5f7fa; color: #08090b; font-weight: 650; } .list { display: grid; gap: 10px; } .row-card { border: 1px solid #22262d; background: #101216; border-radius: 14px; padding: 16px; } .row-grid { display: grid; grid-template-columns: minmax(160px, 2fr) minmax(105px, 1fr) minmax(115px, 1fr) auto; gap: 10px; align-items: end; } .field { display: grid; gap: 6px; min-width: 0; } .field label { color: #777f8b; font-size: 11px; } .input, .select { width: 100%; min-width: 0; border: 1px solid #292e37; border-radius: 9px; background: #090b0e; color: #f5f7fa; min-height: 42px; padding: 0 11px; outline: none; } .input:focus, .select:focus { border-color: #737c8a; } .row-footer { display: flex; justify-content: space-between; gap: 14px; align-items: center; flex-wrap: wrap; margin-top: 12px; color: #7c8490; font-size: 12px; } .toggle { display: flex; gap: 8px; align-items: center; } .remove { appearance: none; border: none; background: transparent; color: #8b929d; cursor: pointer; padding: 8px; } .remove:hover { color: #ff8585; } .add-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; } .empty { border: 1px dashed #292e37; border-radius: 14px; padding: 28px; text-align: center; color: #777f8b; } .debt-list { display: grid; gap: 12px; } .debt-progress { height: 6px; background: #262a31; border-radius: 999px; overflow: hidden; margin-top: 12px; } .debt-progress > div { height: 100%; background: #f2f4f7; } .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #22262d; color: #676e79; font-size: 12px; display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; } @media (max-width: 900px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .autonomy-layout { grid-template-columns: 1fr; } .row-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (max-width: 560px) { .page { padding: 18px; } .topbar { align-items: flex-start; } .grid { grid-template-columns: 1fr; } .row-grid { grid-template-columns: 1fr; } .velocity-unit { display: block; margin-left: 0; margin-top: 8px; } } `}</style>{" "}
      <div className="shell">
        {" "}
        <header className="topbar">
          {" "}
          <div>
            {" "}
            <div className="brand"> Money Velocity </div>{" "}
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {" "}
              Personal financial engine{" "}
            </div>{" "}
          </div>{" "}
          <button type="button" className="button" onClick={resetData}>
            {" "}
            Reset{" "}
          </button>{" "}
        </header>{" "}
        <section className="hero">
          {" "}
          <div className="eyebrow"> Current gross generation </div>{" "}
          <div className="velocity">
            {" "}
            {currency(calculations.grossRates.second, 8)}{" "}
            <span className="velocity-unit"> / second </span>{" "}
          </div>{" "}
          <div className="hero-subtext">
            {" "}
            <span>
              {" "}
              Gross generated while open: {currency(generatedSinceOpen, 6)}{" "}
            </span>{" "}
            <span>
              {" "}
              Net generated while open:{" "}
              {currency(netGeneratedSinceOpen, 6)}{" "}
            </span>{" "}
            <span> Estimates based on the sources you configure. </span>{" "}
          </div>{" "}
        </section>{" "}
        <section className="grid">
          {" "}
          <Metric
            label="Per hour"
            value={currency(calculations.grossRates.hour)}
            secondary="Gross generation"
          />{" "}
          <Metric
            label="Per day"
            value={currency(calculations.grossRates.day)}
            secondary="Gross generation"
          />{" "}
          <Metric
            label="Net per day"
            value={currency(calculations.netRates.day)}
            secondary="After recurring expenses"
          />{" "}
          <Metric
            label="Net per month"
            value={currency(calculations.netRates.month)}
            secondary="Estimated"
          />{" "}
          <Metric
            label="Assets"
            value={currency(calculations.totalAssets)}
            secondary="Configured assets"
          />{" "}
          <Metric
            label="Debt"
            value={currency(calculations.totalDebt)}
            secondary="Outstanding liabilities"
          />{" "}
          <Metric
            label="Net worth"
            value={currency(calculations.netWorth)}
            secondary="Assets minus debt"
          />{" "}
          <Metric
            label="Debt-free estimate"
            value={formatDuration(calculations.debtFreeDays)}
            secondary={
              calculations.repaymentPower > 0
                ? `${currency(calculations.repaymentPower)}/day repayment power`
                : "Requires positive net cash flow"
            }
          />{" "}
        </section>{" "}
        <section className="section">
          {" "}
          <div className="section-header">
            {" "}
            <div>
              {" "}
              <div className="section-title"> Financial autonomy </div>{" "}
              <div className="section-description">
                {" "}
                Measures how much of your recurring spending is covered by
                passive income.{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="autonomy-layout">
            {" "}
            <div className="progress-panel">
              {" "}
              <div className="eyebrow"> Expense coverage </div>{" "}
              <div className="big-number">
                {" "}
                {number(calculations.autonomyPercent, 1)} %{" "}
              </div>{" "}
              <div className="progress-track">
                {" "}
                <div
                  className="progress-fill"
                  style={{ width: `${calculations.autonomyPercent}%` }}
                />{" "}
              </div>{" "}
              <div className="muted" style={{ fontSize: 13, marginTop: 14 }}>
                {" "}
                Passive income: {currency(calculations.passiveDailyIncome)} /day
                · Expenses: {currency(calculations.recurringDailyExpenses)}{" "}
                /day{" "}
              </div>{" "}
            </div>{" "}
            <div className="payoff-panel">
              {" "}
              <div className="eyebrow"> Debt repayment power </div>{" "}
              <div className="big-number">
                {" "}
                {currency(calculations.repaymentPower)}{" "}
              </div>{" "}
              <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                {" "}
                available per day after recurring expenses{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        <section className="section">
          {" "}
          <div className="section-header">
            {" "}
            <div>
              {" "}
              <div className="section-title"> Financial system </div>{" "}
              <div className="section-description">
                {" "}
                Add, remove, disable, or change any source. All calculations
                update immediately.{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="tabs">
            {" "}
            <Tab
              active={activeTab === "income"}
              onClick={() => setActiveTab("income")}
            >
              {" "}
              Income{" "}
            </Tab>{" "}
            <Tab
              active={activeTab === "expenses"}
              onClick={() => setActiveTab("expenses")}
            >
              {" "}
              Expenses{" "}
            </Tab>{" "}
            <Tab
              active={activeTab === "assets"}
              onClick={() => setActiveTab("assets")}
            >
              {" "}
              Assets{" "}
            </Tab>{" "}
            <Tab
              active={activeTab === "debts"}
              onClick={() => setActiveTab("debts")}
            >
              {" "}
              Debt{" "}
            </Tab>{" "}
          </div>{" "}
          {activeTab === "income" && (
            <IncomeEditor
              sources={data.incomeSources}
              calculations={calculations}
              update={updateCollectionItem}
              remove={removeCollectionItem}
              add={addIncome}
            />
          )}{" "}
          {activeTab === "expenses" && (
            <ExpenseEditor
              expenses={data.expenses}
              update={updateCollectionItem}
              remove={removeCollectionItem}
              add={addExpense}
            />
          )}{" "}
          {activeTab === "assets" && (
            <AssetEditor
              assets={data.assets}
              update={updateCollectionItem}
              remove={removeCollectionItem}
              add={addAsset}
            />
          )}{" "}
          {activeTab === "debts" && (
            <DebtEditor
              debts={data.debts}
              repaymentPower={calculations.repaymentPower}
              update={updateCollectionItem}
              remove={removeCollectionItem}
              add={addDebt}
            />
          )}{" "}
        </section>{" "}
        <section className="section">
          {" "}
          <div className="section-header">
            {" "}
            <div>
              {" "}
              <div className="section-title"> Income composition </div>{" "}
              <div className="section-description">
                {" "}
                Distinguishes generation requiring labor from generation that
                continues independently.{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="grid">
            {" "}
            <Metric
              label="Passive / day"
              value={currency(calculations.passiveDailyIncome)}
              secondary={`${currency(calculations.passiveRates.second, 8)}/sec`}
            />{" "}
            <Metric
              label="Active / day"
              value={currency(calculations.activeDailyIncome)}
              secondary={`${currency(calculations.activeRates.second, 8)}/sec`}
            />{" "}
            <Metric
              label="Expenses / day"
              value={currency(calculations.recurringDailyExpenses)}
              secondary="Recurring outflow"
            />{" "}
            <Metric
              label="Minimum debt payments"
              value={currency(calculations.minimumPaymentsMonthly)}
              secondary="Per month"
            />{" "}
          </div>{" "}
        </section>{" "}
        <footer className="footer">
          {" "}
          <span> Stored locally in this browser. </span>{" "}
          <span>
            {" "}
            All future-value and payoff figures are estimates, not bank
            balances.{" "}
          </span>{" "}
        </footer>{" "}
      </div>{" "}
    </main>
  );
}
function Metric({ label, value, secondary }) {
  return (
    <div className="metric">
      {" "}
      <div className="metric-label"> {label} </div>{" "}
      <div className="metric-value"> {value} </div>{" "}
      {secondary && <div className="metric-secondary"> {secondary} </div>}{" "}
    </div>
  );
}
function Tab({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`tab ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {" "}
      {children}{" "}
    </button>
  );
}
function IncomeEditor({ sources, update, remove, add }) {
  if (sources.length === 0) {
    return (
      <>
        {" "}
        <div className="empty"> No income sources yet. </div>{" "}
        <div className="add-actions">
          {" "}
          <button type="button" className="button primary" onClick={add}>
            {" "}
            Add income source{" "}
          </button>{" "}
        </div>{" "}
      </>
    );
  }
  return (
    <>
      {" "}
      <div className="list">
        {" "}
        {sources.map((source) => {
          const daily = frequencyToDaily(source.amount, source.frequency);
          return (
            <div className="row-card" key={source.id}>
              {" "}
              <div className="row-grid">
                {" "}
                <Field label="Name">
                  {" "}
                  <input
                    className="input"
                    value={source.name}
                    onChange={(event) =>
                      update(
                        "incomeSources",
                        source.id,
                        "name",
                        event.target.value,
                      )
                    }
                  />{" "}
                </Field>{" "}
                <Field label="Amount">
                  {" "}
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    value={source.amount}
                    onChange={(event) =>
                      update(
                        "incomeSources",
                        source.id,
                        "amount",
                        event.target.value,
                      )
                    }
                  />{" "}
                </Field>{" "}
                <Field label="Frequency">
                  {" "}
                  <FrequencySelect
                    value={source.frequency}
                    onChange={(value) =>
                      update("incomeSources", source.id, "frequency", value)
                    }
                  />{" "}
                </Field>{" "}
                <Field label="Type">
                  {" "}
                  <select
                    className="select"
                    value={source.type}
                    onChange={(event) =>
                      update(
                        "incomeSources",
                        source.id,
                        "type",
                        event.target.value,
                      )
                    }
                  >
                    {" "}
                    <option value="passive"> Passive </option>{" "}
                    <option value="active"> Active </option>{" "}
                  </select>{" "}
                </Field>{" "}
              </div>{" "}
              <div className="row-footer">
                {" "}
                <div>
                  {" "}
                  Equivalent: {currency(daily)}/day ·{" "}
                  {currency(daily / SECONDS_PER_DAY, 8)} /sec{" "}
                </div>{" "}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {" "}
                  <label className="toggle">
                    {" "}
                    <input
                      type="checkbox"
                      checked={source.enabled !== false}
                      onChange={(event) =>
                        update(
                          "incomeSources",
                          source.id,
                          "enabled",
                          event.target.checked,
                        )
                      }
                    />{" "}
                    Active{" "}
                  </label>{" "}
                  <button
                    type="button"
                    className="remove"
                    onClick={() => remove("incomeSources", source.id)}
                  >
                    {" "}
                    Remove{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
            </div>
          );
        })}{" "}
      </div>{" "}
      <div className="add-actions">
        {" "}
        <button type="button" className="button primary" onClick={add}>
          {" "}
          Add income source{" "}
        </button>{" "}
      </div>{" "}
    </>
  );
}
function ExpenseEditor({ expenses, update, remove, add }) {
  return (
    <>
      {" "}
      {expenses.length === 0 ? (
        <div className="empty"> No recurring expenses yet. </div>
      ) : (
        <div className="list">
          {" "}
          {expenses.map((expense) => {
            const daily = frequencyToDaily(expense.amount, expense.frequency);
            return (
              <div className="row-card" key={expense.id}>
                {" "}
                <div className="row-grid">
                  {" "}
                  <Field label="Name">
                    {" "}
                    <input
                      className="input"
                      value={expense.name}
                      onChange={(event) =>
                        update(
                          "expenses",
                          expense.id,
                          "name",
                          event.target.value,
                        )
                      }
                    />{" "}
                  </Field>{" "}
                  <Field label="Amount">
                    {" "}
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="any"
                      value={expense.amount}
                      onChange={(event) =>
                        update(
                          "expenses",
                          expense.id,
                          "amount",
                          event.target.value,
                        )
                      }
                    />{" "}
                  </Field>{" "}
                  <Field label="Frequency">
                    {" "}
                    <FrequencySelect
                      value={expense.frequency}
                      onChange={(value) =>
                        update("expenses", expense.id, "frequency", value)
                      }
                    />{" "}
                  </Field>{" "}
                  <div />{" "}
                </div>{" "}
                <div className="row-footer">
                  {" "}
                  <span> Equivalent: {currency(daily)}/day </span>{" "}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {" "}
                    <label className="toggle">
                      {" "}
                      <input
                        type="checkbox"
                        checked={expense.enabled !== false}
                        onChange={(event) =>
                          update(
                            "expenses",
                            expense.id,
                            "enabled",
                            event.target.checked,
                          )
                        }
                      />{" "}
                      Active{" "}
                    </label>{" "}
                    <button
                      type="button"
                      className="remove"
                      onClick={() => remove("expenses", expense.id)}
                    >
                      {" "}
                      Remove{" "}
                    </button>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            );
          })}{" "}
        </div>
      )}{" "}
      <div className="add-actions">
        {" "}
        <button type="button" className="button primary" onClick={add}>
          {" "}
          Add expense{" "}
        </button>{" "}
      </div>{" "}
    </>
  );
}
function AssetEditor({ assets, update, remove, add }) {
  return (
    <>
      {" "}
      {assets.length === 0 ? (
        <div className="empty"> No assets added yet. </div>
      ) : (
        <div className="list">
          {" "}
          {assets.map((asset) => (
            <div className="row-card" key={asset.id}>
              {" "}
              <div className="row-grid">
                {" "}
                <Field label="Asset name">
                  {" "}
                  <input
                    className="input"
                    value={asset.name}
                    onChange={(event) =>
                      update("assets", asset.id, "name", event.target.value)
                    }
                  />{" "}
                </Field>{" "}
                <Field label="Current value">
                  {" "}
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    value={asset.value}
                    onChange={(event) =>
                      update("assets", asset.id, "value", event.target.value)
                    }
                  />{" "}
                </Field>{" "}
                <div />{" "}
                <div style={{ display: "flex", alignItems: "end" }}>
                  {" "}
                  <button
                    type="button"
                    className="button danger"
                    onClick={() => remove("assets", asset.id)}
                  >
                    {" "}
                    Remove{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
            </div>
          ))}{" "}
        </div>
      )}{" "}
      <div className="add-actions">
        {" "}
        <button type="button" className="button primary" onClick={add}>
          {" "}
          Add asset{" "}
        </button>{" "}
      </div>{" "}
    </>
  );
}
function DebtEditor({ debts, repaymentPower, update, remove, add }) {
  return (
    <>
      {" "}
      {debts.length === 0 ? (
        <div className="empty"> No debts added. </div>
      ) : (
        <div className="debt-list">
          {" "}
          {debts.map((debt) => {
            const balance = safeNumber(debt.balance);
            const payoffDays = calculateDebtPayoffDays(balance, repaymentPower);
            return (
              <div className="row-card" key={debt.id}>
                {" "}
                <div className="row-grid">
                  {" "}
                  <Field label="Debt name">
                    {" "}
                    <input
                      className="input"
                      value={debt.name}
                      onChange={(event) =>
                        update("debts", debt.id, "name", event.target.value)
                      }
                    />{" "}
                  </Field>{" "}
                  <Field label="Balance">
                    {" "}
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="any"
                      value={debt.balance}
                      onChange={(event) =>
                        update("debts", debt.id, "balance", event.target.value)
                      }
                    />{" "}
                  </Field>{" "}
                  <Field label="APR %">
                    {" "}
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="any"
                      value={debt.apr}
                      onChange={(event) =>
                        update("debts", debt.id, "apr", event.target.value)
                      }
                    />{" "}
                  </Field>{" "}
                  <Field label="Minimum / month">
                    {" "}
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="any"
                      value={debt.minimumPayment}
                      onChange={(event) =>
                        update(
                          "debts",
                          debt.id,
                          "minimumPayment",
                          event.target.value,
                        )
                      }
                    />{" "}
                  </Field>{" "}
                </div>{" "}
                <div className="row-footer">
                  {" "}
                  <span>
                    {" "}
                    Payoff at current net rate:{" "}
                    {formatDuration(payoffDays)}{" "}
                  </span>{" "}
                  <button
                    type="button"
                    className="remove"
                    onClick={() => remove("debts", debt.id)}
                  >
                    {" "}
                    Remove{" "}
                  </button>{" "}
                </div>{" "}
              </div>
            );
          })}{" "}
        </div>
      )}{" "}
      <div className="add-actions">
        {" "}
        <button type="button" className="button primary" onClick={add}>
          {" "}
          Add debt{" "}
        </button>{" "}
      </div>{" "}
    </>
  );
}
function Field({ label, children }) {
  return (
    <div className="field">
      {" "}
      <label>{label}</label> {children}{" "}
    </div>
  );
}
function FrequencySelect({ value, onChange }) {
  return (
    <select
      className="select"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {" "}
      <option value="second"> Per second </option>{" "}
      <option value="minute"> Per minute </option>{" "}
      <option value="hour"> Per hour </option>{" "}
      <option value="day"> Per day </option>{" "}
      <option value="week"> Per week </option>{" "}
      <option value="month"> Per month </option>{" "}
      <option value="year"> Per year </option>{" "}
    </select>
  );
}
