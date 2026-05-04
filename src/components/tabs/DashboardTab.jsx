import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { C, LBL } from "../../constants/colors";
import { fmt, pct } from "../../utils/format";
import Page from "../Page";

function DashboardTab({ income, totalSpent, surplus, totalDebt, needsBudget, wantsBudget, savingsBudget, categories, debts }) {
  return (
    <Page>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26}}>Financial Overview</h1>
          <p style={{color:C.textSub,fontSize:12,marginTop:3}}>May 2026 · Cape Town</p>
        </div>
      </div>
      <div className="kpi-grid">
        {[
          {label:"Monthly Income",value:fmt(income),           color:C.accent,                        sub:"after tax"},
          {label:"Total Spent",   value:fmt(totalSpent),       color:totalSpent>income?C.warn:C.text,  sub:`${pct(totalSpent,income)}% of income`},
          {label:surplus>=0?"Surplus":"Deficit",value:fmt(Math.abs(surplus)),color:surplus>=0?C.accent:C.warn,sub:surplus>=0?"left over":"overspent"},
          {label:"Total Debt",   value:fmt(totalDebt),         color:C.warn,                           sub:`${debts.length} accounts`},
        ].map(k=>(<div key={k.label} className="card up"><div style={LBL}>{k.label}</div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:k.color}}>{k.value}</div><div style={{fontSize:11,color:C.textSub,marginTop:4}}>{k.sub}</div></div>))}
      </div>
      <div className="split-grid">
        <div className="card">
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,letterSpacing:"0.06em",marginBottom:16}}>50 / 30 / 20 SPLIT</div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <ResponsiveContainer width={130} height={130}><PieChart><Pie data={[{value:needsBudget},{value:wantsBudget},{value:savingsBudget}]} cx={60} cy={60} innerRadius={36} outerRadius={58} dataKey="value" strokeWidth={0}><Cell fill="#00E5A0"/><Cell fill="#7B61FF"/><Cell fill="#00C9FF"/></Pie></PieChart></ResponsiveContainer>
            <div style={{flex:1}}>
              {[{label:"Needs",value:needsBudget,target:income*0.5,color:"#00E5A0"},{label:"Wants",value:wantsBudget,target:income*0.3,color:"#7B61FF"},{label:"Savings",value:savingsBudget,target:income*0.2,color:"#00C9FF"}].map(r=>(<div key={r.label} style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:r.color}}>{r.label}</span><span style={{color:C.textSub}}>{pct(r.value,income)}%<span style={{color:C.muted}}> / {pct(r.target,income)}%</span></span></div><div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(pct(r.value,income)/pct(r.target,income)*100,100)}%`,background:r.color}}/></div></div>))}
            </div>
          </div>
        </div>
        <div className="card">
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,letterSpacing:"0.06em",marginBottom:14}}>BUDGET VS ACTUAL</div>
          <ResponsiveContainer width="100%" height={150}><BarChart data={categories.slice(0,6)} barSize={9} barCategoryGap="30%"><XAxis dataKey="name" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v.split(" ")[0]}/><YAxis hide/><Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/><Bar dataKey="budget" fill={C.border} radius={[3,3,0,0]} name="Budget"/><Bar dataKey="spent" radius={[3,3,0,0]} name="Spent">{categories.slice(0,6).map(c=><Cell key={c.id} fill={c.spent>c.budget?C.warn:C.accent}/>)}</Bar></BarChart></ResponsiveContainer>
        </div>
      </div>
      {categories.filter(c=>c.spent>c.budget).length>0&&(
        <div className="card" style={{borderColor:C.warn+"50"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:C.warn,letterSpacing:"0.06em",marginBottom:12}}>⚡ OVERSPEND ALERTS</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
            {categories.filter(c=>c.spent>c.budget).map(c=>(<div key={c.id} style={{background:C.warnDim,border:`1px solid ${C.warn}40`,borderRadius:8,padding:"9px 14px",display:"flex",justifyContent:"space-between",fontSize:12}}><span>{c.name}</span><span style={{color:C.warn}}>+{fmt(c.spent-c.budget)}</span></div>))}
          </div>
        </div>
      )}
    </Page>
  );
}

export default DashboardTab;
