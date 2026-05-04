import { useRef, useEffect } from "react";
import { C, FONT } from "../../constants/colors";
import { fmt, pct } from "../../utils/format";

function AdvisorTab({ income, totalSpent, surplus, totalDebt, needsBudget, wantsBudget, savingsBudget, chat, chatInput, chatLoading, setChatInput, send }) {
  const chatEnd = useRef(null);
  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:"smooth"}); }, [chat]);

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden",height:"calc(100dvh - 54px)"}}>
      <div style={{padding:"11px 20px",borderBottom:`1px solid ${C.border}`,background:C.surface,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
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
              <div key={i} className="up" style={{marginBottom:14,display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{fontSize:9,color:C.muted,marginBottom:3,letterSpacing:"0.1em",textTransform:"uppercase"}}>{m.role==="user"?"You":"Advisor"}</div>
                <div style={{maxWidth:"80%",background:m.role==="user"?C.accentDim:C.surface,border:`1px solid ${m.role==="user"?C.accentMid:C.border}`,borderRadius:12,padding:"10px 14px",fontSize:13,lineHeight:1.65,color:m.role==="user"?C.accent:C.text}}>{m.content}</div>
              </div>
            ))}
            {chatLoading&&(<div style={{display:"flex"}}><div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",fontSize:13,color:C.muted}} className="typing">Thinking…</div></div>)}
            <div ref={chatEnd}/>
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,background:C.surface,borderRadius:"0 0 12px 12px",flexShrink:0}}>
            <div className="noscroll" style={{overflowX:"auto",display:"flex",gap:8,padding:"10px 16px 0"}}>
              {["Where should I cut?","Best debt first?","TFSA tips?","Am I on track?","3-month plan","Discovery Bank tips?"].map(q=>(<button key={q} className="chip" onClick={()=>setChatInput(q)}>{q}</button>))}
            </div>
            <div style={{display:"flex",gap:10,padding:"10px 16px 16px"}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything about your finances…" style={{flex:1,background:C.card,border:`1px solid ${C.border}`,color:C.text,borderRadius:10,padding:"12px 14px",fontSize:14,fontFamily:FONT,outline:"none"}}/>
              <button className="send-btn" onClick={send} disabled={chatLoading||!chatInput.trim()}>↑</button>
            </div>
          </div>
        </div>
        <div className="advisor-sidebar" style={{display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
          <div className="card">
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Your Snapshot</div>
            {[{label:"Income",value:fmt(income),color:C.accent},{label:"Spent",value:fmt(totalSpent),color:totalSpent>income?C.warn:C.text},{label:"Surplus",value:fmt(Math.abs(surplus)),color:surplus>=0?C.accent:C.warn},{label:"Debt",value:fmt(totalDebt),color:C.warn},{label:"Needs",value:`${pct(needsBudget,income)}%`,color:C.textSub},{label:"Wants",value:`${pct(wantsBudget,income)}%`,color:C.textSub},{label:"Savings",value:`${pct(savingsBudget,income)}%`,color:C.textSub}].map(r=>(<div key={r.label} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:7}}><span style={{color:C.textSub}}>{r.label}</span><span style={{color:r.color,fontWeight:500}}>{r.value}</span></div>))}
          </div>
          <div className="card">
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:11,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Quick Prompts</div>
            {["Where should I cut spending?","Which debt to tackle first?","How do I grow my TFSA?","Am I on track this month?","Give me a 3-month action plan","Discovery Bank vs competitors?","Should I save or pay off debt first?"].map(q=>(<button key={q} onClick={()=>setChatInput(q)} style={{display:"block",width:"100%",textAlign:"left",background:C.surface,border:`1px solid ${C.border}`,color:C.textSub,borderRadius:7,padding:"8px 12px",fontSize:11,fontFamily:FONT,cursor:"pointer",marginBottom:6,transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accentMid;e.currentTarget.style.color=C.accent;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textSub;}}>{q}</button>))}
          </div>
        </div>
      </div>
      <div style={{height:16,flexShrink:0}}/>
    </div>
  );
}

export default AdvisorTab;
