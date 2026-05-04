import { useState, useRef } from "react";
import { supabase } from "../supabase";
import { C, FONT } from "../constants/colors";
import { ALLOWED_EMAIL } from "../constants/defaults";

function LoginScreen() {
  const [step,setStep]       = useState("email");
  const [email,setEmail]     = useState("");
  const [code,setCode]       = useState("");
  const [loading,setLoading] = useState(false);
  const [errMsg,setErrMsg]   = useState("");
  const codeRef              = useRef(null);

  async function sendOTP(){
    const trimmed=email.trim().toLowerCase();
    if(trimmed!==ALLOWED_EMAIL){ setErrMsg("This app is private. Only the registered account can sign in."); setStep("error"); return; }
    setLoading(true);
    const {error}=await supabase.auth.signInWithOtp({ email:trimmed, options:{ shouldCreateUser:false } });
    setLoading(false);
    if(error){ setErrMsg(error.message); setStep("error"); }
    else{ setStep("code"); setTimeout(()=>codeRef.current?.focus(),300); }
  }

  async function verifyOTP(){
    if(code.length!==6) return;
    setLoading(true);
    const {error}=await supabase.auth.verifyOtp({ email:email.trim().toLowerCase(), token:code, type:"email" });
    setLoading(false);
    if(error){ setErrMsg("Invalid or expired code. Please try again."); setStep("error"); }
  }

  return(
    <div style={{fontFamily:FONT,background:C.bg,minHeight:"100dvh",color:C.text,
      display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        input{font-family:${FONT};}
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .lc{animation:up 0.3s ease forwards;}
        .li:focus{outline:none;border-color:${C.accentMid}!important;}
        .otp-input{width:44px;height:52px;text-align:center;font-size:22px;font-weight:700;
          background:${C.surface};border:1px solid ${C.border};color:${C.text};border-radius:10px;
          font-family:${FONT};transition:border-color 0.2s;}
        .otp-input:focus{outline:none;border-color:${C.accentMid};}
      `}</style>

      <div className="lc" style={{width:"100%",maxWidth:400}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:C.accent,
            boxShadow:`0 0 20px ${C.accent}`,margin:"0 auto 14px"}}/>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:28,letterSpacing:"0.05em"}}>
            RAND<span style={{color:C.accent}}>WISE</span>
          </div>
          <div style={{color:C.textSub,fontSize:12,marginTop:6}}>Your personal finance dashboard</div>
        </div>

        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:32}}>

          {/* ── Step 1: Enter email ── */}
          {step==="email"&&(
            <>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,marginBottom:6}}>Sign in</div>
              <div style={{color:C.textSub,fontSize:12,marginBottom:24,lineHeight:1.6}}>
                We&apos;ll send a 6-digit code to your email — no password, no redirect.
              </div>
              <div style={{fontSize:10,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Email</div>
              <input className="li" type="email" value={email}
                onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendOTP()}
                placeholder="you@example.com"
                style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,
                  color:C.text,borderRadius:8,padding:"12px 14px",fontSize:14,
                  fontFamily:FONT,marginBottom:16,transition:"border-color 0.2s"}}/>
              <button onClick={sendOTP} disabled={loading||!email.trim()}
                style={{width:"100%",background:C.accent,color:C.bg,border:"none",
                  borderRadius:10,padding:"13px 0",cursor:"pointer",
                  fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,
                  letterSpacing:"0.06em",opacity:loading||!email.trim()?0.4:1,transition:"opacity 0.2s"}}>
                {loading?"Sending code…":"Send Code"}
              </button>
            </>
          )}

          {/* ── Step 2: Enter 6-digit code ── */}
          {step==="code"&&(
            <>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,marginBottom:6}}>Check your email</div>
              <div style={{color:C.textSub,fontSize:12,marginBottom:24,lineHeight:1.6}}>
                Enter the 6-digit code sent to <span style={{color:C.text}}>{email}</span>
              </div>

              <input
                ref={codeRef}
                type="number"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={e=>{ const v=e.target.value.replace(/\D/g,"").slice(0,6); setCode(v); }}
                placeholder="000000"
                style={{width:"100%",background:C.surface,border:`1px solid ${code.length===6?C.accentMid:C.border}`,
                  color:C.accent,borderRadius:10,padding:"16px 0",fontSize:28,fontWeight:700,
                  fontFamily:FONT,textAlign:"center",letterSpacing:"0.3em",marginBottom:16,
                  transition:"border-color 0.2s",outline:"none"}}/>

              <button onClick={verifyOTP} disabled={loading||code.length!==6}
                style={{width:"100%",background:C.accent,color:C.bg,border:"none",
                  borderRadius:10,padding:"13px 0",cursor:"pointer",
                  fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,
                  letterSpacing:"0.06em",opacity:loading||code.length!==6?0.4:1,transition:"opacity 0.2s"}}>
                {loading?"Verifying…":"Sign In"}
              </button>

              <button onClick={()=>{setStep("email");setCode("");}}
                style={{width:"100%",marginTop:10,background:"none",border:`1px solid ${C.border}`,
                  color:C.muted,borderRadius:8,padding:"9px 0",cursor:"pointer",fontFamily:FONT,fontSize:12}}>
                Use a different email
              </button>

              <div style={{marginTop:16,textAlign:"center"}}>
                <button onClick={sendOTP} disabled={loading}
                  style={{background:"none",border:"none",color:C.textSub,fontSize:11,
                    cursor:"pointer",fontFamily:FONT,textDecoration:"underline"}}>
                  Resend code
                </button>
              </div>
            </>
          )}

          {/* ── Error ── */}
          {step==="error"&&(
            <div style={{textAlign:"center"}}>
              <div style={{color:C.warn,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,marginBottom:10}}>Sign in failed</div>
              <div style={{color:C.textSub,fontSize:13,lineHeight:1.7,marginBottom:20}}>{errMsg}</div>
              <button onClick={()=>{setStep("email");setErrMsg("");setCode("");}}
                style={{background:C.accentDim,border:`1px solid ${C.accentMid}`,color:C.accent,
                  borderRadius:8,padding:"9px 20px",cursor:"pointer",fontFamily:FONT,fontSize:12}}>
                Try again
              </button>
            </div>
          )}
        </div>
        <div style={{textAlign:"center",marginTop:20,fontSize:11,color:C.muted}}>
          Secured by Supabase · Cape Town, ZAR
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
