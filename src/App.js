import { useState, useRef, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { supabase } from "./supabase";
import { C, FONT, LBL } from "./constants/colors";
import { TABS, DEFAULT_CATEGORIES, DEFAULT_DEBTS } from "./constants/defaults";
import { fmt, pct } from "./utils/format";
import { avalanche, snowball, monthsToPayoff } from "./utils/debt";
import { debounce } from "./utils/debounce";
import { askAdvisor } from "./api/advisor";
import Icon from "./components/Icon";
import SyncBadge from "./components/SyncBadge";
import Page from "./components/Page";
import LoginScreen from "./components/LoginScreen";
import PDFParser from "./components/PDFParser";
import DashboardTab from "./components/tabs/DashboardTab";
import BudgetTab from "./components/tabs/BudgetTab";
import DebtsTab from "./components/tabs/DebtsTab";
import AdvisorTab from "./components/tabs/AdvisorTab";

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({user,onSignOut}){
  const [tab,setTab]               = useState("dashboard");
  const [income,setIncome]         = useState(28000);
  const [incomeId,setIncomeId]     = useState(null);
  const [categories,setCategories] = useState(DEFAULT_CATEGORIES);
  const [debts,setDebts]           = useState(DEFAULT_DEBTS);
  const [debtMethod,setMethod]     = useState("avalanche");
  const [extra,setExtra]           = useState(500);
  const [chat,setChat]             = useState([
    {role:"assistant",content:"Hey! I'm your AI financial advisor. Ask me anything about your budget, debts, or savings goals."}
  ]);
  const [chatInput,setChatInput]   = useState("");
  const [chatLoading,setChatLoading]=useState(false);
  const [dbStatus,setDbStatus]     = useState("loading");
  const [syncStatus,setSyncStatus] = useState("idle");
  const [showPDF,setShowPDF]       = useState(false);

  useEffect(()=>{
    async function load(){
      setDbStatus("loading");
      try{
        const uid=user.id;
        const {data:inc}=await supabase.from("income").select("*").eq("user_id",uid).limit(1).single();
        if(inc){ setIncome(inc.amount); setIncomeId(inc.id); }
        else{ const {data:n}=await supabase.from("income").insert({amount:28000,user_id:uid}).select().single(); if(n){setIncome(n.amount);setIncomeId(n.id);} }
        const {data:cats}=await supabase.from("categories").select("*").eq("user_id",uid).order("id");
        if(cats&&cats.length>0) setCategories(cats);
        else{ const {data:n}=await supabase.from("categories").insert(DEFAULT_CATEGORIES.map(c=>({...c,user_id:uid}))).select(); if(n&&n.length>0)setCategories(n); }
        const {data:dbs}=await supabase.from("debts").select("*").eq("user_id",uid).order("id");
        if(dbs&&dbs.length>0) setDebts(dbs);
        else{ const {data:n}=await supabase.from("debts").insert(DEFAULT_DEBTS.map(d=>({...d,user_id:uid}))).select(); if(n&&n.length>0)setDebts(n); }
        setDbStatus("ready");
      }catch(e){ console.error(e); setDbStatus("error"); }
    }
    load();
  },[user.id]);

  const showSaved=useCallback(()=>{ setSyncStatus("saved"); setTimeout(()=>setSyncStatus("idle"),2000); },[]);
  const saveIncome=useCallback(debounce(async(id,amount)=>{ setSyncStatus("saving"); const {error}=await supabase.from("income").update({amount,updated_at:new Date()}).eq("id",id).eq("user_id",user.id); error?setSyncStatus("error"):showSaved(); },600),[user.id,showSaved]);
  const saveCategory=useCallback(debounce(async(cat)=>{ setSyncStatus("saving"); const {error}=await supabase.from("categories").upsert({...cat,user_id:user.id}); error?setSyncStatus("error"):showSaved(); },600),[user.id,showSaved]);
  const saveDebt=useCallback(debounce(async(debt)=>{ setSyncStatus("saving"); const {error}=await supabase.from("debts").upsert({...debt,user_id:user.id}); error?setSyncStatus("error"):showSaved(); },600),[user.id,showSaved]);

  function updateIncome(val){ setIncome(val); if(incomeId)saveIncome(incomeId,val); }
  function updateCategory(id,field,val){ setCategories(p=>{ const next=p.map(c=>c.id===id?{...c,[field]:val}:c); saveCategory(next.find(c=>c.id===id)); return next; }); }
  function updateDebt(id,field,val){ setDebts(p=>{ const next=p.map(d=>d.id===id?{...d,[field]:val}:d); saveDebt(next.find(d=>d.id===id)); return next; }); }

  // Apply parsed PDF transactions to budget
  function applyPDFTransactions(sums){
    setCategories(prev=>{
      const next=prev.map(cat=>{
        const add=sums[cat.name]||0;
        return add>0 ? {...cat, spent: Math.round((cat.spent+add)*100)/100} : cat;
      });
      // Save each updated category
      next.forEach(cat=>{ if(sums[cat.name]>0) saveCategory({...cat,user_id:user.id}); });
      return next;
    });
  }

  const totalSpent    = categories.reduce((s,c)=>s+c.spent,0);
  const totalDebt     = debts.reduce((s,d)=>s+d.balance,0);
  const surplus       = income-totalSpent;
  const needsBudget   = categories.filter(c=>c.group==="needs").reduce((s,c)=>s+c.budget,0);
  const wantsBudget   = categories.filter(c=>c.group==="wants").reduce((s,c)=>s+c.budget,0);
  const savingsBudget = categories.filter(c=>c.group==="savings").reduce((s,c)=>s+c.budget,0);
  const totalMin      = debts.reduce((s,d)=>s+d.minimum,0);
  const sorted        = debtMethod==="avalanche"?avalanche(debts):snowball(debts);

  function buildCtx(){ return `Income:${fmt(income)} Spent:${fmt(totalSpent)} Surplus:${fmt(surplus)}\nNeeds:${pct(needsBudget,income)}% Wants:${pct(wantsBudget,income)}% Savings:${pct(savingsBudget,income)}%\nOver-budget:${categories.filter(c=>c.spent>c.budget).map(c=>`${c.name}(+${fmt(c.spent-c.budget)})`).join(",")||"none"}\nTotal debt:${fmt(totalDebt)} | ${debts.map(d=>`${d.name} ${fmt(d.balance)} @${d.rate}%`).join("; ")}`; }

  async function send(){ if(!chatInput.trim()||chatLoading)return; const userMsg={role:"user",content:chatInput}; const history=[...chat.filter((_,i)=>i>0),userMsg]; setChat(p=>[...p,userMsg]); setChatInput(""); setChatLoading(true); try{ const reply=await askAdvisor(history.map(m=>({role:m.role,content:m.content})),buildCtx()); setChat(p=>[...p,{role:"assistant",content:reply}]); }catch{ setChat(p=>[...p,{role:"assistant",content:"Connection error. Please try again."}]); } setChatLoading(false); }

  if(dbStatus==="loading") return(
    <div style={{fontFamily:FONT,background:C.bg,minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,color:C.text}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400&family=Syne:wght@800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{width:8,height:8,borderRadius:"50%",background:C.accent,boxShadow:`0 0 12px ${C.accent}`,animation:"pulse 1s infinite"}}/>
      <div style={{color:C.textSub,fontSize:12}}>Loading your data…</div>
    </div>
  );

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;height:3px;}
    ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
    input{font-family:${FONT};}
    .card{background:${C.card};border:1px solid ${C.border};border-radius:12px;padding:16px;}
    .bar-track{height:5px;background:${C.border};border-radius:3px;overflow:hidden;}
    .bar-fill{height:100%;border-radius:3px;transition:width 0.4s ease;}
    .noscroll{scrollbar-width:none;-ms-overflow-style:none;}
    .noscroll::-webkit-scrollbar{display:none;}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
    .typing{animation:pulse 1.2s infinite;}
    @keyframes up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    .up{animation:up 0.2s ease forwards;}
    .sidebar{display:flex;flex-direction:column;gap:4px;width:220px;flex-shrink:0;}
    .sidebar-btn{display:flex;align-items:center;gap:10px;background:none;border:none;cursor:pointer;padding:11px 14px;border-radius:10px;color:${C.muted};font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;transition:all 0.2s;text-align:left;width:100%;}
    .sidebar-btn:hover{background:${C.accentDim};color:${C.accent};}
    .sidebar-btn.active{background:${C.accentDim};color:${C.accent};border:1px solid ${C.accentMid};}
    .bottom-nav{display:none;background:${C.surface};border-top:1px solid ${C.border};padding:8px 4px 12px;height:64px;}
    .nav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;cursor:pointer;padding:8px 0;color:${C.muted};font-family:'Syne',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;flex:1;border-radius:10px;transition:color 0.2s;}
    .nav-btn.active{color:${C.accent};}
    .method-btn{flex:1;background:${C.surface};border:1px solid ${C.border};color:${C.textSub};border-radius:8px;padding:9px 0;cursor:pointer;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;transition:all 0.2s;}
    .method-btn.active{background:${C.accentDim};border-color:${C.accentMid};color:${C.accent};}
    .send-btn{background:${C.accent};color:${C.bg};border:none;border-radius:10px;width:46px;height:46px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity 0.2s;}
    .send-btn:disabled{opacity:0.35;cursor:not-allowed;}
    .chip{background:${C.surface};border:1px solid ${C.border};color:${C.textSub};border-radius:20px;padding:6px 14px;cursor:pointer;font-size:11px;font-family:${FONT};white-space:nowrap;flex-shrink:0;transition:all 0.15s;}
    .chip:hover,.chip:active{border-color:${C.accentMid};color:${C.accent};}
    .upload-btn{display:flex;align-items:center;gap:8px;background:${C.accentDim};border:1px solid ${C.accentMid};color:${C.accent};border-radius:10px;padding:9px 16px;cursor:pointer;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;transition:all 0.2s;}
    .upload-btn:hover{background:${C.accent};color:${C.bg};}
    .signout-btn{display:flex;align-items:center;gap:7px;background:none;border:1px solid ${C.border};color:${C.muted};border-radius:8px;padding:7px 12px;cursor:pointer;font-family:'Syne',sans-serif;font-weight:700;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;transition:all 0.2s;}
    .signout-btn:hover{border-color:${C.warn};color:${C.warn};}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
    .split-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .debt-inputs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
    .cat-inputs{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .debt-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
    .advisor-layout{display:grid;grid-template-columns:1fr 280px;gap:16px;height:calc(100dvh - 100px);}
    @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}.split-grid{grid-template-columns:1fr;}.advisor-layout{grid-template-columns:1fr;}.advisor-sidebar{display:none;}}
    @media(max-width:600px){.sidebar{display:none;}.bottom-nav{display:flex;}.kpi-grid{grid-template-columns:repeat(2,1fr);gap:10px;}.card{padding:14px;}.desktop-tabs{display:none;}}
  `;


  return(
    <div style={{fontFamily:FONT,background:C.bg,minHeight:"100dvh",color:C.text,display:"flex",flexDirection:"column"}}>
      <style>{css}</style>
      {showPDF&&<PDFParser onApply={applyPDFTransactions} onClose={()=>setShowPDF(false)}/>}

      {/* Top bar */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 20px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:C.accent,boxShadow:`0 0 8px ${C.accent}`}}/>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,letterSpacing:"0.05em"}}>RAND<span style={{color:C.accent}}>WISE</span></span>
        </div>
        <div className="desktop-tabs" style={{display:"flex",gap:4}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?C.accentDim:"none",border:tab===t?`1px solid ${C.accentMid}`:"1px solid transparent",color:tab===t?C.accent:C.muted,borderRadius:8,padding:"7px 16px",cursor:"pointer",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",transition:"all 0.2s"}}>{t}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <SyncBadge status={syncStatus}/>
          <button className="signout-btn" onClick={onSignOut}><Icon name="logout" size={13}/>Sign out</button>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* Sidebar */}
        <div className="sidebar" style={{background:C.surface,borderRight:`1px solid ${C.border}`,padding:"20px 12px",display:"flex",flexDirection:"column"}}>
          <div style={{fontSize:10,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:14,paddingLeft:14}}>Navigation</div>
          {TABS.map(t=>(<button key={t} className={`sidebar-btn ${tab===t?"active":""}`} onClick={()=>setTab(t)}><Icon name={t} size={16}/>{t}</button>))}
          <div style={{marginTop:"auto",paddingTop:20,borderTop:`1px solid ${C.border}`}}>
            <div style={{padding:"10px 14px"}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Snapshot</div>
              {[
                {label:"Income", value:fmt(income),            color:C.accent},
                {label:"Spent",  value:fmt(totalSpent),        color:totalSpent>income?C.warn:C.textSub},
                {label:"Debt",   value:fmt(totalDebt),         color:C.warn},
                {label:"Surplus",value:fmt(Math.abs(surplus)), color:surplus>=0?C.accent:C.warn},
              ].map(r=>(<div key={r.label} style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:7}}><span style={{color:C.textSub}}>{r.label}</span><span style={{color:r.color,fontWeight:500}}>{r.value}</span></div>))}
              <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:6,fontSize:10}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:C.accent,flexShrink:0}}/>
                <span style={{color:C.muted}}>Supabase connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{flex:1,overflowY:tab==="advisor"?"hidden":"auto",display:"flex",flexDirection:"column"}}>

          {tab==="dashboard"&&<DashboardTab income={income} totalSpent={totalSpent} surplus={surplus} totalDebt={totalDebt} needsBudget={needsBudget} wantsBudget={wantsBudget} savingsBudget={savingsBudget} categories={categories} debts={debts}/>}
          {tab==="budget"&&<BudgetTab income={income} categories={categories} updateIncome={updateIncome} updateCategory={updateCategory} onOpenPDF={()=>setShowPDF(true)}/>}
          {tab==="debts"&&<DebtsTab debts={debts} debtMethod={debtMethod} extra={extra} sorted={sorted} totalDebt={totalDebt} totalMin={totalMin} setDebtMethod={setMethod} setExtra={setExtra} updateDebt={updateDebt}/>}
          {tab==="advisor"&&<AdvisorTab income={income} totalSpent={totalSpent} surplus={surplus} totalDebt={totalDebt} needsBudget={needsBudget} wantsBudget={wantsBudget} savingsBudget={savingsBudget} chat={chat} chatInput={chatInput} chatLoading={chatLoading} setChatInput={setChatInput} send={send}/>}
        </div>
      </div>

      <div className="bottom-nav">
        {TABS.map(t=>(<button key={t} className={`nav-btn ${tab===t?"active":""}`} onClick={()=>setTab(t)}><Icon name={t} size={20}/>{t}</button>))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [session,setSession]=useState(undefined);
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>setSession(session));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setSession(session));
    return()=>subscription.unsubscribe();
  },[]);
  async function signOut(){ await supabase.auth.signOut(); setSession(null); }
  if(session===undefined) return(
    <div style={{fontFamily:FONT,background:C.bg,minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,color:C.text}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400&family=Syne:wght@800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{width:8,height:8,borderRadius:"50%",background:C.accent,boxShadow:`0 0 12px ${C.accent}`,animation:"pulse 1s infinite"}}/>
      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,letterSpacing:"0.05em"}}>RAND<span style={{color:C.accent}}>WISE</span></div>
      <div style={{color:C.textSub,fontSize:12}}>Loading…</div>
    </div>
  );
  if(!session) return <LoginScreen/>;
  return <Dashboard user={session.user} onSignOut={signOut}/>;
}