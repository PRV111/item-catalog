import { useEffect, useRef, useState } from "react";
import { Carousel, SingleImage } from "./media-ui";
import { DRow, StatBox } from "./basic-ui";


export function ImageModal({ item,metrics, onClose, onAsk, onAddToCart, cartQty = 0, showAskAi = true, zoomEnabled = true, t }) {
  const metric = metrics || {};
  const [open,setOpen]=useState(false);
  const [tab,setTab]=useState("overview");
  //const metric = metrics || {};  ✅
  const stColor=(metric.sellThru||0)===0?"#ef4444"
  :(metric.sellThru||0)<10?"#f97316"
  :(metric.sellThru||0)<20?"#10b981":"#3b82f6";
  const monthlySellThru=Number(metric.monthlySellThru)||0;
  const mstColor=monthlySellThru===0?"#ef4444"
  :monthlySellThru<10?"#f97316"
  :monthlySellThru<20?"#10b981"
  :"#3b82f6";

  useEffect(()=>{
    setTimeout(()=>setOpen(true),10);
    const fn=e=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",fn);
    return()=>window.removeEventListener("keydown",fn);
  },[onClose]);

  const tabs=[["overview","📋Overview"],["categories","🗂 Categories"],["desc","📝 Desc"]];
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,animation:"fadeIn 0.2s ease"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:t.bgAlt,border:`1px solid ${t.border}`,borderRadius:24,overflow:"hidden",maxWidth:900,width:"100%",height:560,display:"flex",transform:open?"scale(1)":"scale(0.94)",opacity:open?1:0,transition:"all 0.3s cubic-bezier(.34,1.2,.64,1)",boxShadow:"0 50px 150px rgba(0,0,0,0.8)"}}>
        <div style={{width:360,flexShrink:0,display:"flex",flexDirection:"column",background:"#000",position:"relative"}}>
          <div style={{flex:1,position:"relative",overflow:"hidden"}}>
            <Carousel item={item} height={400} fit="contain" showDots={true} showArrows={true} showCounter={true} showThumbs={true} showExpand={false} zoomEnabled={zoomEnabled} t={t}/>
          
          </div>
          <div style={{padding:"10px 14px",background:"rgba(0,0,0,0.6)",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{fontSize:16,fontWeight:800,color:t.accent}}>{item.id}</div>
          </div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"16px 20px 0",borderBottom:`1px solid ${t.borderSub}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontSize:20,fontWeight:800,color:t.accent}}>{item.id}</div>
              </div>
              <button onClick={onClose} style={{background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:8,color:t.textSub,width:30,height:30,cursor:"pointer",fontSize:14,flexShrink:0}}>✕</button>
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
              {[item.season,item.division,item.section,item.department,item.category].filter(Boolean).map(tag=><span key={tag} style={{fontSize:9,padding:"2px 8px",borderRadius:20,background:t.accentBg,border:`1px solid ${t.accentBorder}`,color:t.accent,fontWeight:700}}>{tag}</span>)}
            </div>
            <div style={{display:"flex",gap:2}}>
              {tabs.map(([key,label])=>(
                <button key={key} onClick={()=>setTab(key)} style={{padding:"7px 14px",borderRadius:"8px 8px 0 0",border:`1px solid ${tab===key?t.accentBorder:t.borderFaint}`,borderBottom:"none",background:tab===key?t.accentBg:t.inputBg,color:tab===key?t.accent:t.textMuted,fontSize:10,cursor:"pointer",fontWeight:tab===key?700:400,transition:"all 0.15s"}}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 20px",minHeight:0}}>
            {tab==="overview"&&(
              <div>
               <div style={{display:"flex", gap:8, marginBottom:8}}>
  <StatBox label="YTD Sale"   value={metric.saleQty}      color={t.accent}   t={t}/>
  <StatBox label="LM Sale"    value={metric.lmsale}       color={t.textMuted} t={t}/>
  <StatBox label="MTD Sale"   value={item.mtdsale}      color={t.textSub}  t={t}/>
  
  <StatBox label="Store stk"  value={item.storeStockQty} color={t.text}   t={t}/>
  <StatBox label="WH stock"   value={item.whStockQty}   color={t.textSub} t={t}/>
</div>
{/* Row 2 — stock */}
<div style={{display:"flex", gap:8, marginBottom:10}}>
  <StatBox label="YTD GRC QTY"   value={metric.ytdgrcqty}   color={t.textSub} t={t}/>
  <StatBox label="Last GRC"   value={{qty:metric.grcqty, date:metric.lastInDate?.split(" ")[0]}} color={t.text} t={t}/>
  <StatBox label="PEND QTY"   value={metric.pendqty}   color={t.textSub} t={t}/>
</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2, minmax(0, 1fr))",gap:12,marginBottom:14}}>
                  <div style={{background:t.inputBg,borderRadius:12,padding:"12px 14px",border:`1px solid ${t.borderFaint}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:10,color:t.textMuted,textTransform:"uppercase",letterSpacing:"1px",fontWeight:600}}>WK Sell Through</span>
                    <span style={{fontSize:12,fontWeight:800,color:stColor}}>
                      {(metric.sellThru||0).toFixed(2)}%</span>
                  </div>
                  <div style={{height:6,background:t.border,borderRadius:3,overflow:"hidden",marginBottom:6}}>
                    <div style={{width:`${Math.min((metric.sellThru||0)/40*100,100)}%`,height:"100%",background:stColor,borderRadius:3,transition:"width 0.8s ease"}}/>
                  </div>
                  <div style={{fontSize:10,color:stColor,fontWeight:600}}>
                    {(metric.sellThru||0)===0?"⚠️ Dead Stock"
                    :(metric.sellThru||0)<10?"🔶 Low movement"
                    :(metric.sellThru||0)<20?"✅ Healthy":"🔥 Hot seller"}
                  </div>
                </div>
                  <div style={{background:t.inputBg,borderRadius:12,padding:"12px 14px",border:`1px solid ${t.borderFaint}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:10,color:t.textMuted,textTransform:"uppercase",letterSpacing:"1px",fontWeight:600}}>Monthly Sell Through</span>
                    <span style={{fontSize:12,fontWeight:800,color:mstColor}}>{monthlySellThru.toFixed(2)}%</span>
                  </div>
                  <div style={{height:6,background:t.border,borderRadius:3,overflow:"hidden",marginBottom:6}}>
                    <div style={{width:`${Math.min(monthlySellThru/40*100,100)}%`,height:"100%",background:mstColor,borderRadius:3,transition:"width 0.8s ease"}}/>
                  </div>
                  <div style={{fontSize:10,color:mstColor,fontWeight:600}}>
                    {monthlySellThru===0?"Dead Stock":monthlySellThru<10?"Low movement":monthlySellThru<20?"Healthy":"Hot seller"}
                  </div>
                </div>
                </div>
                <div style={{background:t.inputBg,borderRadius:12,padding:"12px 14px",border:`1px solid ${t.borderFaint}`}}>
                  <DRow label="RSP" value={`₹${item.rsp}`} t={t} accent/>
                  {/*<DRow label="Article" value={item.article} t={t}/>
                   <DRow label="Item Name" value={item.itemName} t={t}/> */}
                  <DRow label="Color Option" value={item.colorConcept} t={t}/>
                  {/* <DRow label="Season" value={item.season} t={t}/> 
                  <DRow label="Division" value={item.division} t={t}/>
                  <DRow label="Section" value={item.section} t={t}/>
                  <DRow label="Department" value={item.department} t={t}/>
                  <DRow label="SetBarCount" value={String(item.setBarCount)} t={t}/>
                  <DRow label="SetCode" value={item.setCode} t={t}/>*/}
                </div>
              </div>
            )}
            {tab==="categories"&&<div style={{background:t.inputBg,borderRadius:12,padding:"14px",border:`1px solid ${t.borderFaint}`}}>{[["Cat1",item.cat1],["Cat2",item.cat2],["Cat3",item.cat3],["Cat4",item.cat4],["Cat5",item.cat5],["Cat6",item.cat6]].map(([k,v])=>v&&v!=="-"&&v!==""?<div key={k} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`1px solid ${t.borderFaint}`,alignItems:"flex-start"}}><span style={{fontSize:10,fontWeight:800,color:t.accent,minWidth:36,flexShrink:0}}>{k}</span><span style={{fontSize:11,color:t.text,lineHeight:1.4}}>{v}</span></div>:null)}</div>}
            {tab==="desc"&&<div style={{background:t.inputBg,borderRadius:12,padding:"14px",border:`1px solid ${t.borderFaint}`}}>{[["Desc1",item.desc1],["Desc2",item.desc2],["Desc3",item.desc3],["Desc4",item.desc4],["Desc5",item.desc5],["Desc6",item.desc6]].map(([k,v])=>v&&v!=="-"&&v!==""?<div key={k} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`1px solid ${t.borderFaint}`,alignItems:"flex-start"}}><span style={{fontSize:10,fontWeight:800,color:"#a78bfa",minWidth:42,flexShrink:0}}>{k}</span><span style={{fontSize:11,color:t.text}}>{v}</span></div>:null)}</div>}
          </div>
          <div style={{padding:"12px 20px",borderTop:`1px solid ${t.borderSub}`,display:"flex",gap:8,flexShrink:0}}>
            <CartControls onAdd={(qty)=>onAddToCart?.(item, qty)} cartQty={cartQty} t={t} />
            {showAskAi && <button onClick={()=>{onClose();onAsk?.(item);}} style={{flex:1,padding:"11px",background:t.accent,border:"none",borderRadius:11,color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>✦ Ask AI about this item</button>}
          </div>
        </div>
      </div>
    </div>
  );
}


export function CartControls({ onAdd, cartQty = 0, compact = false, stopPropagation = false, t }) {
  const [qty, setQty] = useState(Math.max(1, Number(cartQty) || 1));
  const [added, setAdded] = useState(false);
  const [prevCartQty, setPrevCartQty] = useState(cartQty);

  if (cartQty !== prevCartQty) {
    setPrevCartQty(cartQty);
    setQty(Math.max(1, Number(cartQty) || 1));
  }

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1300);
    return () => clearTimeout(timer);
  }, [added]);

  const wrap = (fn) => (e) => { if (stopPropagation) e.stopPropagation(); fn(e); };

  const addItem = (e) => {
    if (stopPropagation) e.stopPropagation();
    if ((Number(qty) || 0) <= 0) return;
    onAdd?.(qty);
    setAdded(true);
  };

  const sz = compact
    ? { btn: { width: 22, height: 22, fontSize: 14 }, input: { width: 30, height: 22, fontSize: 10 }, addH: 28, addPad: "0 10px", addFont: 10, radius: 8 }
    : { btn: { width: 28, height: 28, fontSize: 16 }, input: { width: 38, height: 28, fontSize: 12 }, addH: 36, addPad: "0 16px", addFont: 11, radius: 10 };

  return (
    <div style={{ display: "flex", gap: 7, alignItems: "center", flexShrink: 0 }}>
      {/* Qty stepper */}
      <div style={{
        display: "flex", alignItems: "center",
        background: t.inputBg, border: `1px solid ${t.border}`,
        borderRadius: sz.radius, padding: 3, gap: 1,
        transition: "border-color 0.2s",
      }}>
        <button
          onClick={wrap(() => setQty(q => Math.max(1, (Number(q) || 1) - 1)))}
          style={{ ...sz.btn, border: "none", background: "transparent", color: t.textMuted, cursor: "pointer", borderRadius: sz.radius - 2, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
        >−</button>
        <input
          type="number" min="1" value={qty}
          onChange={e => { const v = e.target.value; if (v === "") { setQty(""); return; } setQty(Math.max(1, Math.floor(Number(v)) || 1)); }}
          onBlur={() => setQty(q => Math.max(1, Number(q) || 1))}
          onClick={wrap(() => {})}
          style={{ ...sz.input, border: "none", background: "transparent", color: t.text, fontWeight: 700, textAlign: "center", outline: "none", MozAppearance: "textfield" }}
        />
        <button
          onClick={wrap(() => setQty(q => (Number(q) || 1) + 1))}
          style={{ ...sz.btn, border: "none", background: "transparent", color: t.textMuted, cursor: "pointer", borderRadius: sz.radius - 2, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
        >+</button>
      </div>

      {/* Add / Added button */}
      <button
        onClick={addItem}
        style={{
          height: sz.addH, padding: sz.addPad,
          background: added ? t.accent : t.accentBg,
          border: `1px solid ${added ? t.accent : t.accentBorder}`,
          borderRadius: sz.radius + 1,
          color: added ? "#000" : t.accent,
          fontSize: sz.addFont, fontWeight: 700,
          cursor: "pointer", flexShrink: 0,
          transition: "all 0.2s",
          transform: added ? "scale(1.04)" : "scale(1)",
          whiteSpace: "nowrap",
        }}
      >
        {added ? "✓ Added!" : cartQty > 0 ? `✓ In Cart (${cartQty})` : "+ Add"}
      </button>
    </div>
  );
}

export function ItemCard({ item,metrics, idx, onAsk, onExpand, onAddToCart, cartQty = 0, showAskAi = true, zoomEnabled = true, t }) {
  const [hov,setHov]=useState(false);

  const metric = metrics || {};

  const stColor=(metric.sellThru||0)===0?"#ef4444"
  :(metric.sellThru||0)<10?"#f97316"
  :(metric.sellThru||0)<20?"#10b981"
  :"#3b82f6";

  const mstColor=(metric.monthlySellThru||0)===0?"#ef4444"
  :(metric.monthlySellThru||0)<10?"#f97316"
  :(metric.monthlySellThru||0)<20?"#10b981"
  :"#3b82f6";


   

  const stLabel = (metric.sellThru||0) === 0 ? "⚠️ Dead stock"
    : (metric.sellThru||0) < 10  ? "🔶Slow mover"
    : (metric.sellThru||0) < 20  ? "✅ Healthy" : "🔥Hot seller";

  const mstLabel = (metric.monthlySellThru||0) === 0 ? "⚠️ Dead stock"
    : (metric.monthlySellThru||0) < 10  ? "🔶Slow mover"
    : (metric.monthlySellThru||0) < 20  ? "✅ Healthy" : "🔥Hot seller";

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{background:hov?t.bgCardHov:t.bgCard,border:`1px solid ${hov?t.accentBorder:t.border}`,borderRadius:16,overflow:"hidden",transition:"all 0.3s cubic-bezier(.34,1.4,.64,1)",transform:hov?"translateY(-5px) scale(1.01)":"none",boxShadow:hov?`0 20px 50px rgba(0,0,0,0.3),0 0 0 1px ${t.accentGlow}`:"0 2px 12px rgba(0,0,0,0.15)",animation:`cardIn 0.5s ease ${Math.min(idx,20)*0.04}s both`}}>
     
     
     {/* ── Image carousel ── */}
      <Carousel item={item} height={220} fit="cover" 
      showDots={true} showArrows={true} showCounter={true} 
      showExpand={true} onExpand={()=>onExpand(item)} zoomEnabled={zoomEnabled} t={t}/>
     
     <div style={
      { background: "rgba(0,0,0,0.15)", 
        padding: "6px 12px", 
        display: "flex", 
        justifyContent: "space-between", 
        borderBottom: `1px solid ${t.borderFaint}` }}>
  {[
    ["RSP",   `₹${item.rsp}`,      t.accent],
    ["YTD",  metric.saleQty,        t.text],
    // ["GRC",   { qty: item.grcqty }, t.text],
    ["STR STK", item.storeStockQty,  t.text],   // ← was "Store STK"
    ["WH STK",    item.whStockQty,     t.text],   // ← was "WH STK"
  ].map(([k, v, c]) => (
    <div key={k} style={{ textAlign: "center" }}>
      <div style={{ fontSize: 8, color: t.textMuted, letterSpacing: "1px", textTransform: "uppercase" }}>{k}</div>
      {k === "GRC"
        ? <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{v.qty}</div>
        : <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</div>
      }
    </div>
  ))}

  {/* GM — colour-coded badge */}
  {(() => {
    const gm = Number(metric.gmpercent) || 0;
    const [bg, border, color] =
      gm >= 25 ? ["rgba(16,185,129,0.12)", "rgba(16,185,129,0.22)", "#10b981"]
    : gm >= 15 ? ["rgba(59,130,246,0.12)",  "rgba(59,130,246,0.22)",  "#60a5fa"]
    : gm >= 1  ? ["rgba(249,115,22,0.12)",  "rgba(249,115,22,0.22)",  "#f97316"]
    :             ["rgba(239,68,68,0.12)",   "rgba(239,68,68,0.22)",   "#ef4444"];
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 8, fontFamily: "'DM Sans','Segoe UI',sans-serif", color: t.textMuted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>GM</div>
        <span style={{ fontSize: 11, fontFamily: "'DM Sans','Segoe UI',sans-serif", fontWeight: 700, padding: "1px 6px", borderRadius: 5, background: bg, border: `1px solid ${border}`, color, display: "inline-block", lineHeight: 1.6 }}>
          {gm}%
        </span>
      </div>
    );
  })()}
</div>
      <div style={{padding:"10px 12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div><div style={{fontSize:12,fontWeight:700,color:t.accent}}>{item.id}</div>
          <div style={{fontSize:9,color:t.textMuted,marginTop:1}}>{item.itemName}</div>
          </div>
          <span style={{fontSize:8,padding:"2px 6px",borderRadius:20,background:t.accentBg,border:`1px solid ${t.accentBorder}`,color:t.accent,fontWeight:600}}>{item.season}</span>
        </div>
      
      <div style={{marginBottom:8}}>

  {/* HEADER */}
  <div style={{
    display:"flex",
    justifyContent:"space-between",
    alignItems:"center",
    marginBottom:4
  }}>
    <span style={{
      fontSize:9,
      color:t.textMuted,
      textTransform:"uppercase",
      letterSpacing:"0.5px"
    }}>
       <span style={{color:stColor}}>
      WST {(metric.sellThru||0).toFixed(1)}% 
      </span>
      <span style={{color:  stColor}}>  {stLabel}</span>
    </span>

    <span style={{fontSize:9,fontWeight:700}}>
     
      
      <span style={{color:mstColor}}>
        MST {(metric.monthlySellThru||0).toFixed(1)}% 
      </span>

      <span style={{color:mstColor}}> {mstLabel}</span>
    </span>
  </div>

  {/* BARS */}
  <div style={{
    display:"flex",
    gap:4
  }}>
    {/* Weekly */}
    <div style={{
      flex:1,
      height:3,
      background:t.border,
      borderRadius:2,
      overflow:"hidden"
    }}>
      <div style={{
        width:`${Math.min((metric.sellThru||0)/40*50,100)}%`,
        height:"100%",
        background:stColor
      }}/>
    </div>

    {/* Monthly */}
    <div style={{
      flex:1,
      height:3,
      background:t.border,
      borderRadius:2,
      overflow:"hidden"
    }}>
      <div style={{
        width:`${Math.min((metric.monthlySellThru||0)/40*50,100)}%`,
        height:"100%",
        background:stColor
      }}/>
    </div>
  </div>

</div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <CartControls onAdd={(qty)=>onAddToCart?.(item, qty)} cartQty={cartQty} compact t={t} />
          {showAskAi && <button onClick={()=>onAsk?.(item)} style={{flex:1,padding:"6px",background:t.accentBg,border:`1px solid ${t.accentBorder}`,borderRadius:8,color:t.accent,fontSize:10,fontWeight:600,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=t.accentHov} onMouseLeave={e=>e.currentTarget.style.background=t.accentBg}>✦ Ask AI</button>}
          <button onClick={()=>onExpand(item)} style={{padding:"6px 10px",background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:8,color:t.textMuted,fontSize:10,cursor:"pointer"}}>⤢</button>
        </div>
      </div>
    </div>
  );
}

const buildIntroMessage = (item, metric) => ({role:"assistant",text:`Analyzing **${item.id}**\n ${item.article}
      📊 Sale: ${item.saleQty} | Store Stk: ${item.storeStockQty} | WH Stk: ${item.whStockQty}
      💰 RSP: ₹${item.rsp} | Sell Thru: ${(metric.sellThru||0).toFixed(2)}%
      🏷 ${item.division} · ${item.section} · ${item.department}\n\nWhat would you like to know?`});

export function AIPanel({ item,metrics, onClose, t }) {
  const metric = metrics || {};
  const [messages,setMessages]=useState(() => [buildIntroMessage(item, metric)]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [open,setOpen]=useState(false);
  const endRef=useRef(null);
  const [prevItem, setPrevItem] = useState(item);

  if (item !== prevItem) {
    setPrevItem(item);
    setMessages([buildIntroMessage(item, metric)]);
  }

  useEffect(()=>{
    setTimeout(()=>setOpen(true),10);
  },[item]);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const send = async () => {
    if(!input.trim()||loading) return;
    const msg=input.trim(); setInput(""); setLoading(true);
    setMessages(m=>[...m,{role:"user",text:msg}]);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,
        system:`Fashion retail analyst. Item: ${item.id}, ${item.season}, ${item.division}, RSP:${item.rsp}, Sale:${item.saleQty}, Store:${item.storeStockQty}, 
        ST:${metric.sellThru}%, Article:${item.article}, Cat1:${item.cat1}, Desc1:${item.desc1}, Desc2:${item.desc2}. Be concise, use emojis, give actionable advice.`,messages:[...messages.map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text})),{role:"user",content:msg}]})});
      const data=await res.json();
      setMessages(m=>[...m,{role:"assistant",text:data.content?.[0]?.text||"No response."}]);
    } catch {
      setMessages(m=>[...m,{role:"assistant",text:"âš ï¸ Error connecting."}]);
    }
    setLoading(false);
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"flex-end",padding:24,background:"rgba(0,0,0,0.4)"}}>
      <div style={{width:420,height:580,background:t.bgAlt,border:`1px solid ${t.accentBorder}`,borderRadius:20,display:"flex",flexDirection:"column",overflow:"hidden",transform:open?"translateY(0)":"translateY(30px)",opacity:open?1:0,transition:"all 0.35s cubic-bezier(.34,1.4,.64,1)",boxShadow:"0 40px 100px rgba(0,0,0,0.5)"}}>
        <div style={{padding:"14px 18px",borderBottom:`1px solid ${t.borderSub}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:t.accentBg}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:10,background:t.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#000"}}>✦</div>
            <div><div style={{fontSize:13,fontWeight:700,color:t.accent}}>AI Assistant</div>
            <div style={{fontSize:10,color:t.textMuted}}>{item.id}</div></div>
          </div>
          <button onClick={onClose} style={{background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:8,color:t.textSub,width:28,height:28,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 18px",display:"flex",flexDirection:"column",gap:12}}>
          {messages.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?t.accent:t.inputBg,border:m.role==="user"?"none":`1px solid ${t.border}`,color:m.role==="user"?"#000":t.text,fontSize:12,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.text}</div></div>)}
          {loading&&<div style={{display:"flex",gap:5,padding:"10px 14px"}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:t.accent,animation:`bounce 1s ${i*0.15}s infinite`}}/>)}</div>}
          <div ref={endRef}/>
        </div>
        <div style={{padding:"12px 16px",borderTop:`1px solid ${t.borderSub}`,display:"flex",gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} 
          onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about this item..." style={{flex:1,padding:"9px 14px",background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:10,color:t.text,fontSize:12,outline:"none"}}/>
          <button onClick={send} disabled={loading} style={{padding:"9px 16px",background:t.accent,border:"none",borderRadius:10,color:"#000",fontWeight:700,fontSize:12,cursor:"pointer",opacity:loading?0.6:1}}>✕</button>
        </div>
      </div>
    </div>
  );
}

export function ListRow({ item,metrics, idx, onOpen, onAsk, onAddToCart, cartQty = 0, showAskAi = true, zoomEnabled = true, t }) {
  const metric = metrics || {};
  const stC=(metric.sellThru||0)===0?"#ef4444"
  :(metric.sellThru||0)<10?"#f97316"
  :(metric.sellThru||0)<20?"#10b981":"#3b82f6";
  return(
    <div onClick={()=>onOpen(item)} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:t.statBg,border:`1px solid ${t.border}`,borderRadius:12,cursor:"pointer",animation:`cardIn 0.4s ease ${Math.min(idx,20)*0.03}s both`}}>
      <div style={{width:60,height:90,borderRadius:10,overflow:"hidden",flexShrink:0,border:`1px solid ${t.border}`,background:"rgba(0,0,0,0.2)"}}>
        <SingleImage itemId={item.id} color={item.color} imageUrl={item.imageUrl} fit="cover" zoomEnabled={zoomEnabled}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:t.accent}}>{item.id}</div>
        <div style={{fontSize:9,color:t.textFaint}}>{item.division} · {item.section} · {item.season}</div>
      </div>
      <div style={{textAlign:"center",minWidth:50}}><div style={{fontSize:9,color:t.textFaint,marginBottom:2}}>RSP</div><div style={{fontWeight:700,color:t.accent}}>{item.rsp}</div></div>
      {[["Sale",item.saleQty],["Store",item.storeStockQty]].map(([k,v])=><div key={k} style={{textAlign:"center",minWidth:48}}><div style={{fontSize:9,color:t.textMuted,textTransform:"uppercase",letterSpacing:"1px"}}>{k}</div><div style={{fontSize:13,fontWeight:700,color:t.text}}>{v}</div></div>)}
      <div style={{minWidth:90}}>
        <div style={{fontSize:9,color:t.textMuted,marginBottom:3}}>Sell Thru</div>
        <div style={{height:4,background:t.border,borderRadius:2,overflow:"hidden",marginBottom:2}}>
          <div style={{width:`${Math.min((metric.sellThru||0)/40*100,100)}%`,height:"100%",background:stC,borderRadius:2}}/></div>
        <div style={{fontSize:10,fontWeight:700,color:stC}}>{(metric.sellThru||0).toFixed(1)}%</div>
      </div>
      <CartControls onAdd={(qty)=>onAddToCart?.(item, qty)} cartQty={cartQty} compact stopPropagation t={t} />
      {showAskAi && <button onClick={e=>{e.stopPropagation();onAsk?.(item);}} style={{padding:"6px 12px",background:t.accentBg,border:`1px solid ${t.accentBorder}`,borderRadius:8,color:t.accent,fontSize:10,cursor:"pointer",fontWeight:600,flexShrink:0}}>✕ AI</button>}
    </div>
  );
}
