import { useState, useRef } from "react";
import { parseBankStatement } from "../api/parser";
import { mapToCategory } from "../constants/mappings";
import { fmt } from "../utils/format";
import { C } from "../constants/colors";
import Icon from "./Icon";

function PDFParser({onApply, onClose}) {
  const [stage,setStage]   = useState("upload");
  const [,setTxns]         = useState([]);
  const [mapped,setMapped] = useState([]);
  const [errMsg,setErrMsg] = useState("");
  const fileRef            = useRef(null);

  async function handleFile(file){
    if(!file||file.type!=="application/pdf"){ setErrMsg("Please upload a PDF file."); return; }
    setErrMsg("");
    setStage("parsing");
    try{
      const base64=await new Promise((res,rej)=>{
        const r=new FileReader();
        r.onload=()=>res(r.result.split(",")[1]);
        r.onerror=rej;
        r.readAsDataURL(file);
      });
      const result=await parseBankStatement(base64);
      const txns=result.transactions||[];
      if(txns.length===0){ setErrMsg("No transactions found. Make sure this is a Discovery Bank statement."); setStage("upload"); return; }

      const mappedTxns=txns.map(t=>({
        ...t,
        category: mapToCategory(t.description),
        include: true,
      }));
      setTxns(txns);
      setMapped(mappedTxns);
      setStage("review");
    }catch{
      setErrMsg("Failed to parse statement. Please try again.");
      setStage("upload");
    }
  }

  function applyTransactions(){
    setStage("applying");
    const sums={};
    mapped.filter(t=>t.include).forEach(t=>{
      sums[t.category]=(sums[t.category]||0)+t.amount;
    });
    onApply(sums);
    setStage("done");
  }

  const totalIncluded=mapped.filter(t=>t.include).reduce((s,t)=>s+t.amount,0);

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,
        width:"100%",maxWidth:560,maxHeight:"85dvh",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,
          display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,letterSpacing:"0.05em"}}>
            📄 Discovery Bank Statement Parser
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}>
            <Icon name="x" size={18}/>
          </button>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:20}}>

          {/* ── Upload ── */}
          {stage==="upload"&&(
            <>
              <div style={{color:C.textSub,fontSize:13,lineHeight:1.7,marginBottom:20}}>
                Upload your Discovery Bank PDF statement. Claude will extract all transactions and map them to your budget categories automatically.
              </div>
              <div onClick={()=>fileRef.current?.click()}
                style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"40px 20px",
                  textAlign:"center",cursor:"pointer",transition:"border-color 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.accentMid}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                <Icon name="upload" size={32}/>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,marginTop:12,color:C.text}}>
                  Tap to upload statement
                </div>
                <div style={{fontSize:11,color:C.muted,marginTop:6}}>PDF only · Discovery Bank</div>
              </div>
              <input ref={fileRef} type="file" accept=".pdf" style={{display:"none"}}
                onChange={e=>handleFile(e.target.files[0])}/>
              {errMsg&&<div style={{color:C.warn,fontSize:12,marginTop:12,textAlign:"center"}}>{errMsg}</div>}
            </>
          )}

          {/* ── Parsing ── */}
          {stage==="parsing"&&(
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:C.accent,
                boxShadow:`0 0 12px ${C.accent}`,margin:"0 auto 20px",animation:"pulse 1s infinite"}}/>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,marginBottom:8}}>Parsing statement…</div>
              <div style={{color:C.textSub,fontSize:12}}>Claude is reading your transactions</div>
            </div>
          )}

          {/* ── Review ── */}
          {stage==="review"&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14}}>
                  {mapped.filter(t=>t.include).length} transactions · {fmt(totalIncluded)}
                </div>
                <div style={{fontSize:11,color:C.textSub}}>Toggle to exclude</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {mapped.map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",
                    background:t.include?C.surface:C.bg,border:`1px solid ${t.include?C.border:"transparent"}`,
                    borderRadius:8,cursor:"pointer",opacity:t.include?1:0.4,transition:"all 0.15s"}}
                    onClick={()=>setMapped(p=>p.map((x,j)=>j===i?{...x,include:!x.include}:x))}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:t.include?C.accent:C.muted,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.description}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:1}}>{t.date} · {t.category}</div>
                    </div>
                    <div style={{fontSize:12,color:t.include?C.warn:C.muted,fontWeight:500,flexShrink:0}}>{fmt(t.amount)}</div>
                  </div>
                ))}
              </div>

              <div style={{marginTop:14,padding:"12px 14px",background:C.accentDim,
                border:`1px solid ${C.accentMid}`,borderRadius:10,fontSize:11,color:C.accent,lineHeight:1.6}}>
                Tap any transaction to exclude it. Category auto-assigned — you can edit in Budget tab after applying.
              </div>
            </>
          )}

          {/* ── Done ── */}
          {stage==="done"&&(
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:C.accentDim,
                border:`1px solid ${C.accentMid}`,display:"flex",alignItems:"center",
                justifyContent:"center",margin:"0 auto 16px"}}>
                <Icon name="check" size={22}/>
              </div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.accent,marginBottom:8}}>
                Applied!
              </div>
              <div style={{color:C.textSub,fontSize:13,lineHeight:1.7}}>
                {mapped.filter(t=>t.include).length} transactions imported into your budget.
              </div>
              <button onClick={onClose} style={{marginTop:20,background:C.accent,color:C.bg,border:"none",
                borderRadius:10,padding:"12px 28px",cursor:"pointer",
                fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13}}>
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {stage==="review"&&(
          <div style={{padding:"14px 20px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,flexShrink:0}}>
            <button onClick={()=>setStage("upload")}
              style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,color:C.textSub,
                borderRadius:10,padding:"11px 0",cursor:"pointer",fontFamily:"'Syne',sans-serif",
                fontWeight:700,fontSize:12,letterSpacing:"0.05em"}}>
              Upload Different
            </button>
            <button onClick={applyTransactions}
              style={{flex:2,background:C.accent,color:C.bg,border:"none",borderRadius:10,
                padding:"11px 0",cursor:"pointer",fontFamily:"'Syne',sans-serif",
                fontWeight:700,fontSize:12,letterSpacing:"0.05em"}}>
              Apply {mapped.filter(t=>t.include).length} Transactions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PDFParser;
