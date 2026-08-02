import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { API_BASE, IMAGE_BASE, THEMES } from "./constants";
import { FilterPanel } from "./media-ui";

// ─── constants ───────────────────────────────────────────────────────────────
const APPS_OPTIONS = ["APPAREL", "NON APPS"];

const APPS_API_VALUE = {
  "APPAREL":  "APPAREL",
  "NON APPS": "NON APPS",
};

const IMG_FOLDER = {
  "APPAREL":  "itemimages",
  "NON APPS": "itemimagesGM",
};

const normaliseList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    if (typeof data[0] === "string") return data;
    if (typeof data[0] === "object") {
      const keys = ["value", "Value", "name", "Name", "text", "Text", "label", "Label", "cat", "Cat", "id", "Id", "ID"];
      const key = keys.find((candidate) => data[0][candidate] !== undefined) || Object.keys(data[0])[0];
      return data.map((item) => String(item[key])).filter(Boolean);
    }
  }
  const inner = data.data || data.items || data.Items || data.result || data.Result || data.values || data.Values;
  return inner ? normaliseList(inner) : [];
};

// ─── LBImage ─────────────────────────────────────────────────────────────────
function LBImage({ imageUrl, itemId, rsp, lastInRate, sellThru, t, 
  onClick, onViewItems,colorConcept, imgFolder }) {
  const [index, setIndex] = useState(0);

  const basePath = imageUrl
    ?.replace(/^\/?(itemimages|itemimagesGM)\//, "")
    ?.replace(/_\d+\.jpg$/i, "")
    || "";

  const src = imageUrl
    ? `${IMAGE_BASE}/${imgFolder}/${basePath}_${index}.jpg`
    : `${IMAGE_BASE}/${imgFolder}/NoImage.jpg`;
  const hasRsp = rsp != null && rsp !== "";
  const hasLastInRate = lastInRate != null && lastInRate !== "";
  const parsedSellThru = Number(sellThru);
  const hasSellThru = sellThru != null && sellThru !== "" && Number.isFinite(parsedSellThru);

  return (
    <div
      onClick={() => onClick && onClick(itemId, basePath)}
      style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
    >
      <div style={{ width: "100%", height: 300, overflow: "hidden", borderRadius: 8, position: "relative" }}>
        <img
          src={src}
          onError={() => { if (index < 5) setIndex(i => i + 1); }}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {(hasRsp || hasLastInRate) && (
  <div style={{
    position: "absolute",
    bottom: 10,
    left: 10,

    display: "flex",
    alignItems: "center",
    gap: 6,

    background: t.bgAlt,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",

    padding: "5px 12px",
    borderRadius: 999,

    border: `1px solid ${t.accentBorder}`,
    boxShadow: `0 6px 18px rgba(0,0,0,0.35)`,

    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.4px",

    color: t.accent,

    pointerEvents: "none",
    transition: "all 0.2s ease"
  }}>
    
    {/* optional icon */}
    <span style={{ fontSize: 11, opacity: 0.8 }}>₹</span>

    {hasRsp && <span>{Number(rsp).toLocaleString("en-IN")}</span>}
    {hasLastInRate && (
      <>
        {hasRsp && <span style={{ opacity: 0.4 }}>|</span>}
        <span style={{ fontSize: 11, opacity: 0.8 }}>LIR</span>
        <span>₹ {Number(lastInRate).toLocaleString("en-IN")}</span>
      </>
    )}

  </div>
)}
        {hasSellThru && (
  <div style={{
    position: "absolute",
    bottom: 10,
    right: 10,

    display: "flex",
    alignItems: "center",
    gap: 6,

    background: t.bgAlt,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",

    padding: "5px 12px",
    borderRadius: 999,

    border: `1px solid ${t.accentBorder}`,
    boxShadow: `0 6px 18px rgba(0,0,0,0.35)`,

    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.4px",

    color: t.accent,

    pointerEvents: "none",
    transition: "all 0.2s ease"
  }}>
    <span style={{ fontSize: 11, opacity: 0.8 }}>ST</span>
    <span>{parsedSellThru.toFixed(1)}%</span>
  </div>
)}
      </div>
      <div style={{
        marginTop: 10, minHeight: 80, fontSize: 11, fontWeight: 600,
        textAlign: "center", color: t.textMuted, textTransform: "uppercase",
        letterSpacing: "0.5px", display: "-webkit-box", WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "16px",
      }}>
        {colorConcept}
      </div>

{/* 🔥 ONLY ONE BUTTON */}
  <button
    onClick={(e) => {
    e.stopPropagation(); // 🔥 IMPORTANT (prevents image click)
    onViewItems && onViewItems(colorConcept || "");
  }}
    style={{
      padding: "7px 12px",
      borderRadius: 8,
      border: `1px solid ${t.accentBorder}`,
      background: t.accentBg,
      color: t.accent,
      fontSize: 11,
      fontWeight: 700,
      cursor: "pointer",
      width: "100%"
    }}
  >
    View Items
  </button>


    </div>
  );
}


// ─── MrpGroup ─────────────────────────────────────────────────────────────────
function MrpGroup({ mrp, items, t, onImageClick,onViewItems, imgFolder, sectionRef }) {
  return (
    <div ref={sectionRef} style={{ marginBottom: 48 }}>
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", gap: 16,
        padding: "14px 0", background: t.bg,
        borderBottom: `2px solid ${t.accentBorder}`, marginBottom: 20,
      }}>
        <div style={{
          fontSize: 28, fontWeight: 900, color: t.accent,
          fontFamily: "'Georgia', serif", letterSpacing: "-1px",
        }}>
          ₹{mrp}
        </div>
        <div style={{ width: 1, height: 30, background: t.borderSub }} />
        <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600 }}>
          {items.length} STYLE{items.length > 1 ? "S" : ""}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 10, color: t.textFaint, fontStyle: "italic" }}>
          MRP BAND
        </div>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 14,
      }}>
        {items.map(item => (
          <LBImage
            key={item.ItemCode}
            imageUrl={item.ImageUrl}
            itemId={item.ItemCode}
            t={t}
            onClick={onImageClick}
            onViewItems={onViewItems}   // ✅ ADD THIS
            rsp={item.RSP}
            lastInRate={item.LastInRate ?? item.lastInRate ?? item.lastinrate ?? item.LASTINRATE}
            sellThru={item.sellThru ?? item.SellThru ?? item.SELLTHRU}
            colorConcept={item.ColorConcept || item.COLORCONCEPT}
            imgFolder={imgFolder}
          />
        ))}
      </div>
    </div>
  );
}

// ─── AppsSwitch ───────────────────────────────────────────────────────────────
function AppsSwitch({ value, onChange, t }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      background: t.inputBg,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: 3,
      gap: 2,
    }}>
      {APPS_OPTIONS.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => !active && onChange(opt)}
            style={{
              padding: "4px 12px",
              borderRadius: 7,
              border: "none",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.5px",
              cursor: active ? "default" : "pointer",
              transition: "all 0.18s",
              background: active ? t.accent : "transparent",
              color: active ? (t.accentText || "#fff") : t.textMuted,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── PremiumFilterButton ──────────────────────────────────────────────────────
function PremiumFilterButton({ onClick, activeCount, t }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 16px",
        height: 34,
        borderRadius: 10,
        border: `1.5px solid ${activeCount > 0 ? t.accent : t.accentBorder}`,
        background: activeCount > 0
          ? t.accent
          : hovered ? t.accentHov : t.accentBg,
        color: activeCount > 0
          ? (t.accentText || "#fff")
          : t.accent,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.7px",
        textTransform: "uppercase",
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 0.2s ease",
        boxShadow: hovered
          ? `0 0 0 3px ${t.accentBorder}, 0 6px 16px rgba(0,0,0,0.2)`
          : activeCount > 0
            ? `0 0 0 2px ${t.accentBorder}`
            : "none",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      {/* shimmer sweep */}
      <span style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
        backgroundSize: "200% 100%",
        animation: "lbShimmer 2.6s linear infinite",
        pointerEvents: "none",
      }} />

      {/* funnel icon (SVG, no emoji) */}
      <svg
        width="13" height="13"
        viewBox="0 0 14 14"
        fill="none"
        style={{ flexShrink: 0, position: "relative" }}
      >
        <path
          d="M1 2h12l-4.5 5.5V12L5.5 13V7.5L1 2z"
          fill="currentColor"
          opacity="0.9"
        />
      </svg>

      <span style={{ position: "relative" }}>Filters</span>

      {/* active count badge */}
      {activeCount > 0 && (
        <span style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 18,
          height: 18,
          padding: "0 5px",
          borderRadius: 9,
          background: "rgba(255,255,255,0.25)",
          color: "#fff",
          fontSize: 10,
          fontWeight: 900,
          lineHeight: 1,
          animation: "lbBadgePop 0.22s ease-out",
        }}>
          {activeCount}
        </span>
      )}
    </button>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner({ t }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: "50%",
          background: t.accent,
          animation: `bounce 1s ${i * 0.15}s infinite`,
        }} />
      ))}
    </div>
  );
}

// ─── Main LookBook ────────────────────────────────────────────────────────────
export default function LookBook({ themeKey = "dark", onClose }) {
  const t = THEMES[themeKey] || THEMES.dark;


  const [voiceSearchSupported, setVoiceSearchSupported] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const speechRecognitionRef = useRef(null);


  const lastMRPRef      = useRef(0);
  const lastItemCodeRef = useRef("");
  const scrollRef       = useRef(null);
  const savedScrollRef  = useRef(0);
  const groupRefs       = useRef([]);
  const divisionsRef    = useRef([]);
  const seasonsRef      = useRef([]);
  const sectionsRef     = useRef([]);
  const departmentsRef  = useRef([]);
  const articleNameRef  = useRef("");
  const appsgmsRef      = useRef("APPAREL");

  const [appsgms, setAppsgms]       = useState("APPAREL");
  const [hasMore, setHasMore]       = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [gallery, setGallery]       = useState(null);
  const [groups, setGroups]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const [divisionList, setDivisionList]      = useState([]);
  const [divisions, setDivisions]            = useState([]);
  const [seasonsList, setSeasonsList]        = useState([]);
  const [seasons, setSeasons]                = useState([]);
  const [sectionList, setSectionsList]       = useState([]);
  const [sections, setSections]              = useState([]);
  const [departmentList, setDepartmentsList] = useState([]);
  const [departments, setDepartments]        = useState([]);
  const [articleNameList, setArticleNameList] = useState([]);
  const [articleName, setArticleName]        = useState("");

  const [brandList] = useState([]);
  const [brands]    = useState([]);
  const [desc6, setDesc6] = useState([]);
  const [desc6List, setDesc6List] = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  const [rspFrom, setRspFrom] = useState("");
  const [rspTo,   setRspTo]   = useState("");

  const rspFromRef = useRef("");
  const rspToRef   = useRef("");

  const desc6Ref    = useRef([]);


  //-------------------------------------------------

// ✅ ADD YOUR FUNCTION HERE (STEP 3)



  useEffect(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setVoiceSearchSupported(false);
    return;
  }
  setVoiceSearchSupported(true);
}, []);


  //--------------------------------------------------

  useEffect(() => { divisionsRef.current   = divisions;   }, [divisions]);
  useEffect(() => { seasonsRef.current     = seasons;     }, [seasons]);
  useEffect(() => { sectionsRef.current    = sections;    }, [sections]);
  useEffect(() => { departmentsRef.current = departments; }, [departments]);
  useEffect(() => { articleNameRef.current = articleName; }, [articleName]);
  useEffect(() => { appsgmsRef.current     = appsgms;     }, [appsgms]);
  useEffect(() => { rspFromRef.current     = rspFrom;     }, [rspFrom]);
  useEffect(() => { rspToRef.current       = rspTo;       }, [rspTo]);
  useEffect(() => { desc6Ref.current       = desc6;       }, [desc6]);

  useLayoutEffect(() => {
    if (scrollRef.current && savedScrollRef.current > 0) {
      scrollRef.current.scrollTop = savedScrollRef.current;
      savedScrollRef.current = 0;
    }
  }, [groups]);

  const openGallery = (itemId, basePath) => {
    const folder = IMG_FOLDER[appsgmsRef.current] ?? "itemimages";
    const images = Array.from(
      { length: 6 },
      (_, i) => `${IMAGE_BASE}/${folder}/${basePath}_${i}.jpg`
    );
    setGallery({ itemId, images });
  };

  const openCatalogWithFilter = (colorConcept) => {
    const url = `/?lookbook=true&colorConcept=${encodeURIComponent(colorConcept)}`;
    window.open(url, "_blank");
  };

  const fetchItems = useCallback(async (filters = {}, loadMore = false) => {
    if (loadMore && scrollRef.current) {
      savedScrollRef.current = scrollRef.current.scrollTop;
    }
    setLoading(true);
    try {
      const d      = filters?.divisions   ?? divisionsRef.current;
      const season = filters?.seasons     ?? seasonsRef.current;
      const s      = filters?.sections    ?? sectionsRef.current;
      const dep    = filters?.departments ?? departmentsRef.current;
      const art    = filters?.articleName ?? articleNameRef.current;
      const app    = filters?.appsgms     ?? appsgmsRef.current;
      const apiApp = APPS_API_VALUE[app]  ?? app;
      const rspMin = filters?.rspFrom     ?? rspFromRef.current ?? "";
      const rspMax = filters?.rspTo       ?? rspToRef.current ?? "";
      const safeRspMin = rspMin === "" ? 0 : rspMin;
      const safeRspMax = rspMax === "" ? 999999 : rspMax;
      const desc6      = filters?.desc6   ?? desc6Ref.current;

      const url = `${API_BASE}/GetItemBasicInfoLookbook`
        + `?division=${d.join(",")}`
        + `&section=${s.join(",")}`
        + `&department=${dep.join(",")}`
        + `&articlename=${encodeURIComponent(art)}`
        + `&lastMRP=${loadMore ? lastMRPRef.current : 0}`
        + `&lastItemCode=${loadMore ? lastItemCodeRef.current : ""}`
        + `&pageNumber=1&pageSize=100`
        + `&season=${encodeURIComponent(season.join(","))}`
        + `&MRPsortType=ASC`
        + `&appstype=${apiApp}`
        + `&rspfrom=${safeRspMin}&rspto=${safeRspMax}`
        + `&desc6=${desc6.join(",")}`;

      const res   = await fetch(url);
      const data  = await res.json();
      const items = data?.Items || [];

      if (items.length > 0) {
        const last = items[items.length - 1];
        lastMRPRef.current      = last.RSP || 0;
        lastItemCodeRef.current = last.ItemCode;
      }

      const map = {};
      items.forEach(i => {
        const key = i.RSP || 0;
        if (!map[key]) map[key] = [];
        map[key].push(i);
      });

      const newGroups = Object.entries(map)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([mrp, items]) => ({ mrp, items }));

      setGroups(prev => {
        if (!loadMore) return newGroups;
        const mm = new Map(prev.map(g => [g.mrp, g]));
        newGroups.forEach(g => {
          mm.has(g.mrp)
            ? mm.set(g.mrp, { mrp: g.mrp, items: [...mm.get(g.mrp).items, ...g.items] })
            : mm.set(g.mrp, g);
        });
        return Array.from(mm.values());
      });

      setHasMore(items.length >= 100);
      setTotalItems(prev => loadMore ? prev + items.length : items.length);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  const doFullReset = useCallback((newApp) => {
    lastMRPRef.current      = 0;
    lastItemCodeRef.current = "";
    savedScrollRef.current  = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setGroups([]);
    setTotalItems(0);
    setHasMore(true);
    setDivisions([]);
    setSeasons([]);
    setSections([]);
    setDepartments([]);
    setArticleName("");
    setDesc6([]);
    divisionsRef.current   = [];
    seasonsRef.current     = [];
    sectionsRef.current    = [];
    departmentsRef.current = [];
    articleNameRef.current = "";
    desc6Ref.current       = [];
    setDivisionList([]);
    setSeasonsList([]);
    setSectionsList([]);
    setDepartmentsList([]);
    setArticleNameList([]);
    setDesc6List([]);
    fetchItems({
      divisions: [],
      seasons: [],
      sections: [],
      departments: [],
      articleName: "",
      desc6: [],
      appsgms: newApp,
      rspFrom: rspFromRef.current,
      rspTo: rspToRef.current,
    }, false);
  }, [fetchItems]);

  const handleAppsChange = (newApp) => {
    appsgmsRef.current = newApp;
    setAppsgms(newApp);
    doFullReset(newApp);
  };

  useEffect(() => {
    doFullReset("APPAREL");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch(`${API_BASE}/GetSeasonHO`)
      .then(r => r.json())
      .then(data => setSeasonsList(normaliseList(data)))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const apiApp = APPS_API_VALUE[appsgms] ?? appsgms;
    fetch(`${API_BASE}/GetDivision?divisiontype=${apiApp}`)
      .then(r => r.json()).then(setDivisionList).catch(console.error);
  }, [appsgms]);

  useEffect(() => {
    const apiApp = APPS_API_VALUE[appsgms] ?? appsgms;
    const params = new URLSearchParams({ divisiontype: apiApp });
    if (divisions.length) params.append("division", divisions.join(","));
    fetch(`${API_BASE}/GetSection?${params}`)
      .then(r => r.json()).then(data => setSectionsList(normaliseList(data))).catch(console.error);
  }, [divisions, appsgms]);

  useEffect(() => {
    const apiApp = APPS_API_VALUE[appsgms] ?? appsgms;
    const params = new URLSearchParams({ divisiontype: apiApp });
    if (divisions.length) params.append("division", divisions.join(","));
    if (sections.length)  params.append("section",  sections.join(","));
    fetch(`${API_BASE}/GetDepartment?${params}`)
      .then(r => r.json()).then(data => setDepartmentsList(normaliseList(data))).catch(console.error);
  }, [divisions, sections, appsgms]);

  useEffect(() => {
    const apiApp = APPS_API_VALUE[appsgms] ?? appsgms;
    const params = new URLSearchParams({ divisiontype: apiApp });
    if (divisions.length) params.append("division", divisions.join(","));
    if (sections.length) params.append("section", sections.join(","));
    if (departments.length) params.append("department", departments.join(","));
    fetch(`${API_BASE}/GetArticleName?${params}`)
      .then(r => r.json())
      .then(data => setArticleNameList(normaliseList(data)))
      .catch(console.error);
  }, [divisions, sections, departments, appsgms]);

  const loadTabData = async (tab, draft = {}) => {
    const apiApp = APPS_API_VALUE[appsgmsRef.current] ?? appsgmsRef.current;
    const params = new URLSearchParams({ divisiontype: apiApp });
    const d = draft.divisions ?? divisionsRef.current;
    const s = draft.sections  ?? sectionsRef.current;
    const dep = draft.departments ?? departmentsRef.current;
    const endpointMap = {
      section: "GetSection",
      season: "GetSeasonHO",
      department: "GetDepartment",
      articlename: "GetArticleName",
      desc6: "GetDesc6",
    };
    if (d.length) params.append("division", d.join(","));
    if (s.length) params.append("section",  s.join(","));
    if (dep.length) params.append("department", dep.join(","));
    const endpoint = endpointMap[tab];
    if (!endpoint) return;
    const url = tab === "season"
      ? `${API_BASE}/${endpoint}`
      : `${API_BASE}/${endpoint}?${params}`;
    setCatLoading(true);
    try {
      const res  = await fetch(url);
      const data = normaliseList(await res.json());
      if (tab === "season") setSeasonsList(data);
      if (tab === "section") setSectionsList(data);
      if (tab === "department") setDepartmentsList(data);
      if (tab === "articlename") setArticleNameList(data);
      if (tab === "desc6") setDesc6List(data);
    } finally {
      setCatLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchItems({
      divisions:   divisionsRef.current,
      seasons:     seasonsRef.current,
      sections:    sectionsRef.current,
      departments: departmentsRef.current,
      articleName: articleNameRef.current,
      appsgms:     appsgmsRef.current,
      rspFrom:     rspFromRef.current,
      rspTo:       rspToRef.current,
    }, true);
  };

  const imgFolder = IMG_FOLDER[appsgms] ?? "itemimages";

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToNextMrp = () => {
    if (!scrollRef.current || groups.length < 2) return;

    const currentScrollTop = scrollRef.current.scrollTop;
    const nextSection = groupRefs.current.find((node) => {
      if (!node) return false;
      return node.offsetTop > currentScrollTop + 40;
    });

    if (nextSection) {
      scrollRef.current.scrollTo({
        top: Math.max(nextSection.offsetTop - 12, 0),
        behavior: "smooth",
      });
    } else {
      scrollToTop();
    }
  };

  // count active filters for badge
  const activeFilterCount = divisions.length + seasons.length + sections.length + departments.length + (articleName ? 1 : 0);
  const activeFilterChips = [
    ...seasons.map(value => ({ key: `season-${value}`, label: "Season", value })),
    ...divisions.map(value => ({ key: `division-${value}`, label: "Division", value })),
    ...sections.map(value => ({ key: `section-${value}`, label: "Section", value })),
    ...departments.map(value => ({ key: `department-${value}`, label: "Department", value })),
    ...(articleName ? [{ key: `article-${articleName}`, label: "Article", value: articleName }] : []),
    ...(rspFrom ? [{ key: `rspfrom-${rspFrom}`, label: "Min", value: rspFrom }] : []),
    ...(rspTo ? [{ key: `rspto-${rspTo}`, label: "Max", value: rspTo }] : []),
    ...desc6.map(value => ({ key: `desc6-${value}`, label: "Desc 6", value })),
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 600,
      background: t.bg, display: "flex", flexDirection: "column",
      fontFamily: "'Segoe UI', sans-serif",
      animation: "fadeIn 0.25s ease",
    }}>
      <style>{`
      @keyframes voiceRipple { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(2.6);opacity:0} }
@keyframes wavePulse { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes bounce    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes lbShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes lbBadgePop{ 0%{transform:scale(0.4);opacity:0} 70%{transform:scale(1.25)} 100%{transform:scale(1);opacity:1} }
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${t.scrollThumb};border-radius:3px}
      `}</style>

      {/* ── top bar ── */}
      <div style={{
        height: 54, flexShrink: 0,
        background: t.bgHeader,
        borderBottom: `1px solid ${t.border}`,
        display: "flex", alignItems: "center",
        padding: "0 20px", gap: 14,
        backdropFilter: "blur(12px)",
        zIndex: 20,
      }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: t.accent, letterSpacing: "-0.5px" }}>
          📖 LookBook
        </div>

        <AppsSwitch value={appsgms} onChange={handleAppsChange} t={t} />

        <div style={{ width: 1, height: 20, background: t.borderSub }} />

        {/* ── Premium Filter Button ── */}
        <PremiumFilterButton
          onClick={() => setShowFilter(true)}
          activeCount={activeFilterCount}
          t={t}
        />

        {/* 🎤 ADD HERE */}
{/* 🎤 Voice Search */}
<button
  onClick={() => {
    if (voiceListening) {
      speechRecognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;

    recognition.onstart = () => {
      setVoiceListening(true);
      setVoiceError("");
    };

    recognition.onresult = (event) => {
      const finalText = Array.from(event.results)
        .filter(r => r.isFinal)
        .map(r => r[0].transcript)
        .join(" ")
        .trim();
      if (!finalText) return;

      (async () => {
        try {
          const res = await fetch(`${API_BASE}/SmartFilter`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: finalText })
          });
          const text = await res.text();
          if (!res.ok) throw new Error(text);
          const filters = JSON.parse(text);

          seasonsRef.current     = filters.season     || [];
          divisionsRef.current   = filters.division   || [];
          sectionsRef.current    = filters.section    || [];
          departmentsRef.current = filters.department || [];
          articleNameRef.current = filters.articleName || "";
          rspFromRef.current     = filters.RSPmin || "";
          rspToRef.current       = filters.RSPmax || "";

          setSeasons(filters.season       || []);
          setDivisions(filters.division   || []);
          setSections(filters.section     || []);
          setDepartments(filters.department || []);
          setArticleName(filters.articleName || "");
          setRspFrom(filters.RSPmin || "");
          setRspTo(filters.RSPmax   || "");

          lastMRPRef.current      = 0;
          lastItemCodeRef.current = "";
          savedScrollRef.current  = 0;
          if (scrollRef.current) scrollRef.current.scrollTop = 0;
          setGroups([]);

          fetchItems({
            seasons:     filters.season     || [],
            divisions:   filters.division   || [],
            sections:    filters.section    || [],
            departments: filters.department || [],
            articleName: filters.articleName || "",
            rspFrom:     filters.RSPmin || "",
            rspTo:       filters.RSPmax || "",
            appsgms:     appsgmsRef.current
          }, false);

        } catch (err) {
          console.error(err);
          setVoiceError("AI filter failed");
        }
      })();
    };

    recognition.onerror = () => {
      setVoiceError("Voice error");
      setVoiceListening(false);
    };

    recognition.onend = () => {
      setVoiceListening(false);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  }}
  
  style={{
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: `1px solid ${voiceListening ? "#6c63ff" : t.border}`,
    background: voiceListening ? "#6c63ff22" : t.accentBg,
    color: voiceListening ? "#6c63ff" : t.accent,
    cursor: voiceSearchSupported ? "pointer" : "not-allowed",
    opacity: voiceSearchSupported ? 1 : 0.45,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    position: "relative",
    flexShrink: 0,
  }}
>
  <div style={{
    position: "relative", width: 34, height: 34, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    {voiceListening && (
      <>
        <span style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1.5px solid #6c63ff",
          animation: "voiceRipple 1.8s ease-out infinite",
          pointerEvents: "none",
        }} />
        <span style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1.5px solid #6c63ff",
          animation: "voiceRipple 1.8s ease-out infinite 0.6s",
          pointerEvents: "none",
        }} />
      </>
    )}
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke={voiceListening ? "#6c63ff" : t.accent}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: "relative", zIndex: 1 }}
    >
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10a7 7 0 0014 0"/>
      <line x1="12" y1="21" x2="12" y2="17"/>
      <line x1="9" y1="21" x2="15" y2="21"/>
    </svg>
  </div>
</button>

        <div style={{ fontSize: 11, color: t.textMuted }}>
          {loading && groups.length === 0
            ? "Loading…"
            : `${totalItems} items · ${groups.length} MRP bands · ${appsgms}`}
        </div>

        {voiceError && (
          <div style={{ fontSize: 11, color: "#ef4444" }}>{voiceError}</div>
        )}

        <button
          onClick={onClose}
          style={{
            marginLeft: "auto", padding: "6px 14px", background: t.inputBg,
            border: `1px solid ${t.border}`, borderRadius: 8,
            color: t.textSub, fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* ── body ── */}
      {activeFilterChips.length > 0 && (
        <div style={{
          flexShrink: 0,
          padding: "10px 20px",
          borderBottom: `1px solid ${t.borderSub}`,
          background: t.bgHeader,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              color: t.textMuted,
            }}>
              Active Filters
            </span>
            {activeFilterChips.map(chip => (
              <span
                key={chip.key}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: t.accentBg,
                  border: `1px solid ${t.accentBorder}`,
                  color: t.accent,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                <span style={{ opacity: 0.7 }}>{chip.label}</span>
                <span style={{ color: t.text, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {chip.value}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "28px 28px 60px", position: "relative" }}>

          {loading && groups.length === 0 && (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              height: 300, gap: 16, color: t.textMuted,
            }}>
              <Spinner t={t} />
              <div style={{ fontSize: 12 }}>Fetching {appsgms} lookbook…</div>
            </div>
          )}

          {!loading && groups.length === 0 && (
            <div style={{
              textAlign: "center", color: t.textFaint,
              fontSize: 13, paddingTop: 80,
            }}>
              No items found for <strong>{appsgms}</strong>. Try adjusting filters.
            </div>
          )}

          {groups.map(({ mrp, items }) => (
            <MrpGroup
              key={mrp}
              mrp={mrp}
              items={items}
              t={t}
              onImageClick={openGallery}
              onViewItems={openCatalogWithFilter} // 🔥 new
              imgFolder={imgFolder}
              sectionRef={(node) => {
                const index = groups.findIndex((group) => group.mrp === mrp);
                groupRefs.current[index] = node;
              }}
            />
          ))}

          {!loading && hasMore && groups.length > 0 && (
            <div style={{ textAlign: "center", paddingTop: 12 }}>
              <button
                onClick={handleLoadMore}
                style={{
                  padding: "10px 36px", borderRadius: 10,
                  background: t.accentBg, border: `1px solid ${t.accentBorder}`,
                  color: t.accent, fontWeight: 700, fontSize: 12,
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = t.accentHov}
                onMouseLeave={e => e.currentTarget.style.background = t.accentBg}
              >
                Load More
              </button>
            </div>
          )}

          {loading && groups.length > 0 && (
            <div style={{
              display: "flex", justifyContent: "center",
              alignItems: "center", gap: 6, paddingTop: 20,
            }}>
              <Spinner t={t} />
            </div>
          )}

          {groups.length > 0 && (
            <div style={{
              position: "sticky",
              bottom: 18,
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginLeft: "auto",
              pointerEvents: "none",
              paddingTop: 18,
              padding: "10px 12px",
              width: "fit-content",
              background: t.bgHeader,
              border: `1px solid ${t.border}`,
              borderRadius: 999,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
            }}>
              <button
                onClick={scrollToNextMrp}
                style={{
                  pointerEvents: "auto",
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: `1px solid ${t.accentBorder}`,
                  background: t.accentBg,
                  color: t.accent,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
                }}
              >
                Next MRP
              </button>
              <button
                onClick={scrollToTop}
                style={{
                  pointerEvents: "auto",
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: `1px solid ${t.border}`,
                  background: t.bgAlt,
                  color: t.textSub,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
                }}
              >
                Top
              </button>
            </div>
          )}
        </div>

        {/* ── filter panel ── */}
        {showFilter && (
          <div
            onClick={() => setShowFilter(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
              display: "flex", justifyContent: "flex-end", zIndex: 300,
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ width: 320, height: "100%", background: t.bgAlt }}
            >
              <FilterPanel
                visibleTabs={["season","division",  "section", "department", "articlename", "desc6"]}
                rspFrom={rspFrom}
                rspTo={rspTo}
                setRspFrom={setRspFrom}
                setRspTo={setRspTo}
                seasonList={seasonsList}
                seasons={seasons}
                divisionList={divisionList}
                divisions={divisions}
                sectionList={sectionList}
                sections={sections}
                departmentList={departmentList}
                departments={departments}
                articleNameList={articleNameList}
                articleName={articleName}
                brandList={brandList}
                brands={brands}
                desc6List={desc6List}
                desc6={desc6}
                catLoading={catLoading}
                loadTabData={loadTabData}
                onApply={f => {
                  lastMRPRef.current      = 0;
                  lastItemCodeRef.current = "";
                  savedScrollRef.current  = 0;
                  if (scrollRef.current) scrollRef.current.scrollTop = 0;
                  setGroups([]);
                  setRspFrom(f.rspFrom || "");
                  setRspTo(f.rspTo || "");
                  setDivisions(f.divisions);
                  setSeasons(f.seasons || []);
                  setSections(f.sections);
                  setDepartments(f.departments);
                  setArticleName(f.articleName || "");
                  setDesc6(f.desc6 || []);
                  rspFromRef.current     = f.rspFrom || "";
                  rspToRef.current       = f.rspTo || "";
                  divisionsRef.current   = f.divisions;
                  seasonsRef.current     = f.seasons || [];
                  sectionsRef.current    = f.sections;
                  departmentsRef.current = f.departments;
                  articleNameRef.current = f.articleName || "";
                  desc6Ref.current       = f.desc6 || [];
                  fetchItems({ ...f, appsgms: appsgmsRef.current }, false);
                  setShowFilter(false);
                }}
                onClose={() => setShowFilter(false)}
                t={t}
              />
            </div>
          </div>
        )}

        {/* ── gallery lightbox ── */}
        {gallery && (
          <div
            onClick={() => setGallery(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
              zIndex: 2000, overflowY: "auto",
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: 600, margin: "40px auto",
                display: "flex", flexDirection: "column", gap: 20,
              }}
            >
              {gallery.images.map((img, i) => (
                <img
                  key={i} src={img}
                  onError={e => e.target.style.display = "none"}
                  style={{ width: "100%", borderRadius: 10 }}
                />
              ))}
            </div>
            <span
              onClick={() => setGallery(null)}
              style={{
                position: "fixed", top: 20, right: 30,
                color: "#fff", fontSize: 24, cursor: "pointer",
              }}
            >
              ✕
            </span>
          </div>
        )}

{/* ✅ STEP 5 ADD HERE */}
        {voiceListening && (
  <div style={{
    position: "fixed", inset: 0, zIndex: 3000,
    background: "rgba(0,0,0,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20,
    backdropFilter: "blur(3px)",
  }}>
    <div style={{
      width: "min(400px, 100%)",
      background: t.bgAlt,
      border: "1px solid rgba(108,99,255,0.25)",
      borderRadius: 20,
      padding: "36px 30px 28px",
      textAlign: "center",
      animation: "fadeIn 0.28s ease-out",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* mic orb */}
      <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 20px" }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "rgba(108,99,255,0.08)",
          border: "1px solid rgba(108,99,255,0.2)",
        }} />
        <span style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1.5px solid rgba(108,99,255,0.5)",
          animation: "voiceRipple 2s ease-out infinite",
        }} />
        <span style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1.5px solid rgba(108,99,255,0.5)",
          animation: "voiceRipple 2s ease-out infinite 0.7s",
        }} />
        <div style={{
          position: "absolute", inset: 10, borderRadius: "50%",
          background: "rgba(108,99,255,0.14)",
          border: "1px solid rgba(108,99,255,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="#6c63ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="11" rx="3"/>
            <path d="M5 10a7 7 0 0014 0"/>
            <line x1="12" y1="21" x2="12" y2="17"/>
            <line x1="9" y1="21" x2="15" y2="21"/>
          </svg>
        </div>
      </div>

      {/* animated waveform */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 3, height: 28, marginBottom: 18,
      }}>
        {[40,65,90,100,75,55,85,60,40,70,50,30].map((h, i) => (
          <div key={i} style={{
            width: 3, height: `${h}%`,
            background: "#6c63ff", borderRadius: 2,
            transformOrigin: "center bottom",
            animation: `wavePulse 0.9s ease-in-out infinite ${i * 0.08}s`,
          }} />
        ))}
      </div>

      <div style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 6 }}>
        Listening…
      </div>
      <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
        Speak a season, department, section,<br />or try "show women kurtas under ₹999"
      </div>

      {/* hint chips */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 22 }}>
        {["Season", "Division", "Section", "Price range"].map(chip => (
          <span key={chip} style={{
            padding: "4px 10px", borderRadius: 20,
            border: "1px solid rgba(108,99,255,0.3)",
            background: "rgba(108,99,255,0.08)",
            color: "#8b85f5", fontSize: 10, fontWeight: 600,
          }}>{chip}</span>
        ))}
      </div>

      <button
        onClick={() => speechRecognitionRef.current?.stop()}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 24px", borderRadius: 999,
          border: "1.5px solid rgba(108,99,255,0.5)",
          background: "transparent",
          color: "#8b85f5", fontSize: 12, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Segoe UI',sans-serif",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 2, background: "#6c63ff" }} />
        Stop listening
      </button>
    </div>
  </div>
)}


      </div>
    </div>
  );
}
