import { useEffect, useMemo, useRef, useState } from "react";
import { THEMES } from "./constants";

export function Spinner({ t, label }) {
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,color:t.textMuted}}>
      <div style={{display:"flex",gap:6}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:8,height:8,borderRadius:"50%",background:t.accent,animation:`bounce 1s ${i*0.15}s infinite`}}/>
        ))}
      </div>
      {label && <span style={{fontSize:11}}>{label}</span>}
    </div>
  );
}

export function CheckList({ items, selected, onToggle, search, t }) {
  const safeItems = Array.isArray(items) ? items : [];
  const filtered = search
    ? safeItems.filter(b => typeof b === "string" && b.toLowerCase().includes(search.toLowerCase()))
    : safeItems;

  if (filtered.length === 0) {
    return (
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:t.textFaint,fontSize:12}}>
        No results found
      </div>
    );
  }

  const cols = 4;
  const colSize = Math.ceil(filtered.length / cols);
  const columns = Array.from({length:cols}, (_,ci) => filtered.slice(ci*colSize, (ci+1)*colSize));

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",flex:1,minHeight:0,overflowY:"auto"}}>
      {columns.map((col,ci) => (
        <div key={ci} style={{borderRight:ci<cols-1?`1px solid ${t.borderFaint}`:"none"}}>
          {col.map(val => {
            const active = selected.includes(val);
            return (
              <div
                key={val}
                onClick={()=>onToggle(val)}
                style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",cursor:"pointer",background:active?t.accentBg:"transparent",transition:"background 0.1s"}}
                onMouseEnter={e=>{if(!active)e.currentTarget.style.background=t.inputBg;}}
                onMouseLeave={e=>{e.currentTarget.style.background=active?t.accentBg:"transparent";}}
              >
                <div style={{width:15,height:15,borderRadius:4,flexShrink:0,border:`1.5px solid ${active?t.accent:t.border}`,background:active?t.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {active&&<span style={{fontSize:9,color:"#000",fontWeight:900}}>✓</span>}
                </div>
                <span style={{fontSize:11,color:active?t.accent:t.textSub,fontWeight:active?600:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function DRow({ label, value, t, accent=false }) {
  if (!value || value === "-" || value === "") return null;
  return (
    <div style={{display:"flex",gap:6,padding:"4px 0",borderBottom:`1px solid ${t.borderFaint}`}}>
      <span style={{fontSize:10,color:t.textMuted,fontWeight:600,minWidth:90,flexShrink:0}}>{label}</span>
      <span style={{fontSize:10,color:accent?t.accent:t.text,fontWeight:accent?700:400,wordBreak:"break-word"}}>{value}</span>
    </div>
  );
}

export function StatBox({ label, value, color, t }) {
  const isComposite = value && typeof value === "object" && !Array.isArray(value);
  const primaryValue = isComposite ? (value.qty ?? value.value ?? "") : value;
  const secondaryValue = isComposite ? (value.date ?? value.subValue ?? "") : "";

  return (
    <div style={{flex:1,padding:"10px 8px",background:t.inputBg,borderRadius:10,border:`1px solid ${t.borderFaint}`,textAlign:"center",minWidth:70}}>
      <div style={{fontSize:9,color:t.textMuted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:3,whiteSpace:"nowrap"}}>{label}</div>
      <div style={{fontSize:16,fontWeight:800,color:color||t.text}}>{primaryValue}</div>
      {secondaryValue ? <div style={{fontSize:9,color:t.textSub,marginTop:2,lineHeight:1.2,fontWeight:600}}>{secondaryValue}</div> : null}
    </div>
  );
}

export function FilterGroup({ label, icon, options, selected, onToggle, onClear, accent, t }) {
  const [open,setOpen] = useState(true);
  const [search,setSearch] = useState("");
  const safeOptions = useMemo(() => Array.isArray(options) ? options : [], [options]);
  const isLarge = safeOptions.length > 6;
  const filteredOpts = useMemo(
    () => search
      ? safeOptions.filter(o => typeof o === "string" && o.toLowerCase().includes(search.toLowerCase()))
      : safeOptions,
    [safeOptions, search]
  );

  return (
    <div style={{borderBottom:`1px solid ${t.borderFaint}`}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"none",border:"none",cursor:"pointer",padding:"10px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12}}>{icon}</span>
          <span style={{fontSize:10,fontWeight:700,color:t.textMuted,letterSpacing:"1.8px",textTransform:"uppercase"}}>{label}</span>
          {selected.length>0&&<span style={{fontSize:9,fontWeight:800,background:accent,color:"#000",borderRadius:20,padding:"1px 7px",lineHeight:"16px"}}>{selected.length}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {selected.length>0&&onClear&&<span onClick={e=>{e.stopPropagation();onClear();}} style={{fontSize:9,color:"#ef4444",padding:"2px 6px",borderRadius:4,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",cursor:"pointer",fontWeight:700}}>✕</span>}
          <span style={{color:t.textFaint,fontSize:9,display:"inline-block",transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▼</span>
        </div>
      </button>
      {open&&(
        <div style={{paddingBottom:12}}>
          {isLarge&&(
            <div style={{padding:"0 12px 8px",position:"relative"}}>
              <span style={{position:"absolute",left:21,top:"50%",transform:"translateY(-60%)",color:t.textFaint,fontSize:12,pointerEvents:"none"}}>⌕</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{width:"100%",padding:"7px 10px 7px 26px",background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:8,color:t.text,fontSize:10,outline:"none"}}/>
            </div>
          )}
          {isLarge ? (
            <div style={{maxHeight:160,overflowY:"auto",padding:"0 12px"}}>
              {filteredOpts.map(opt=>{const a=selected.includes(opt);return(
                <div key={opt} onClick={()=>onToggle(opt)} style={{display:"flex",alignItems:"center",gap:9,padding:"6px 8px",borderRadius:7,cursor:"pointer",background:a?`${accent}12`:"transparent",marginBottom:2}}>
                  <div style={{width:14,height:14,borderRadius:4,border:`1.5px solid ${a?accent:t.border}`,background:a?accent:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {a&&<span style={{fontSize:8,color:"#000",fontWeight:900}}>✓</span>}
                  </div>
                  <span style={{fontSize:11,color:a?accent:t.textSub,fontWeight:a?600:400,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{opt}</span>
                </div>
              );})}
            </div>
          ) : (
            <div style={{padding:"0 12px",display:"flex",flexWrap:"wrap",gap:6}}>
              {safeOptions.map(opt=>{const a=selected.includes(opt);return(
                <button key={opt} onClick={()=>onToggle(opt)} style={{padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",background:a?`${accent}20`:t.inputBg,border:`1px solid ${a?accent+"55":t.border}`,color:a?accent:t.textMuted,transform:a?"scale(1.04)":"scale(1)",transition:"all 0.15s"}}>{opt}</button>
              );})}
            </div>
          )}
          {isLarge&&selected.length>0&&(
            <div style={{padding:"6px 12px 0",display:"flex",flexWrap:"wrap",gap:4}}>
              {selected.map(s=><span key={s} onClick={()=>onToggle(s)} style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:`${accent}18`,border:`1px solid ${accent}40`,color:accent,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:4}}>{s}<span style={{fontSize:9,opacity:0.7}}>✕</span></span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SortToggle({ label, value, onChange, t }) {
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 16px"}}>
      <span style={{fontSize:10,fontWeight:600,color:t.textMuted,letterSpacing:"1.5px",textTransform:"uppercase"}}>{label}</span>
      <div style={{display:"flex",gap:3}}>
        {[["—","None"],["↑","ASC"],["↓","DESC"]].map(([sym,v])=>{const a=value===v;return(
          <button key={v} onClick={()=>onChange(v)} style={{width:28,height:26,borderRadius:7,border:`1px solid ${a?t.accentBorder:t.border}`,background:a?t.accentBg:t.inputBg,color:a?t.accent:t.textFaint,fontSize:13,cursor:"pointer",fontWeight:700}}>{sym}</button>
        );})}
      </div>
    </div>
  );
}

export function ThemePicker({ current, onChange, t }) {
  const [open,setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:t.accentBg,border:`1px solid ${t.accentBorder}`,borderRadius:8,color:t.accent,fontSize:11,cursor:"pointer",fontWeight:600}}>
        <span>{THEMES[current].icon}</span><span>{THEMES[current].name}</span><span style={{fontSize:9,opacity:0.6}}>▼</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:t.bgAlt,border:`1px solid ${t.border}`,borderRadius:12,padding:6,zIndex:200,boxShadow:"0 20px 50px rgba(0,0,0,0.5)",minWidth:160,animation:"fadeIn 0.15s ease"}}>
          <div style={{fontSize:9,color:t.textFaint,letterSpacing:"1.5px",textTransform:"uppercase",padding:"4px 10px 8px",fontWeight:700}}>Choose Theme</div>
          {Object.entries(THEMES).map(([key,th])=>{const a=current===key;return(
            <button key={key} onClick={()=>{onChange(key);setOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,background:a?t.accentBg:"transparent",border:`1px solid ${a?t.accentBorder:"transparent"}`,cursor:"pointer",marginBottom:2}}>
              <span style={{fontSize:16}}>{th.icon}</span>
              <span style={{fontSize:12,fontWeight:600,color:a?t.accent:t.text}}>{th.name}</span>
              {a&&<span style={{marginLeft:"auto",color:t.accent}}>✓</span>}
            </button>
          );})}
        </div>
      )}
    </div>
  );
}

export function LoadingDots({ t }) {
  return (
    <div style={{display:"flex",gap:6,justifyContent:"center"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:9,height:9,borderRadius:"50%",background:t.accent,animation:`bounce 1s ${i*0.15}s infinite`}}/>
      ))}
    </div>
  );
}
