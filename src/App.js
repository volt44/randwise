import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(
  "https://kfmywziuxomnsomdfmop.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbXl3eml1eG9tbnNvbWRmbW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MTQyODcsImV4cCI6MjA5MzM5MDI4N30.hH_vrWLeTGxXfhOIwn5rlNuR24bBoYv0zjaSvT5ZMyk"
);

const ALLOWED_EMAIL = "johanellis10@gmail.com";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#0D0F14", surface:"#13161D", card:"#181C26", border:"#252A38",
  accent:"#00E5A0", accentDim:"#00E5A018", accentMid:"#00E5A055",
  warn:"#FF6B4A", warnDim:"#FF6B4A18", muted:"#4A5168",
  text:"#E8EAF0", textSub:"#8B92A8",
};
const FONT = "'DM Mono', monospace";

// ── Fallback data ─────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id:1,  name:"Housing",         budget:9000, spent:9000, color:"#00E5A0", group:"needs"   },
  { id:2,  name:"Food & Groceries",budget:3500, spent:4100, color:"#00C9FF", group:"needs"   },
  { id:3,  name:"Transport",       budget:2000, spent:1750, color:"#7B61FF", group:"needs"   },
  { id:4,  name:"Medical Aid",     budget:1800, spent:1800, color:"#FF6B4A", group:"needs"   },
  { id:5,  name:"Utilities",       budget:1200, spent:980,  color:"#FFB800", group:"needs"   },
  { id:6,  name:"Entertainment",   budget:1500, spent:2100, color:"#FF4A8D", group:"wants"   },
  { id:7,  name:"Clothing",        budget:800,  spent:450,  color:"#A8FF78", group:"wants"   },
  { id:8,  name:"Subscriptions",   budget:600,  spent:890,  color:"#FF9A3C", group:"wants"   },
  { id:9,  name:"Emergency Fund",  budget:2000, spent:2000, color:"#00E5A0", group:"savings" },
  { id:10, name:"TFSA",            budget:3000, spent:1500, color:"#00C9FF", group:"savings" },
];
const DEFAULT_DEBTS = [
  { id:1, name:"Credit Card",        balance:12500, rate:21.5, minimum:375  },
  { id:2, name:"Woolworths Account", balance:3200,  rate:24.0, minimum:160  },
  { id:3, name:"Personal Loan",      balance:45000, rate:17.5, minimum:1200 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => `R ${Number(n).toLocaleString("en-ZA",{minimumFractionDigits:0})}`;
const pct = (a,b) => b===0 ? 0 : Math.round((a/b)*100);
const avalanche = (d) => [...d].sort((a,b)=>b.rate-a.rate);
const snowball  = (d) => [...d].sort((a,b)=>a.balance-b.balance);
function monthsToPayoff(bal,rate,pay){
  if(pay<=0||bal<=0) return Infinity;
  const m=rate/100/12;
  if(m===0) return Math.ceil(bal/pay);
  const n=-Math.log(1-(m*bal)/pay)/Math.log(1+m);
  return isFinite(n)?Math.ceil(n):Infinity;
}
function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }

// ── Claude API ────────────────────────────────────────────────────────────────
async function askAdvisor(messages,ctx){
  const system=`You are a sharp, friendly personal financial advisor for a user in Cape Town, South Africa.
Speak in ZAR. Know SA products: TFSA (R36k limit), RAs, Capitec, TymeBank, Allan Gray, Easy Equities.
Keep responses concise (3-5 sentences unless asked for detail). Be direct and practical.
Current snapshot:\n${ctx}`;
  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system,messages}),
  });
  const data=await res.json();
  return data.content?.map(b=>b.text||"").join("")||"No response.";
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon=({name,size=20})=>{
  const p={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"};
  if(name==="dashboard") return <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
  if(name==="budget")    return <svg {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
  if(name==="debts")     return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
  if(name==="advisor")   return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  if(name==="check")     return <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>;
  if(name==="sync")      return <svg {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
  if(name==="logout")    return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
  if(name==="mail")      return <svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
  return null;
};

const TABS=["dashboard","budget","debts","advisor"];

const SyncBadge=({status})=>{
  const map={idle:{color:C.muted,icon:"sync",label:"Saved"},saving:{color:C.accent,icon:"sync",label:"Saving…"},saved:{color:C.accent,icon:"check",label:"Saved"},error:{color:C.warn,icon:"sync",label:"Error"}};
  const s=map[status]||map.idle;
  return(
    <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:s.color,opacity:status==="idle"?0:1,transition:"opacity 0.4s"}}>
      <Icon name={s.icon} size={12}/>{s.label}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function LoginScreen(){
  const [step,setStep]     = useState("enter"); // enter | sent | error
  const [email,setEmail]   = useState("");
  const [loading,setLoading]= useState(false);
  const [errMsg,setErrMsg] = useState("");

  async function sendMagicLink(){
    const trimmed = email.trim().toLowerCase();
    if(trimmed !== ALLOWED_EMAIL){
      setErrMsg("This app is private. Only the registered account can sign in.");
      setStep("error"); return;
    }
    setLoading(true);
    const {error}=await supabase.auth.signInWithOtp({
      email: trimmed,
      options:{ emailRedirectTo: window.location.origin }
    });
    setLoading(false);
    if(error){ setErrMsg(error.message); setStep("error"); }
    else setStep("sent");
  }

  return(
    <div style={{fontFamily:FONT,background:C.bg,minHeight:"100dvh",color:C.text,
      display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        input{font-family:${FONT};}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .login-card{animation:up 0.3s ease forwards;}
        .login-input:focus{outline:none;border-color:${C.accentMid}!important;}
      `}</style>

      <div className="login-card" style={{width:"100%",maxWidth:400}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:C.accent,
            boxShadow:`0 0 20px ${C.accent}`,margin:"0 auto 14px"}}/>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:28,letterSpacing:"0.05em"}}>
            RAND<span style={{color:C.accent}}>WISE</span>
          </div>
          <div style={{color:C.textSub,fontSize:12,marginTop:6}}>Your personal finance dashboard</div>
        </div>

        {/* Card */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:32}}>

          {step==="enter"&&(
            <>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,marginBottom:6}}>Sign in</div>
              <div style={{color:C.textSub,fontSize:12,marginBottom:24,lineHeight:1.6}}>
                Enter your email and we'll send you a magic link — no password needed.
              </div>
              <div style={{fontSize:10,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Email</div>
              <input
                className="login-input"
                type="email" value={email}
                onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendMagicLink()}
                placeholder="you@example.com"
                style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,
                  color:C.text,borderRadius:8,padding:"12px 14px",fontSize:14,
                  fontFamily:FONT,marginBottom:16,transition:"border-color 0.2s"}}
              />
              <button onClick={sendMagicLink} disabled={loading||!email.trim()}
                style={{width:"100%",background:C.accent,color:C.bg,border:"none",
                  borderRadius:10,padding:"13px 0",cursor:"pointer",
                  fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,
                  letterSpacing:"0.06em",opacity:loading||!email.trim()?0.4:1,
                  transition:"opacity 0.2s"}}>
                {loading?"Sending…":"Send Magic Link"}
              </button>
            </>
          )}

          {step==="sent"&&(
            <div style={{textAlign:"center"}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:C.accentDim,
                border:`1px solid ${C.accentMid}`,display:"flex",alignItems:"center",
                justifyContent:"center",margin:"0 auto 16px"}}>
                <Icon name="mail" size={22}/>
              </div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,marginBottom:10,color:C.accent}}>
                Check your inbox
              </div>
              <div style={{color:C.textSub,fontSize:13,lineHeight:1.7}}>
                We sent a magic link to<br/>
                <span style={{color:C.text,fontWeight:500}}>{email}</span><br/>
                Click it to sign in. You can close this tab.
              </div>
              <button onClick={()=>{setStep("enter");setEmail("");}}
                style={{marginTop:24,background:"none",border:`1px solid ${C.border}`,
                  color:C.textSub,borderRadius:8,padding:"9px 20px",cursor:"pointer",
                  fontFamily:FONT,fontSize:12}}>
                Use a different email
              </button>
            </div>
          )}

          {step==="error"&&(
            <div style={{textAlign:"center"}}>
              <div style={{color:C.warn,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,marginBottom:10}}>
                Sign in failed
              </div>
              <div style={{color:C.textSub,fontSize:13,lineHeight:1.7,marginBottom:20}}>{errMsg}</div>
              <button onClick={()=>{setStep("enter");setErrMsg("");}}
                style={{background:C.accentDim,border:`1px solid ${C.accentMid}`,color:C.accent,
                  borderRadius:8,padding:"9px 20px",cursor:"pointer",fontFamily:FONT,fontSize:12}}>
                Try again
              </button>
            </div>
          )}
        </div>

        <div style={{textAlign:"center",marginTop:20,fontSize:11,color:C.muted}}>
          Secured by Supabase Auth · Cape Town, ZAR
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
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
  const chatEnd=useRef(null);

  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[chat]);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(()=>{
    async function load(){
      setDbStatus("loading");
      try{
        const uid=user.id;

        // Income
        const {data:inc}=await supabase.from("income").select("*").eq("user_id",uid).limit(1).single();
        if(inc){ setIncome(inc.amount); setIncomeId(inc.id); }
        else{
          const {data:newInc}=await supabase.from("income").insert({amount:28000,user_id:uid}).select().single();
          if(newInc){ setIncome(newInc.amount); setIncomeId(newInc.id); }
        }

        // Categories
        const {data:cats}=await supabase.from("categories").select("*").eq("user_id",uid).order("id");
        if(cats&&cats.length>0) setCategories(cats);
        else{
          const seeded=DEFAULT_CATEGORIES.map(c=>({...c,user_id:uid}));
          const {data:newCats}=await supabase.from("categories").insert(seeded).select();
          if(newCats&&newCats.length>0) setCategories(newCats);
        }

        // Debts
        const {data:dbs}=await supabase.from("debts").select("*").eq("user_id",uid).order("id");
        if(dbs&&dbs.length>0) setDebts(dbs);
        else{
          const seeded=DEFAULT_DEBTS.map(d=>({...d,user_id:uid}));
          const {data:newDebts}=await supabase.from("debts").insert(seeded).select();
          if(newDebts&&newDebts.length>0) setDebts(newDebts);
        }

        setDbStatus("ready");
      }catch(e){ console.error(e); setDbStatus("error"); }
    }
    load();
  },[user.id]);

  // ── Sync ──────────────────────────────────────────────────────────────────
  const showSaved=useCallback(()=>{ setSyncStatus("saved"); setTimeout(()=>setSyncStatus("idle"),2000); },[]);

  const saveIncome=useCallback(debounce(async(id,amount)=>{
    setSyncStatus("saving");
    const {error}=await supabase.from("income").update({amount,updated_at:new Date()}).eq("id",id).eq("user_id",user.id);
    error?setSyncStatus("error"):showSaved();
  },600),[user.id,showSaved]);

  const saveCategory=useCallback(debounce(async(cat)=>{
    setSyncStatus("saving");
    const {error}=await supabase.from("categories").upsert({...cat,user_id:user.id});
    error?setSyncStatus("error"):showSaved();
  },600),[user.id,showSaved]);

  const saveDebt=useCallback(debounce(async(debt)=>{
    setSyncStatus("saving");
    const {error}=await supabase.from("debts").upsert({...debt,user_id:user.id});
    error?setSyncStatus("error"):showSaved();
  },600),[user.id,showSaved]);

  function updateIncome(val){ setIncome(val); if(incomeId) saveIncome(incomeId,val); }
  function updateCategory(id,field,val){
    setCategories(p=>{ const next=p.map(c=>c.id===id?{...c,[field]:val}:c); saveCategory(next.find(c=>c.id===id)); return next; });
  }
  function updateDebt(id,field,val){
    setDebts(p=>{ const next=p.map(d=>d.id===id?{...d,[field]:val}:d); saveDebt(next.find(d=>d.id===id)); return next; });
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalSpent    = categories.reduce((s,c)=>s+c.spent,0);
  const totalDebt     = debts.reduce((s,d)=>s+d.balance,0);
  const surplus       = income-totalSpent;
  const needsBudget   = categories.filter(c=>c.group==="needs").reduce((s,c)=>s+c.budget,0);
  const wantsBudget   = categories.filter(c=>c.group==="wants").reduce((s,c)=>s+c.budget,0);
  const savingsBudget = categories.filter(c=>c.group==="savings").reduce((s,c)=>s+c.budget,0);
  const totalMin      = debts.reduce((s,d)=>s+d.minimum,0);
  const sorted        = debtMethod==="avalanche"?avalanche(debts):snowball(debts);

  function buildCtx(){
    return `Income:${fmt(income)} Spent:${fmt(totalSpent)} Surplus:${fmt(surplus)}
Needs:${pct(needsBudget,income)}% Wants:${pct(wantsBudget,income)}% Savings:${pct(savingsBudget,income)}%
Over-budget:${categories.filter(c=>c.spent>c.budget).map(c=>`${c.name}(+${fmt(c.spent-c.budget)})`).join(",")||"none"}
Total debt:${fmt(totalDebt)} | ${debts.map(d=>`${d.name} ${fmt(d.balance)} @${d.rate}%`).join("; ")}`;
  }

  async function send(){
    if(!chatInput.trim()||chatLoading) return;
    const userMsg={role:"user",content:chatInput};
    const history=[...chat.filter((_,i)=>i>0),userMsg];
    setChat(p=>[...p,userMsg]); setChatInput(""); setChatLoading(true);
    try{
      const reply=await askAdvisor(history.map(m=>({role:m.role,content:m.content})),buildCtx());
      setChat(p=>[...p,{role:"assistant",content:reply}]);
    }catch{ setChat(p=>[...p,{role:"assistant",content:"Connection error. Please try again."}]); }
    setChatLoading(false);
  }

  const LBL={fontSize:10,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4};

  if(dbStatus==="loading") return(
    <div style={{fontFamily:FONT,background:C.bg,minHeight:"100dvh",display:"flex",
      alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,color:C.text}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:C.accent,
        boxShadow:`0 0 12px ${C.accent}`,animation:"pulse 1s infinite"}}/>
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
    .sidebar-btn{display:flex;align-items:center;gap:10px;background:none;border:none;cursor:pointer;
      padding:11px 14px;border-radius:10px;color:${C.muted};font-family:'Syne',sans-serif;
      font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
      transition:all 0.2s;text-align:left;width:100%;}
    .sidebar-btn:hover{background:${C.accentDim};color:${C.accent};}
    .sidebar-btn.active{background:${C.accentDim};color:${C.accent};border:1px solid ${C.accentMid};}
    .bottom-nav{display:none;background:${C.surface};border-top:1px solid ${C.border};padding:8px 4px 12px;height:64px;}
    .nav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;
      cursor:pointer;padding:8px 0;color:${C.muted};font-family:'Syne',sans-serif;font-size:9px;
      font-weight:700;letter-spacing:0.08em;text-transform:uppercase;flex:1;border-radius:10px;transition:color 0.2s;}
    .nav-btn.active{color:${C.accent};}
    .method-btn{flex:1;background:${C.surface};border:1px solid ${C.border};color:${C.textSub};
      border-radius:8px;padding:9px 0;cursor:pointer;font-family:'Syne',sans-serif;font-weight:700;
      font-size:11px;letter-spacing:0.08em;text-transform:uppercase;transition:all 0.2s;}
    .method-btn.active{background:${C.accentDim};border-color:${C.accentMid};color:${C.accent};}
    .send-btn{background:${C.accent};color:${C.bg};border:none;border-radius:10px;width:46px;height:46px;
      cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;
      flex-shrink:0;transition:opacity 0.2s;}
    .send-btn:disabled{opacity:0.35;cursor:not-allowed;}
    .chip{background:${C.surface};border:1px solid ${C.border};color:${C.textSub};border-radius:20px;
      padding:6px 14px;cursor:pointer;font-size:11px;font-family:${FONT};white-space:nowrap;
      flex-shrink:0;transition:all 0.15s;}
    .chip:hover,.chip:active{border-color:${C.accentMid};color:${C.accent};}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
    .split-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
    .debt-inputs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;}
    .cat-inputs{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .debt-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
    .advisor-layout{display:grid;grid-template-columns:1fr 280px;gap:16px;height:calc(100dvh - 100px);}
    .signout-btn{display:flex;align-items:center;gap:7px;background:none;border:1px solid ${C.border};
      color:${C.muted};border-radius:8px;padding:7px 12px;cursor:pointer;font-family:'Syne',sans-serif;
      font-weight:700;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;transition:all 0.2s;}
    .signout-btn:hover{border-color:${C.warn};color:${C.warn};}
    @media(max-width:900px){
      .kpi-grid{grid-template-columns:repeat(2,1fr);}
      .split-grid{grid-template-columns:1fr;}
      .advisor-layout{grid-template-columns:1fr;}
      .advisor-sidebar{display:none;}
    }
    @media(max-width:600px){
      .sidebar{display:none;}
      .bottom-nav{display:flex;}
      .kpi-grid{grid-template-columns:repeat(2,1fr);gap:10px;}
      .card{padding:14px;}
      .desktop-tabs{display:none;}
      .user-email{display:none;}
    }
  `;

  const Page=({children})=>(
    <div style={{padding:"22px 20px",display:"flex",flexDirection:"column",gap:16,maxWidth:1100,width:"100%"}}>
      {children}
    </div>
  );

  return(
    <div style={{fontFamily:FONT,background:C.bg,minHeight:"100dvh",color:C.text,display:"flex",flexDirection:"column"}}>
      <style>{css}</style>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 20px",
        height:54,display:"flex",alignItems:"center",justifyContent:"space-between",
        flexShrink:0,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:C.accent,boxShadow:`0 0 8px ${C.accent}`}}/>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,letterSpacing:"0.05em"}}>
            RAND<span style={{color:C.accent}}>WISE</span>
          </span>
        </div>
        <div className="desktop-tabs" style={{display:"flex",gap:4}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              background:tab===t?C.accentDim:"none",
              border:tab===t?`1px solid ${C.accentMid}`:"1px solid transparent",
              color:tab===t?C.accent:C.muted,borderRadius:8,padding:"7px 16px",cursor:"pointer",
              fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,
              letterSpacing:"0.08em",textTransform:"uppercase",transition:"all 0.2s",
            }}>{t}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <SyncBadge status={syncStatus}/>
          <span className="user-email" style={{fontSize:10,color:C.muted}}>{user.email}</span>
          <button className="signout-btn" onClick={onSignOut}>
            <Icon name="logout" size={13}/>Sign out
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* Sidebar */}
        <div className="sidebar" style={{background:C.surface,borderRight:`1px solid ${C.border}`,
          padding:"20px 12px",display:"flex",flexDirection:"column"}}>
          <div style={{fontSize:10,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",
            marginBottom:14,paddingLeft:14}}>Navigation</div>
          {TABS.map(t=>(
            <button key={t} className={`sidebar-btn ${tab===t?"active":""}`} onClick={()=>setTab(t)}>
              <Icon name={t} size={16}/>{t}
            </button>
          ))}
          <div style={{marginTop:"auto",paddingTop:20,borderTop:`1px solid ${C.border}`}}>
            <div style={{padding:"10px 14px"}}>
              <div style={{fontSize:10,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Snapshot</div>
              {[
                {label:"Income", value:fmt(income),            color:C.accent},
                {label:"Spent",  value:fmt(totalSpent),        color:totalSpent>income?C.warn:C.textSub},
                {label:"Debt",   value:fmt(totalDebt),         color:C.warn},
                {label:"Surplus",value:fmt(Math.abs(surplus)), color:surplus>=0?C.accent:C.warn},
              ].map(r=>(
                <div key={r.label} style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:7}}>
                  <span style={{color:C.textSub}}>{r.label}</span>
                  <span style={{color:r.color,fontWeight:500}}>{r.value}</span>
                </div>
              ))}
              <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${C.border}`,
                display:"flex",alignItems:"center",gap:6,fontSize:10}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:C.accent,flexShrink:0}}/>
                <span style={{color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{flex:1,overflowY:tab==="advisor"?"hidden":"auto",display:"flex",flexDirection:"column"}}>

          {/* ════ DASHBOARD ════ */}
          {tab==="dashboard"&&(
            <Page>
              <div>
                <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26}}>Financial Overview</h1>
                <p style={{color:C.textSub,fontSize:12,marginTop:3}}>May 2026 · Cape Town</p>
              </div>
              <div className="kpi-grid">
                {[
                  {label:"Monthly Income",value:fmt(income),           color:C.accent,                       sub:"after tax"},
                  {label:"Total Spent",   value:fmt(totalSpent),       color:totalSpent>income?C.warn:C.text, sub:`${pct(totalSpent,income)}% of income`},
                  {label:surplus>=0?"Surplus":"Deficit",value:fmt(Math.abs(surplus)),color:surplus>=0?C.accent:C.warn,sub:surplus>=0?"left over":"overspent"},
                  {label:"Total Debt",   value:fmt(totalDebt),         color:C.warn,                         sub:`${debts.length} accounts`},
                ].map(k=>(
                  <div key={k.label} className="card up">
                    <div style={LBL}>{k.label}</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:k.color}}>{k.value}</div>
                    <div style={{fontSize:11,color:C.textSub,marginTop:4}}>{k.sub}</div>
                  </div>
                ))}
              </div>
              <div className="split-grid">
                <div className="card">
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,letterSpacing:"0.06em",marginBottom:16}}>50 / 30 / 20 SPLIT</div>
                  <div style={{display:"flex",alignItems:"center",gap:16}}>
                    <ResponsiveContainer width={130} height={130}>
                      <PieChart>
                        <Pie data={[{value:needsBudget},{value:wantsBudget},{value:savingsBudget}]}
                          cx={60} cy={60} innerRadius={36} outerRadius={58} dataKey="value" strokeWidth={0}>
                          <Cell fill="#00E5A0"/><Cell fill="#7B61FF"/><Cell fill="#00C9FF"/>
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{flex:1}}>
                      {[
                        {label:"Needs",  value:needsBudget,  target:income*0.5,color:"#00E5A0"},
                        {label:"Wants",  value:wantsBudget,  target:income*0.3,color:"#7B61FF"},
                        {label:"Savings",value:savingsBudget,target:income*0.2,color:"#00C9FF"},
                      ].map(r=>(
                        <div key={r.label} style={{marginBottom:12}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                            <span style={{color:r.color}}>{r.label}</span>
                            <span style={{color:C.textSub}}>{pct(r.value,income)}%<span style={{color:C.muted}}> / {pct(r.target,income)}%</span></span>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{width:`${Math.min(pct(r.value,income)/pct(r.target,income)*100,100)}%`,background:r.color}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,letterSpacing:"0.06em",marginBottom:14}}>BUDGET VS ACTUAL</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={categories.slice(0,6)} barSize={9} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v.split(" ")[0]}/>
                      <YAxis hide/>
                      <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}} formatter={v=>fmt(v)}/>
                      <Bar dataKey="budget" fill={C.border} radius={[3,3,0,0]} name="Budget"/>
                      <Bar dataKey="spent" radius={[3,3,0,0]} name="Spent">
                        {categories.slice(0,6).map(c=><Cell key={c.id} fill={c.spent>c.budget?C.warn:C.accent}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {categories.filter(c=>c.spent>c.budget).length>0&&(
                <div className="card" style={{borderColor:C.warn+"50"}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:C.warn,letterSpacing:"0.06em",marginBottom:12}}>⚡ OVERSPEND ALERTS</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
                    {categories.filter(c=>c.spent>c.budget).map(c=>(
                      <div key={c.id} style={{background:C.warnDim,border:`1px solid ${C.warn}40`,borderRadius:8,
                        padding:"9px 14px",display:"flex",justifyContent:"space-between",fontSize:12}}>
                        <span>{c.name}</span><span style={{color:C.warn}}>+{fmt(c.spent-c.budget)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Page>
          )}

          {/* ════ BUDGET ════ */}
          {tab==="budget"&&(
            <Page>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div>
                  <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26}}>Budget Tracker</h1>
                  <p style={{color:C.textSub,fontSize:12,marginTop:3}}>Changes save automatically</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:12,color:C.textSub}}>Monthly income</span>
                  <input type="number" value={income} onChange={e=>updateIncome(Number(e.target.value))}
                    style={{background:C.card,border:`1px solid ${C.border}`,color:C.accent,
                      borderRadius:8,padding:"8px 12px",width:120,fontSize:15,fontFamily:FONT,fontWeight:500,textAlign:"right"}}/>
                </div>
              </div>
              {["needs","wants","savings"].map(group=>(
                <div key={group}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:C.muted,
                    letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10,paddingLeft:2}}>
                    {group} · {fmt(categories.filter(c=>c.group===group).reduce((s,c)=>s+c.budget,0))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
                    {categories.filter(c=>c.group===group).map(cat=>{
                      const over=cat.spent>cat.budget;
                      return(
                        <div key={cat.id} className="card" style={{padding:"13px 15px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                            <div style={{width:7,height:7,borderRadius:"50%",background:cat.color,flexShrink:0}}/>
                            <span style={{fontSize:13,flex:1}}>{cat.name}</span>
                            <span style={{fontSize:12,color:over?C.warn:C.accent,fontWeight:500}}>{pct(cat.spent,cat.budget)}%</span>
                          </div>
                          <div className="bar-track" style={{marginBottom:10}}>
                            <div className="bar-fill" style={{width:`${Math.min(pct(cat.spent,cat.budget),100)}%`,background:over?C.warn:cat.color}}/>
                          </div>
                          <div className="cat-inputs">
                            {[{l:"Budget",k:"budget",v:cat.budget,w:false},{l:"Spent",k:"spent",v:cat.spent,w:over}].map(({l,k,v,w})=>(
                              <div key={k}>
                                <div style={LBL}>{l}</div>
                                <input type="number" value={v}
                                  onChange={e=>updateCategory(cat.id,k,Number(e.target.value))}
                                  style={{background:C.surface,border:`1px solid ${w?C.warn:C.border}`,
                                    color:w?C.warn:C.text,borderRadius:6,padding:"7px 10px",width:"100%",fontSize:13,fontFamily:FONT}}/>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Page>
          )}

          {/* ════ DEBTS ════ */}
          {tab==="debts"&&(
            <Page>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div>
                  <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26}}>Debt Planner</h1>
                  <p style={{color:C.textSub,fontSize:12,marginTop:3}}>Changes save automatically</p>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className={`method-btn ${debtMethod==="avalanche"?"active":""}`} onClick={()=>setMethod("avalanche")} style={{padding:"8px 20px"}}>Avalanche</button>
                  <button className={`method-btn ${debtMethod==="snowball"?"active":""}`}  onClick={()=>setMethod("snowball")}  style={{padding:"8px 20px"}}>Snowball</button>
                </div>
              </div>
              <div className="debt-summary">
                {[
                  {label:"Total Debt",value:fmt(totalDebt), color:C.warn},
                  {label:"Min / mo", value:fmt(totalMin),   color:C.textSub},
                  {label:"Extra",    value:fmt(extra),      color:C.accent},
                ].map(k=>(
                  <div key={k.label} className="card">
                    <div style={LBL}>{k.label}</div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:k.color}}>{k.value}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6}}>
                  <span style={{fontSize:13,color:C.textSub}}>Extra monthly payment</span>
                  <span style={{color:C.accent,fontWeight:500,fontSize:15}}>{fmt(extra)}</span>
                </div>
                <input type="range" min={0} max={5000} step={100} value={extra}
                  onChange={e=>setExtra(Number(e.target.value))} style={{width:"100%",accentColor:C.accent}}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {sorted.map((debt,i)=>{
                  const isFirst=i===0;
                  const pay=debt.minimum+(isFirst?extra:0);
                  const months=monthsToPayoff(debt.balance,debt.rate,pay);
                  const interest=months===Infinity?"∞":fmt(Math.max(0,pay*months-debt.balance));
                  return(
                    <div key={debt.id} className="card" style={{borderColor:isFirst?C.accentMid:C.border}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <div style={{width:28,height:28,borderRadius:"50%",background:isFirst?C.accentDim:C.surface,
                            border:`1px solid ${isFirst?C.accent:C.border}`,display:"flex",alignItems:"center",
                            justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:700,
                            fontSize:12,color:isFirst?C.accent:C.muted,flexShrink:0}}>{i+1}</div>
                          <div>
                            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15}}>{debt.name}</div>
                            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{debt.rate}% p.a. · min {fmt(debt.minimum)}/mo · {interest} total interest</div>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{color:C.warn,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:18}}>{fmt(debt.balance)}</div>
                          <div style={{fontSize:11,color:C.textSub,marginTop:2}}>{months===Infinity?"∞":`${months} months`}</div>
                        </div>
                      </div>
                      <div className="debt-inputs">
                        {[
                          {l:"Balance",k:"balance",v:debt.balance},
                          {l:"Rate %",  k:"rate",   v:debt.rate,   step:"0.1"},
                          {l:"Min Pay", k:"minimum",v:debt.minimum},
                        ].map(({l,k,v,step})=>(
                          <div key={k}>
                            <div style={LBL}>{l}</div>
                            <input type="number" step={step} value={v}
                              onChange={e=>updateDebt(debt.id,k,Number(e.target.value))}
                              style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,
                                borderRadius:6,padding:"7px 10px",width:"100%",fontSize:13,fontFamily:FONT}}/>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{padding:"12px 16px",background:C.accentDim,border:`1px solid ${C.accentMid}`,
                borderRadius:10,fontSize:12,color:C.accent,lineHeight:1.6}}>
                <strong>{debtMethod==="avalanche"?"Avalanche":"Snowball"}:</strong>{" "}
                {debtMethod==="avalanche"?"Highest interest first — saves the most.":"Smallest balance first — builds momentum."}{" "}
                Extra {fmt(extra)}/mo → {sorted[0]?.name}.
              </div>
            </Page>
          )}

          {/* ════ ADVISOR ════ */}
          {tab==="advisor"&&(
            <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden",height:"calc(100dvh - 54px)"}}>
              <div style={{padding:"11px 20px",borderBottom:`1px solid ${C.border}`,background:C.surface,
                display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:9}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:C.accent,boxShadow:`0 0 6px ${C.accent}`}}/>
                  <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,letterSpacing:"0.06em"}}>AI FINANCIAL ADVISOR</span>
                </div>
                <div style={{display:"flex",gap:16,fontSize:11,color:C.muted,flexWrap:"wrap"}}>
                  <span>Income: <span style={{color:C.accent}}>{fmt(income)}</span></span>
                  <span>Debt: <span style={{color:C.warn}}>{fmt(totalDebt)}</span></span>
                  <span>Surplus: <span style={{color:surplus>=0?C.accent:C.warn}}>{fmt(Math.abs(surplus))}</span></span>
                </div>
              </div>
              <div className="advisor-layout" style={{flex:1,overflow:"hidden",padding:"0 20px",marginTop:16}}>
                <div style={{display:"flex",flexDirection:"column",overflow:"hidden",background:C.card,border:`1px solid ${C.border}`,borderRadius:12}}>
                  <div style={{flex:1,overflowY:"auto",padding:"18px"}}>
                    {chat.map((m,i)=>(
                      <div key={i} className="up" style={{marginBottom:14,display:"flex",flexDirection:"column",
                        alignItems:m.role==="user"?"flex-end":"flex-start"}}>
                        <div style={{fontSize:9,color:C.muted,marginBottom:3,letterSpacing:"0.1em",textTransform:"uppercase"}}>
                          {m.role==="user"?"You":"Advisor"}
                        </div>
                        <div style={{maxWidth:"80%",background:m.role==="user"?C.accentDim:C.surface,
                          border:`1px solid ${m.role==="user"?C.accentMid:C.border}`,borderRadius:12,
                          padding:"10px 14px",fontSize:13,lineHeight:1.65,color:m.role==="user"?C.accent:C.text}}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading&&(
                      <div style={{display:"flex"}}>
                        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,
                          padding:"10px 14px",fontSize:13,color:C.muted}} className="typing">Thinking…</div>
                      </div>
                    )}
                    <div ref={chatEnd}/>
                  </div>
                  <div style={{borderTop:`1px solid ${C.border}`,background:C.surface,borderRadius:"0 0 12px 12px",flexShrink:0}}>
                    <div className="noscroll" style={{overflowX:"auto",display:"flex",gap:8,padding:"10px 16px 0"}}>
                      {["Where should I cut?","Best debt first?","TFSA tips?","Am I on track?","3-month plan","Capitec vs TymeBank?"].map(q=>(
                        <button key={q} className="chip" onClick={()=>setChatInput(q)}>{q}</button>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:10,padding:"10px 16px 16px"}}>
                      <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&send()}
                        placeholder="Ask anything about your finances…"
                        style={{flex:1,background:C.card,border:`1px solid ${C.border}`,color:C.text,
                          borderRadius:10,padding:"12px 14px",fontSize:14,fontFamily:FONT,outline:"none"}}/>
                      <button className="send-btn" onClick={send} disabled={chatLoading||!chatInput.trim()}>↑</button>
                    </div>
                  </div>
                </div>
                <div className="advisor-sidebar" style={{display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
                  <div className="card">
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:C.muted,
                      letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Your Snapshot</div>
                    {[
                      {label:"Income", value:fmt(income),            color:C.accent},
                      {label:"Spent",  value:fmt(totalSpent),        color:totalSpent>income?C.warn:C.text},
                      {label:"Surplus",value:fmt(Math.abs(surplus)), color:surplus>=0?C.accent:C.warn},
                      {label:"Debt",   value:fmt(totalDebt),         color:C.warn},
                      {label:"Needs",  value:`${pct(needsBudget,income)}%`,  color:C.textSub},
                      {label:"Wants",  value:`${pct(wantsBudget,income)}%`,  color:C.textSub},
                      {label:"Savings",value:`${pct(savingsBudget,income)}%`,color:C.textSub},
                    ].map(r=>(
                      <div key={r.label} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:7}}>
                        <span style={{color:C.textSub}}>{r.label}</span>
                        <span style={{color:r.color,fontWeight:500}}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:C.muted,
                      letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Quick Prompts</div>
                    {["Where should I cut spending?","Which debt to tackle first?","How do I grow my TFSA?",
                      "Am I on track this month?","Give me a 3-month action plan","Capitec vs TymeBank?",
                      "Should I save or pay off debt first?"].map(q=>(
                      <button key={q} onClick={()=>setChatInput(q)} style={{
                        display:"block",width:"100%",textAlign:"left",background:C.surface,
                        border:`1px solid ${C.border}`,color:C.textSub,borderRadius:7,
                        padding:"8px 12px",fontSize:11,fontFamily:FONT,cursor:"pointer",
                        marginBottom:6,transition:"all 0.15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accentMid;e.currentTarget.style.color=C.accent;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textSub;}}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{height:16,flexShrink:0}}/>
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav mobile */}
      <div className="bottom-nav">
        {TABS.map(t=>(
          <button key={t} className={`nav-btn ${tab===t?"active":""}`} onClick={()=>setTab(t)}>
            <Icon name={t} size={20}/>{t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT — handles auth state
// ══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [session,setSession] = useState(undefined); // undefined=loading, null=logged out, obj=logged in

  useEffect(()=>{
    // Get initial session
    supabase.auth.getSession().then(({data:{session}})=>setSession(session));
    // Listen for auth changes (magic link click lands here)
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setSession(session));
    return ()=>subscription.unsubscribe();
  },[]);

  async function signOut(){
    await supabase.auth.signOut();
    setSession(null);
  }

  // Loading
  if(session===undefined) return(
    <div style={{fontFamily:FONT,background:C.bg,minHeight:"100dvh",display:"flex",
      alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,color:C.text}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400&family=Syne:wght@800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <div style={{width:8,height:8,borderRadius:"50%",background:C.accent,
        boxShadow:`0 0 12px ${C.accent}`,animation:"pulse 1s infinite"}}/>
      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,letterSpacing:"0.05em"}}>
        RAND<span style={{color:C.accent}}>WISE</span>
      </div>
      <div style={{color:C.textSub,fontSize:12}}>Loading…</div>
    </div>
  );

  if(!session) return <LoginScreen/>;
  return <Dashboard user={session.user} onSignOut={signOut}/>;
}