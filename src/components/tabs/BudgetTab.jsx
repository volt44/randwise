import { C, FONT, LBL } from "../../constants/colors";
import { fmt, pct } from "../../utils/format";
import Icon from "../Icon";
import Page from "../Page";

function BudgetTab({ income, categories, updateIncome, updateCategory, onOpenPDF }) {
  return (
    <Page>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:26}}>Budget Tracker</h1>
          <p style={{color:C.textSub,fontSize:12,marginTop:3}}>Changes save automatically</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <button className="upload-btn" onClick={onOpenPDF}>
            <Icon name="upload" size={14}/>Import Statement
          </button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:C.textSub}}>Income</span>
            <input type="number" value={income} onChange={e=>updateIncome(Number(e.target.value))}
              style={{background:C.card,border:`1px solid ${C.border}`,color:C.accent,borderRadius:8,padding:"8px 12px",width:120,fontSize:15,fontFamily:FONT,fontWeight:500,textAlign:"right"}}/>
          </div>
        </div>
      </div>
      {["needs","wants","savings"].map(group=>(
        <div key={group}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:10,color:C.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10,paddingLeft:2}}>
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
                      <div key={k}><div style={LBL}>{l}</div><input type="number" value={v} onChange={e=>updateCategory(cat.id,k,Number(e.target.value))} style={{background:C.surface,border:`1px solid ${w?C.warn:C.border}`,color:w?C.warn:C.text,borderRadius:6,padding:"7px 10px",width:"100%",fontSize:13,fontFamily:FONT}}/></div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </Page>
  );
}

export default BudgetTab;
