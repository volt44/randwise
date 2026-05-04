import { C, FONT, LBL } from "../../constants/colors";
import { fmt } from "../../utils/format";
import { monthsToPayoff } from "../../utils/debt";
import Page from "../Page";

function DebtsTab({ debts, debtMethod, extra, sorted, totalDebt, totalMin, setDebtMethod, setExtra, updateDebt }) {
  return (
    <Page>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div><h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26}}>Debt Planner</h1><p style={{color:C.textSub,fontSize:12,marginTop:3}}>Changes save automatically</p></div>
        <div style={{display:"flex",gap:8}}>
          <button className={`method-btn ${debtMethod==="avalanche"?"active":""}`} onClick={()=>setDebtMethod("avalanche")} style={{padding:"8px 20px"}}>Avalanche</button>
          <button className={`method-btn ${debtMethod==="snowball"?"active":""}`}  onClick={()=>setDebtMethod("snowball")}  style={{padding:"8px 20px"}}>Snowball</button>
        </div>
      </div>
      <div className="debt-summary">
        {[{label:"Total Debt",value:fmt(totalDebt),color:C.warn},{label:"Min / mo",value:fmt(totalMin),color:C.textSub},{label:"Extra",value:fmt(extra),color:C.accent}].map(k=>(<div key={k.label} className="card"><div style={LBL}>{k.label}</div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:20,color:k.color}}>{k.value}</div></div>))}
      </div>
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6}}><span style={{fontSize:13,color:C.textSub}}>Extra monthly payment</span><span style={{color:C.accent,fontWeight:500,fontSize:15}}>{fmt(extra)}</span></div>
        <input type="range" min={0} max={5000} step={100} value={extra} onChange={e=>setExtra(Number(e.target.value))} style={{width:"100%",accentColor:C.accent}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {sorted.map((debt,i)=>{
          const isFirst=i===0; const pay=debt.minimum+(isFirst?extra:0);
          const months=monthsToPayoff(debt.balance,debt.rate,pay);
          const interest=months===Infinity?"∞":fmt(Math.max(0,pay*months-debt.balance));
          return(
            <div key={debt.id} className="card" style={{borderColor:isFirst?C.accentMid:C.border}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:isFirst?C.accentDim:C.surface,border:`1px solid ${isFirst?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12,color:isFirst?C.accent:C.muted,flexShrink:0}}>{i+1}</div>
                  <div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15}}>{debt.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{debt.rate}% p.a. · min {fmt(debt.minimum)}/mo · {interest} total interest</div></div>
                </div>
                <div style={{textAlign:"right"}}><div style={{color:C.warn,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:18}}>{fmt(debt.balance)}</div><div style={{fontSize:11,color:C.textSub,marginTop:2}}>{months===Infinity?"∞":`${months} months`}</div></div>
              </div>
              <div className="debt-inputs">
                {[{l:"Balance",k:"balance",v:debt.balance},{l:"Rate %",k:"rate",v:debt.rate,step:"0.1"},{l:"Min Pay",k:"minimum",v:debt.minimum}].map(({l,k,v,step})=>(
                  <div key={k}><div style={LBL}>{l}</div><input type="number" step={step} value={v} onChange={e=>updateDebt(debt.id,k,Number(e.target.value))} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.text,borderRadius:6,padding:"7px 10px",width:"100%",fontSize:13,fontFamily:FONT}}/></div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"12px 16px",background:C.accentDim,border:`1px solid ${C.accentMid}`,borderRadius:10,fontSize:12,color:C.accent,lineHeight:1.6}}>
        <strong>{debtMethod==="avalanche"?"Avalanche":"Snowball"}:</strong>{" "}{debtMethod==="avalanche"?"Highest interest first — saves the most.":"Smallest balance first — builds momentum."}{" "}Extra {fmt(extra)}/mo → {sorted[0]?.name}.
      </div>
    </Page>
  );
}

export default DebtsTab;
