import { useEffect, useRef, useState } from "react";
import Drift from "drift-zoom";
import "drift-zoom/dist/drift-basic.min.css";
import { API_BASE, IMAGE_BASE } from "./constants";
import { CheckList, DRow, Spinner, StatBox } from "./basic-ui";

const DRIFT_ZOOM_FACTOR = 2.5;
const DRIFT_PANE_SIZE = 400;
const DRIFT_PANE_OFFSET_X = 154;


function useDriftZoom(triggerRef, paneRef, zoomSrc, enabled = true) {
  useEffect(() => {
    if (!enabled || !zoomSrc || !triggerRef.current) return undefined;
    if (window.matchMedia?.("(pointer: coarse)").matches) return undefined;

    const drift = new Drift(triggerRef.current, {
      namespace: "catalog-drift",
      paneContainer: document.body,
      inlinePane: false,
      hoverBoundingBox: true,
      handleTouch: false,
      zoomFactor: DRIFT_ZOOM_FACTOR,
      injectBaseStyles: true,
    });

    return () => drift.destroy();
  }, [enabled, triggerRef, paneRef, zoomSrc]);
}

function ZoomImage({ src, alt, fit = "cover", style = {}, onLoad, onError, enabled = true }) {
  const paneRef = useRef(null);
  const imgRef = useRef(null);

  useDriftZoom(imgRef, paneRef, src, enabled);

  return (
    <div ref={paneRef} className="catalog-zoom-pane" style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <style>{`.drift-zoom-pane.catalog-drift-zoom-pane{z-index:2000!important;width:${DRIFT_PANE_SIZE}px!important;height:${DRIFT_PANE_SIZE}px!important;margin-left:${DRIFT_PANE_OFFSET_X}px!important;border-radius:18px;border:1px solid rgba(255,255,255,0.14);box-shadow:0 24px 60px rgba(0,0,0,0.45)}.drift-bounding-box.catalog-drift-bounding-box{z-index:2001!important}`}</style>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        data-zoom={src}
        loading="lazy"
        decoding="async"
        onLoad={onLoad}
        onError={onError}
        style={{ width: "100%", height: "100%", objectFit: fit, display: "block", ...style }}
      />
    </div>
  );
}

export function FilterPanel({
  rspFrom, rspTo,
  seasonList = [], seasons,
  divisionList, divisions,
  sectionList,sections,
  departmentList,departments,
  articleNameList = [],
  articleName = "",
  brandList, brands,
  cat2List, cat3List, cat4List, cat5List, cat6List,
  cat2, cat3, cat4, cat5, cat6,
  desc1List, desc2List, desc3List, desc4List, desc5List, desc6List,
  desc1, desc2, desc3, desc4, desc5, desc6,
  catLoading,
  loadTabData,
  onApply,
  onClose,
  t,
  visibleTabs = null,
  presentation = "modal",
}) {
  const [draftDivisions, setDraftDivisions] = useState(() => [...(divisions || [])]);
  const [draftSeasons, setDraftSeasons] = useState(() => [...(seasons || [])]);
  const [draftSections, setDraftSections] = useState(() => [...(sections || [])]);
  const [draftDepartments, setDraftDepartments] = useState(() => [...(departments || [])]);
  const [draftArticleNames, setDraftArticleNames] = useState(() => articleName ? [articleName] : []);
  const [draftRspFrom, setDraftRspFrom] = useState(() => rspFrom || "");
  const [draftRspTo, setDraftRspTo] = useState(() => rspTo || "");
  const [draftBrands, setDraftBrands] = useState(() => [...(brands || [])]);
  const [draftCat2, setDraftCat2] = useState(() => [...(cat2 || [])]);
  const [draftCat3, setDraftCat3] = useState(() => [...(cat3 || [])]);
  const [draftCat4, setDraftCat4] = useState(() => [...(cat4 || [])]);
  const [draftCat5, setDraftCat5] = useState(() => [...(cat5 || [])]);
  const [draftCat6, setDraftCat6] = useState(() => [...(cat6 || [])]);
  const [draftDesc1, setDraftDesc1] = useState(() => [...(desc1 || [])]);
  const [draftDesc2, setDraftDesc2] = useState(() => [...(desc2 || [])]);
  const [draftDesc3, setDraftDesc3] = useState(() => [...(desc3 || [])]);
  const [draftDesc4, setDraftDesc4] = useState(() => [...(desc4 || [])]);
  const [draftDesc5, setDraftDesc5] = useState(() => [...(desc5 || [])]);
  const [draftDesc6, setDraftDesc6] = useState(() => [...(desc6 || [])]);
  const [activeTab, setActiveTab] = useState(
  visibleTabs?.[0] || "division"
);
  const [search, setSearch] = useState("");
  const [dbSearching, setDbSearching] = useState(false);
  const [dbResults, setDbResults] = useState(null);
  const [dbSearchTerm, setDbSearchTerm] = useState("");
  const prevTabRef = useRef(activeTab);

  // Keep draft copies in sync whenever the applied filters change externally.
  const [prevSeasons, setPrevSeasons] = useState(seasons);
  const [prevDivisions, setPrevDivisions] = useState(divisions);
  const [prevSections, setPrevSections] = useState(sections);
  const [prevDepartments, setPrevDepartments] = useState(departments);
  const [prevRspFrom, setPrevRspFrom] = useState(rspFrom);
  const [prevRspTo, setPrevRspTo] = useState(rspTo);

  if (seasons !== prevSeasons) { setPrevSeasons(seasons); setDraftSeasons([...(seasons || [])]); }
  if (divisions !== prevDivisions) { setPrevDivisions(divisions); setDraftDivisions([...(divisions || [])]); }
  if (sections !== prevSections) { setPrevSections(sections); setDraftSections([...(sections || [])]); }
  if (departments !== prevDepartments) { setPrevDepartments(departments); setDraftDepartments([...(departments || [])]); }
  if (rspFrom !== prevRspFrom) { setPrevRspFrom(rspFrom); setDraftRspFrom(rspFrom ?? ""); }
  if (rspTo !== prevRspTo) { setPrevRspTo(rspTo); setDraftRspTo(rspTo ?? ""); }

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const toggleDraft = (setter, val) => setter(p => p.includes(val) ? p.filter(x => x !== val) : [...p, val]);
  const resetDbSearch = () => { setDbResults(null); setDbSearchTerm(""); };

  const allTabs = [
    
    { key:"season", label:"Season", list:seasonList, selected:draftSeasons, onToggle:v=>toggleDraft(setDraftSeasons,v), onClear:()=>setDraftSeasons([]) },
    { key:"articlename", label:"Article", list:articleNameList, selected:draftArticleNames, onToggle:v=>toggleDraft(setDraftArticleNames,v), onClear:()=>setDraftArticleNames([]) },
    { key:"division", label:"📦 Division", list:divisionList, selected:draftDivisions, onToggle:v=>toggleDraft(setDraftDivisions,v), onClear:()=>setDraftDivisions([]) },
    { key:"section", label:"🧩 Section", list:sectionList, selected:draftSections, onToggle:v=>toggleDraft(setDraftSections,v), onClear:()=>setDraftSections([]) },
    { key:"department", label:"🏢 Department", list:departmentList, selected:draftDepartments, onToggle:v=>toggleDraft(setDraftDepartments,v), onClear:()=>setDraftDepartments([]) },
    { key:"brands", label:"🏷 Cat1", list:brandList, selected:draftBrands, onToggle:v=>toggleDraft(setDraftBrands,v), onClear:()=>setDraftBrands([]) },
    { key:"cat2", label:"◈ Cat 2", list:cat2List, selected:draftCat2, onToggle:v=>toggleDraft(setDraftCat2,v), onClear:()=>setDraftCat2([]) },
    { key:"cat3", label:"◈ Cat 3", list:cat3List, selected:draftCat3, onToggle:v=>toggleDraft(setDraftCat3,v), onClear:()=>setDraftCat3([]) },
    { key:"cat4", label:"◈ Cat 4", list:cat4List, selected:draftCat4, onToggle:v=>toggleDraft(setDraftCat4,v), onClear:()=>setDraftCat4([]) },
    { key:"cat5", label:"◈ Cat 5", list:cat5List, selected:draftCat5, onToggle:v=>toggleDraft(setDraftCat5,v), onClear:()=>setDraftCat5([]) },
    { key:"cat6", label:"◈ Cat 6", list:cat6List, selected:draftCat6, onToggle:v=>toggleDraft(setDraftCat6,v), onClear:()=>setDraftCat6([]) },
    { key:"desc1", label:"📝 Desc 1", list:desc1List, selected:draftDesc1, onToggle:v=>toggleDraft(setDraftDesc1,v), onClear:()=>setDraftDesc1([]) },
    { key:"desc2", label:"📝 Desc 2", list:desc2List, selected:draftDesc2, onToggle:v=>toggleDraft(setDraftDesc2,v), onClear:()=>setDraftDesc2([]) },
    { key:"desc3", label:"📝 Desc 3", list:desc3List, selected:draftDesc3, onToggle:v=>toggleDraft(setDraftDesc3,v), onClear:()=>setDraftDesc3([]) },
    { key:"desc4", label:"📝 Desc 4", list:desc4List, selected:draftDesc4, onToggle:v=>toggleDraft(setDraftDesc4,v), onClear:()=>setDraftDesc4([]) },
    { key:"desc5", label:"📝 Desc 5", list:desc5List, selected:draftDesc5, onToggle:v=>toggleDraft(setDraftDesc5,v), onClear:()=>setDraftDesc5([]) },
    { key:"desc6", label:"📝 Desc 6", list:desc6List, selected:draftDesc6, onToggle:v=>toggleDraft(setDraftDesc6,v), onClear:()=>setDraftDesc6([]) },
  ];

  // ✅ APPLY FILTER HERE
const tabs = visibleTabs
  ? visibleTabs.map(key => allTabs.find(t => t.key === key)).filter(Boolean)
  : allTabs;
  
  const switchTab = (key) => {
    if (prevTabRef.current !== key) {
      prevTabRef.current = key;
      resetDbSearch();
      setSearch("");
    }
    setActiveTab(key);
    if (key !== "division" && loadTabData) {
      setTimeout(() => {
        loadTabData(key, {
          divisions:draftDivisions,
          sections: draftSections,
          departments: draftDepartments,
          articlenames: draftArticleNames,
          brands: draftBrands,
          cat2: draftCat2,
          cat3: draftCat3,
          cat4: draftCat4,
          cat5: draftCat5,
          cat6: draftCat6,
        });
      }, 0);
    }
  };

  const tab = tabs.find(tb => tb.key === activeTab) || tabs[0];
  const isArticleTab = false;
  const isCatTab = activeTab !== "division";
  const safeList = Array.isArray(tab.list) ? tab.list : [];
  const localFiltered = search
    ? safeList.filter(v => typeof v==="string" && v.toLowerCase().includes(search.toLowerCase()))
    : safeList;

  const endpointMap = {
    season:"GetSeasonHO",
    section:"GetSection",
    department:"GetDepartment",
    articlename:"GetArticleName",
    brands:"GetBrands",
    cat2:"GetCat2", cat3:"GetCat3", cat4:"GetCat4", cat5:"GetCat5", cat6:"GetCat6",
    desc1:"GetDesc1", desc2:"GetDesc2", desc3:"GetDesc3", desc4:"GetDesc4", desc5:"GetDesc5", desc6:"GetDesc6",
  };

  const handleDbSearch = async () => {
    if (!search.trim() || dbSearching) return;
    setDbSearching(true);
    setDbResults(null);
    try {
      const res = await fetch(`${API_BASE}/${endpointMap[activeTab]}?search=${encodeURIComponent(search.trim())}`);
      const data = await res.json();
      const toFlat = (d) => {
        if (!d) return [];
        if (Array.isArray(d)) {
          if (d.length === 0 || typeof d[0] === "string") return d;
          if (typeof d[0] === "object") {
            const keys = ["value","Value","name","Name","text","Text","label","Label","cat","Cat","id","Id"];
            const key = keys.find(k => d[0][k] !== undefined) || Object.keys(d[0])[0];
            return d.map(o => String(o[key])).filter(Boolean);
          }
        }
        const inner = d.data||d.items||d.Items||d.result||d.Result||d.values||d.Values;
        return inner ? toFlat(inner) : [];
      };
      const flat = toFlat(data);
      const localMatches = safeList.filter(v => v.toLowerCase().includes(search.toLowerCase()));
      const dbOnly = flat.filter(v => !safeList.includes(v));
      setDbResults([...localMatches, ...dbOnly]);
      setDbSearchTerm(search.trim());
    } catch {
      setDbResults([]);
      setDbSearchTerm(search.trim());
    }
    setDbSearching(false);
  };

  const arraysEqual = (a = [], b = []) => a.length === b.length && a.every(v => b.includes(v));
  const hasChanges =
    !arraysEqual(draftDivisions, divisions) ||
    !arraysEqual(draftSeasons, seasons) ||
    !arraysEqual(draftSections, sections) ||
    !arraysEqual(draftDepartments, departments) ||
    !arraysEqual(draftArticleNames, articleName ? [articleName] : []) ||
    draftRspFrom !== (rspFrom || "") ||
    draftRspTo !== (rspTo || "") ||
    !arraysEqual(draftBrands, brands) ||
    !arraysEqual(draftCat2, cat2) || !arraysEqual(draftCat3, cat3) || !arraysEqual(draftCat4, cat4) ||
    !arraysEqual(draftCat5, cat5) || !arraysEqual(draftCat6, cat6) ||
    !arraysEqual(draftDesc1, desc1) || !arraysEqual(draftDesc2, desc2) || !arraysEqual(draftDesc3, desc3) ||
    !arraysEqual(draftDesc4, desc4) || !arraysEqual(draftDesc5, desc5) || !arraysEqual(draftDesc6, desc6);

  const totalDraft =
   draftDivisions.length + draftSeasons.length + draftSections.length + draftDepartments.length 
   + (draftArticleNames.length) + draftBrands.length + draftCat2.length + draftCat3.length + draftCat4.length + draftCat5.length + draftCat6.length +
    draftDesc1.length + draftDesc2.length + draftDesc3.length + draftDesc4.length + draftDesc5.length + draftDesc6.length;

  const showCatLoader = catLoading && isCatTab;
  const showDbSpinner = !showCatLoader && dbSearching;
  const showDbPrompt = !showCatLoader && !dbSearching && isCatTab && search.trim() && localFiltered.length===0 && dbResults===null;
  const showNotFound = !showCatLoader && !dbSearching && isCatTab && dbResults !== null && dbResults.length===0;
  const listItems = dbResults !== null && dbResults.length > 0 ? dbResults : localFiltered.length < safeList.length ? localFiltered : safeList;

  const handleApply = () => {
    if (!hasChanges) {
      onClose();
      return;
    }
    onApply({
      divisions: draftDivisions,   // ✅ ADD THIS
      seasons: draftSeasons,
      sections: draftSections,   // ✅ ADD THIS
      departments: draftDepartments,
      articleName: draftArticleNames[0] || "",
      articlenames: draftArticleNames,
      brands: draftBrands,
      cat2: draftCat2, 
      cat3: draftCat3, 
      cat4: draftCat4, 
      cat5: draftCat5, 
      cat6: draftCat6,
      desc1: draftDesc1, 
      desc2: draftDesc2, 
      desc3: draftDesc3, 
      desc4: draftDesc4, desc5: draftDesc5, desc6: draftDesc6,
      rspFrom: draftRspFrom,
      rspTo: draftRspTo,
    });
    onClose();
  };

  const isDrawer = presentation === "drawer";
  const panelStyle = isDrawer
    ? {
        position: "fixed",
        top: 0,
        right: 0,
        width: "min(440px, calc(100vw - 16px))",
        height: "100vh",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        background: t.bgAlt,
        borderLeft: `1px solid ${t.accentBorder}`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        overflow: "hidden",
        animation: "slideInRight 0.24s cubic-bezier(.22,1,.36,1)",
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: "min(1100px,calc(100vw - 32px))",
        maxHeight: "88vh",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        background: t.bgAlt,
        border: `1px solid ${t.accentBorder}`,
        borderRadius: 18,
        boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
        overflow: "hidden",
        animation: "fadeIn 0.18s ease",
      };

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:998,background:"rgba(0,0,0,0.55)",animation:"fadeIn 0.15s ease"}}/>
      <div id="filter-panel" style={panelStyle}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px 0",flexShrink:0}}>


        {/* 🔥 RSP RANGE FILTER */}
<div style={{
  padding: "10px 16px",
  borderBottom: `1px solid ${t.borderSub}`,
  display: "flex",
  flexDirection: "column",
  gap: 6
}}>


 <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:14,fontWeight:800,color:t.text}}>Filters</span>
            {totalDraft>0&&<span style={{fontSize:10,fontWeight:700,background:t.accent,color:"#000",borderRadius:20,padding:"2px 9px"}}>{totalDraft} selected</span>}
            {hasChanges&&<span style={{fontSize:10,color:"#fb923c",fontWeight:600}}>● unsaved</span>}
          </div>

  {/* //---------------------------------------------- */}
  <div style={{ fontSize: 11, fontWeight: 700, color: t.text }}>
    💰 Price Range
  </div>

  <div style={{ display: "flex", gap: 8 }}>
    <input
      type="number"
      placeholder="Min"
      value={draftRspFrom}
      onChange={(e) => {
  setDraftRspFrom(e.target.value);
}}
      style={{
        flex: 1,
        padding: 6,
        borderRadius: 6,
        border: `1px solid ${t.border}`,
        background: t.inputBg,
        color: t.text,
        fontSize: 11
      }}
    />

    <input
      type="number"
      placeholder="Max"
      value={draftRspTo}
      onChange={(e) => {
  setDraftRspTo(e.target.value);
}}
      style={{
        flex: 1,
        padding: 6,
        borderRadius: 6,
        border: `1px solid ${t.border}`,
        background: t.inputBg,
        color: t.text,
        fontSize: 11
      }}
    />
  </div>
</div>
{/* //---------------------------------------------- */}

         
          <button onClick={onClose} style={{background:t.inputBg,border:`1px solid ${t.border}`,borderRadius:8,color:t.textSub,width:30,height:30,cursor:"pointer",fontSize:16}}>✕</button>
        </div>
        <div style={{display:"flex",gap:4,padding:"10px 18px 0",borderBottom:`1px solid ${t.borderSub}`,flexShrink:0,overflowX:"auto",overflowY:"hidden",scrollbarWidth:"thin"}}>
          {tabs.map(tb => {
            const isActive = tb.key === activeTab;
            const isDisabled = catLoading && tb.key !== "brands" && tb.key !== "articlename";
            return (
              <button key={tb.key} onClick={()=>!isDisabled&&switchTab(tb.key)} style={{padding:"8px 16px",borderRadius:"9px 9px 0 0",border:`1px solid ${isActive?t.accentBorder:t.borderFaint}`,borderBottom:isActive?`2px solid ${t.accent}`:"none",background:isActive?t.accentBg:t.inputBg,color:isDisabled?t.textFaint:isActive?t.accent:t.textMuted,fontSize:11,fontWeight:isActive?700:500,cursor:isDisabled?"not-allowed":"pointer",opacity:isDisabled?0.5:1,transition:"all 0.15s",display:"flex",alignItems:"center",gap:6,flexShrink:0,whiteSpace:"nowrap"}}>
                {tb.label}
                {catLoading && tb.key!=="brands" ? <span style={{fontSize:9,color:t.accent}}>⟳</span> : tb.selected.length>0 ? <span style={{fontSize:9,fontWeight:800,background:t.accent,color:"#000",borderRadius:20,padding:"1px 6px"}}>{tb.selected.length}</span> : null}
              </button>
            );
          })}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:`1px solid ${t.borderSub}`,flexShrink:0}}>
          <div style={{position:"relative",flex:1,maxWidth:340}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:t.textFaint,fontSize:14,pointerEvents:"none"}}>⌕</span>
            <input autoFocus value={search} 
            onChange={e=>{ setSearch(e.target.value); 
            if(dbResults!==null) resetDbSearch(); }} onKeyDown={e=>{ if(e.key==="Enter"&&isCatTab&&localFiltered.length===0&&search.trim()) handleDbSearch(); }} placeholder={`Search ${tab.label.replace(/◈|🏷/g,"").trim()}…`} style={{width:"100%",padding:"8px 10px 8px 30px",background:t.inputBg,border:`1px solid ${t.accentBorder}`,borderRadius:8,color:t.text,fontSize:12,outline:"none"}}/>
          </div>
          {isCatTab && search.trim() && localFiltered.length===0 && dbResults===null && !dbSearching && <button onClick={handleDbSearch} style={{fontSize:11,fontWeight:700,padding:"7px 14px",borderRadius:8,cursor:"pointer",background:t.accentBg,border:`1px solid ${t.accentBorder}`,color:t.accent,whiteSpace:"nowrap"}}>🔍 Search DB</button>}
          <span style={{fontSize:11,color:t.textMuted,whiteSpace:"nowrap"}}>{dbResults!==null ? `${dbResults.length} found in DB` : `${localFiltered.length} items`}</span>
          {tab.selected.length>0&&<button onClick={tab.onClear} style={{fontSize:11,color:"#ef4444",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"}}>✕ Clear {tab.selected.length}</button>}
        </div>




        {tab.selected.length>0&&(
          <div style={{padding:"8px 16px",borderBottom:`1px solid ${t.borderFaint}`,display:"flex",flexWrap:"wrap",gap:5,maxHeight:68,overflowY:"auto",flexShrink:0}}>
            {tab.selected.map(v=><span key={v} onClick={()=>tab.onToggle(v)} style={{fontSize:10,padding:"3px 10px",borderRadius:20,background:t.accentBg,border:`1px solid ${t.accentBorder}`,color:t.accent,cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>{v} <span style={{opacity:0.7}}>✕</span></span>)}
          </div>
        )}
        <div style={{flex:"1 1 auto",minHeight:180,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {!isArticleTab && (showCatLoader ? <Spinner t={t} label="Loading categories…"/> : showDbSpinner ? <Spinner t={t} label={`Searching database for "${search}"…`}/> : showDbPrompt ? (
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,color:t.textMuted}}>
              <span style={{fontSize:28}}>🔍</span>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:12,fontWeight:600,color:t.text,marginBottom:4}}>"{search}" not in loaded list</div>
                <div style={{fontSize:11,color:t.textMuted,marginBottom:14}}>Search the full database?</div>
                <button onClick={handleDbSearch} style={{padding:"8px 24px",background:t.accent,border:"none",borderRadius:9,color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>Search Database</button>
              </div>
            </div>
          ) : showNotFound ? (
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,color:t.textMuted}}>
              <span style={{fontSize:32}}>◈</span>
              <div style={{fontSize:13,fontWeight:700,color:t.textSub}}>Not Found</div>
              <div style={{fontSize:11,color:t.textFaint,textAlign:"center"}}>"<b style={{color:t.text}}>{dbSearchTerm}</b>" does not exist in {tab.label.replace(/◈/g,"").trim()}</div>
              <button onClick={resetDbSearch} style={{marginTop:4,fontSize:11,color:t.accent,background:t.accentBg,border:`1px solid ${t.accentBorder}`,borderRadius:7,padding:"5px 14px",cursor:"pointer"}}>← Back to list</button>
            </div>
          ) : <CheckList items={listItems} selected={tab.selected} onToggle={tab.onToggle} search={dbResults!==null?"":search} t={t} />)}
        </div>
        <div style={{padding:"12px 18px",borderTop:`1px solid ${t.borderSub}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {[
              {label:"Division",count:draftDivisions.length,color:t.accent},
              {label:"Season",count:draftSeasons.length,color:t.accent},
              {label:"Section",count:draftSections.length,color:t.accent},
              {label:"Department",count:draftDepartments.length,color:t.accent},
              {label:"Article",count:draftArticleNames.length,color:t.accent},
              {label:"Brands",count:draftBrands.length,color:t.accent},
              {label:"Cat2",count:draftCat2.length,color:"#fb923c"},{label:"Cat3",count:draftCat3.length,color:"#facc15"},{label:"Cat4",count:draftCat4.length,color:"#f472b6"},{label:"Cat5",count:draftCat5.length,color:"#34d399"},{label:"Cat6",count:draftCat6.length,color:"#38bdf8"},
              {label:"Desc1",count:draftDesc1.length,color:"#a78bfa"},{label:"Desc2",count:draftDesc2.length,color:"#c084fc"},{label:"Desc3",count:draftDesc3.length,color:"#e879f9"},{label:"Desc4",count:draftDesc4.length,color:"#f43f5e"},{label:"Desc5",count:draftDesc5.length,color:"#fb7185"},{label:"Desc6",count:draftDesc6.length,color:"#fda4af"},
            ].filter(x=>x.count>0).map(x=><span key={x.label} style={{fontSize:10,color:x.color,fontWeight:700,padding:"2px 10px",borderRadius:20,background:`${x.color}18`,border:`1px solid ${x.color}44`}}>{x.label}: {x.count}</span>)}
            {totalDraft===0&&<span style={{fontSize:11,color:t.textFaint}}>No filters selected</span>}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onClose} style={{padding:"8px 18px",background:"transparent",border:`1px solid ${t.border}`,borderRadius:9,color:t.textMuted,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button>
            <button onClick={handleApply} style={{padding:"8px 28px",background:hasChanges?t.accent:t.accentBg,border:`1px solid ${t.accentBorder}`,borderRadius:9,color:hasChanges?"#000":t.accent,fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:hasChanges?`0 4px 14px ${t.accentGlow}`:"none",transition:"all 0.2s"}}>
              {hasChanges?"✓ Apply & Close":"Close"}</button>
          </div>
        </div>
      </div>
    </>
  );
}

export function FabricSwatch({ color, size=80 }) {
  const c=color||"#888";
  const id=c.replace('#','sv');
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{display:"block"}}>
      <defs>
        <pattern id={`w${id}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill={c}/>
          <rect x="0" y="0" width="3" height="3" fill="rgba(0,0,0,0.12)"/>
          <rect x="3" y="3" width="3" height="3" fill="rgba(255,255,255,0.07)"/>
        </pattern>
        <radialGradient id={`sg${id}`} cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>
      <rect width="60" height="60" rx="8" fill={`url(#w${id})`}/>
      <rect width="60" height="60" rx="8" fill={`url(#sg${id})`}/>
    </svg>
  );
}

export function SingleImage({ itemId, color, imageUrl, style={}, fit="cover", onFailed, zoomEnabled = true }) {
  const [failed, setFailed] = useState(false);
  const [prevImageUrl, setPrevImageUrl] = useState(imageUrl);
  if (imageUrl !== prevImageUrl) {
    setPrevImageUrl(imageUrl);
    setFailed(false);
  }
  if (failed||!imageUrl||imageUrl.endsWith("/itemimages/.jpg")||imageUrl==="") {
    return <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",...style}}><FabricSwatch color={color||"#888"} size={52}/></div>;
  }
  return <ZoomImage src={imageUrl} alt={itemId} fit={fit} style={style} enabled={zoomEnabled} onError={()=>{ setFailed(true); onFailed&&onFailed(); }} />;
}

const NO_IMAGE = `${IMAGE_BASE}/itemimages/NoImage.jpg`;



export function Carousel({ item, height, fit="cover", showThumbs=false, showDots=true, showArrows=true, showCounter=true, showExpand=false, onExpand, zoomEnabled = true, tableBadge, t }) {
  // INVITEM_UDFSTRING06 holds "TABLE" or "NON_TABLE" — condensed to a T/NT badge, same
  // convention as the Lookbook page. Opt-in via tableBadge so unrelated Carousel call
  // sites (e.g. ImageModal) are unaffected unless they explicitly pass it.
  const tableBadgeLabel = tableBadge == null
    ? null
    : String(tableBadge).trim().toUpperCase().includes("NON") ? "NT" : "T";
 
   
 
  const getBase = (url) => {
    if (!url) return null;
    const path = url.startsWith(IMAGE_BASE) ? url.slice(IMAGE_BASE.length) : url;
    if (!path||path==="/itemimages/.jpg") return null;
    return path.split("/").pop().replace(/_\d+\.\w+$/,"").replace(/\.\w+$/,"") || null;
  };

  const folder = item.imageUrl?.toLowerCase().includes("itemimagesgm")
  ? "itemimagesGM"
  : "itemimages";

  const base = getBase(item.imageUrl);
  const path = item.imageUrl?.startsWith(IMAGE_BASE) ? item.imageUrl.slice(IMAGE_BASE.length) : (item.imageUrl||"");
  const ext = path.split(".").pop()||"jpg";

  // Images may be stored on the server either with a numbered suffix (_1, _2, ...)
  // or as the bare filename — probe _1 through _5, then the bare name. Only if none of
  // those exist do we fall back to the "_PO" variant (uploaded separately for pending-PO
  // stock), so a GRC/numbered image always wins over a PO one when both exist.
  const candidates = base
    ? [
        ...Array.from({length:5},(_,i)=>`${IMAGE_BASE}/${folder}/${base}_${i+1}.${ext}`),
        `${IMAGE_BASE}/${folder}/${base}.${ext}`,
        `${IMAGE_BASE}/${folder}/${base}_PO.${ext}`,
      ]
    : [];
  
  const [loaded, setLoaded] = useState({});
  const [current, setCurrent] = useState(0);
  const [hov, setHov] = useState(false);
  const [allFailed, setAllFailed] = useState(false);
  const touchX = useRef(null);
  const [prevItemId, setPrevItemId] = useState(item.id);

  if (item.id !== prevItemId) {
    setPrevItemId(item.id);
    setLoaded({});
    setCurrent(0);
    setAllFailed(false);
  }

  const markLoaded = (i) => setLoaded(p=>({...p,[i]:true}));
  const markFailed = (i) => setLoaded(p=>{ const next={...p,[i]:false}; if(candidates.every((_,idx)=>next[idx]===false)) setAllFailed(true); return next; });
  const confirmedOk = candidates.map((_,i)=>i).filter(i=>loaded[i]===true);
  const firstUnresolved = candidates.findIndex((_,i)=>loaded[i]===undefined);
  const slides = firstUnresolved!==-1?[...confirmedOk,firstUnresolved]:confirmedOk;

  if (slides.length>0 && !slides.includes(current)) {
    setCurrent(slides[0]);
  }

  const currentSlide = Math.max(0,slides.indexOf(current));
  const go = (dir) => { const n=currentSlide+dir; if(n>=0&&n<slides.length) setCurrent(slides[n]); };

  if (!base||allFailed) {
    return <div style={{height,position:"relative",overflow:"hidden",background:"rgba(0,0,0,0.15)"}}><img src={NO_IMAGE} alt="No Image" style={{width:"100%",height:"100%",objectFit:"contain",display:"block",opacity:0.5}} onError={e=>{e.currentTarget.style.display="none";e.currentTarget.nextSibling.style.display="flex";}}/><div style={{display:"none",position:"absolute",inset:0,alignItems:"center",justifyContent:"center"}}><FabricSwatch color={item.color||"#888"} size={64}/></div>{tableBadgeLabel&&<div style={{position:"absolute",bottom:8,left:8,background:"rgba(0,0,0,0.65)",padding:"2px 9px",borderRadius:20,fontSize:9,color:"#fff",fontWeight:700,zIndex:4,pointerEvents:"none"}}>{tableBadgeLabel}</div>}</div>;
  }

  return (
    <div style={{position:"relative",height,overflow:"hidden",background:"rgba(0,0,0,0.15)",userSelect:"none"}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onTouchStart={e=>{touchX.current=e.touches[0].clientX;}} onTouchEnd={e=>{if(touchX.current!==null){const d=touchX.current-e.changedTouches[0].clientX;if(Math.abs(d)>30) go(d>0?1:-1);touchX.current=null;}}}>
        {/* Only mount confirmed-loaded slides plus the single next candidate to probe —
            mounting all 6 candidates at once fires 6 parallel requests per item, most 404s. */}
        {candidates.map((src,i)=> !slides.includes(i) ? null :
  <div key={i} style={{
    position:"absolute",
    inset:0,
    opacity:i===current?1:0,
     transition:"opacity 0.3s ease, transform 0.3s ease",
  transform: i===current && hov ? "scale(1.05)" : "scale(1)",
    pointerEvents:i===current?"auto":"none"
  }}>

    <ZoomImage src={src} alt={`${item.id}-${i + 1}`} fit={fit} onLoad={()=>markLoaded(i)} onError={()=>markFailed(i)} enabled={zoomEnabled && i===current} />

  </div>
)}


      {showArrows&&slides.length>1&&[[-1,"left","‹"],[1,"right","›"]].map(([dir,side,sym])=><button key={side} onClick={e=>{e.stopPropagation();go(dir);}} style={{position:"absolute",[side]:8,top:"50%",transform:"translateY(-50%)",width:28,height:28,borderRadius:"50%",background:"rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:hov&&(dir===-1?currentSlide>0:currentSlide<slides.length-1)?1:0,transition:"opacity 0.2s",zIndex:4,pointerEvents:hov?"auto":"none"}}>{sym}</button>)}
      {showCounter&&slides.length>1&&<div style={{position:"absolute",top:8,left:8,background:"rgba(0,0,0,0.65)",padding:"2px 9px",borderRadius:20,fontSize:9,color:"#fff",fontWeight:700,zIndex:4,pointerEvents:"none"}}>{currentSlide+1}/{slides.length}</div>}
      {tableBadgeLabel&&<div style={{position:"absolute",bottom:8,left:8,background:"rgba(0,0,0,0.65)",padding:"2px 9px",borderRadius:20,fontSize:9,color:"#fff",fontWeight:700,zIndex:4,pointerEvents:"none"}}>{tableBadgeLabel}</div>}
      {showDots&&slides.length>1&&<div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",display:"flex",gap:4,zIndex:4}}>{slides.map((slideIdx,i)=><div key={slideIdx} onClick={e=>{e.stopPropagation();setCurrent(slideIdx);}} style={{width:i===currentSlide?16:6,height:6,borderRadius:3,background:i===currentSlide?"#fff":"rgba(255,255,255,0.4)",transition:"all 0.25s",cursor:"pointer"}}/>)}</div>}
      {showExpand&&onExpand&&<div onClick={e=>{e.stopPropagation();onExpand();}} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.55)",padding:"3px 8px",borderRadius:6,fontSize:9,color:"rgba(255,255,255,0.85)",cursor:"pointer",zIndex:4,border:"1px solid rgba(255,255,255,0.1)",opacity:hov?1:0,transition:"opacity 0.2s"}}>⤢ expand</div>}
      {showThumbs&&slides.length>1&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.75)",padding:"8px 10px",display:"flex",gap:6,overflowX:"auto",zIndex:4}} onClick={e=>e.stopPropagation()}>{slides.map((slideIdx,i)=><div key={slideIdx} onClick={()=>setCurrent(slideIdx)} style={{width:48,height:48,borderRadius:7,overflow:"hidden",flexShrink:0,cursor:"pointer",transition:"border 0.2s",opacity:i===currentSlide?1:0.55,border:`2px solid ${i===currentSlide?t.accent:"rgba(255,255,255,0.15)"}`}}><img src={candidates[slideIdx]} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.currentTarget.src=NO_IMAGE;}}/></div>)}</div>}
    </div>
  );
}
