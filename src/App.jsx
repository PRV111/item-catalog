import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, IMAGE_BASE, PAGE_SIZE, THEMES } from "./catalog/constants";
import { useDebouncedValue } from "./catalog/hooks";
import { FilterGroup, LoadingDots, SortToggle, ThemePicker } from "./catalog/basic-ui";
import { FilterPanel, SingleImage } from "./catalog/media-ui";
import { ImageModal, ItemCard, ListRow } from "./catalog/catalog-views";
import LookBook from "./catalog/lookbook";
import Login from "./components/Login";


const normaliseImageUrl = (rawUrl) => {
  const value = String(rawUrl || "").trim();

  if (!value || value === "/itemimages/.jpg") return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${IMAGE_BASE}${value}`;
  if (value.startsWith("itemimages/") || value.startsWith("itemimagesGM/")) {
    return `${IMAGE_BASE}/${value}`;
  }

  return `${IMAGE_BASE}/itemimages/${value}`;
};

const mapItem = (raw) => {
  const rawUrl =
    raw.imageUrl ||
    raw.ImageUrl ||
    raw.IMAGEURL ||
    raw.image_url ||
    raw.imagePath ||
    raw.ImagePath ||
    raw.IMAGEPATH ||
    raw.imageName ||
    raw.ImageName ||
    "";
  const cleanUrl = normaliseImageUrl(rawUrl);
  return {
    id: raw.itemCode || raw.ItemCode || raw.ITEMCODE || raw.itemcode || "",
    article: raw.article || raw.Article || raw.ARTICLE || raw.articleName || raw.ArticleName || "",
    colorConcept: raw.colorConcept || raw.ColorConcept || raw.COLORCONCEPT || "",
    itemName: raw.itemName || raw.ItemName || raw.ITEMNAME || raw.itemDesc || raw.ItemDesc || "",
    division: raw.division || raw.Division || "",
    section: raw.section || raw.Section || "",
    department: raw.department || raw.Department || "",
    rsp: raw.rsp || raw.RSP || 0,
    season: raw.season || raw.Season || "",
    category: raw.invitem_UDFSTRING06 || raw.INVITEM_UDFSTRING06 || "NON_TABLE",
    //sellThru: parseFloat(raw.sellThru ?? raw.SellThru ?? 0),
    //monthlySellThru: parseFloat(raw.monthlySellThru ?? raw.MonthlySellThru ?? raw.MTHLYSELLTHRU ?? 0),
    //saleQty: raw.storesaleqty || raw.STORESALEQTY || 0,
    coloroptionsqty: raw.coloroptions       || raw.colorOptions        || raw.COLOROPTIONS  || 0,
    storeStockQty: raw.storestock || raw.STORESTOCK || 0,
    whStockQty: raw.whstock || raw.whStock || raw.WHStock || raw.WHSTOCK || 0,
    mtdsale: raw.mtdsale || raw.mtdSale || raw.MtdSale || raw.MTDSALE || 0,
    //lmsale: raw.lmsale || raw.lmSale || raw.LmSale || raw.LMSALE || 0,
    //gmpercent: raw.gmper || raw.gmPer || raw.GMPER || 0,
    //grcqty: raw.grcqty || raw.grcQty || raw.GRCQTY || 0,
    //lastInDate: raw.grcdt || raw.grcDt || raw.GRCDT || "",
    setCode: raw.setCode || raw.SetCode || "NA",
    setBarCount: raw.setBarCount || raw.SetBarCount || 0,
    imageUrl: cleanUrl,
    imageBarcode: raw.imageBarcode || raw.ImageBarcode || "",
    imageCount: cleanUrl ? 5 : 0,
    color: "#888888",
    fabric: raw.cat5 || raw.Cat5 || "",
    cat1: raw.cat1 || raw.Cat1 || "",
    cat2: raw.cat2 || raw.Cat2 || "",
    cat3: raw.cat3 || raw.Cat3 || "",
    cat4: raw.cat4 || raw.Cat4 || "",
    cat5: raw.cat5 || raw.Cat5 || "",
    cat6: raw.cat6 || raw.Cat6 || "",
    desc1: raw.desc1 || raw.Desc1 || "",
    desc2: raw.desc2 || raw.Desc2 || "",
    desc3: raw.desc3 || raw.Desc3 || "",
    desc4: raw.desc4 || raw.Desc4 || "",
    desc5: raw.desc5 || raw.Desc5 || "",
    desc6: raw.desc6 || raw.Desc6 || "",
  };
};

const normaliseCatList = (data) => {
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
  return inner ? normaliseCatList(inner) : [];
};

const pickFirstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const normaliseFilterValues = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || "").trim()).filter(Boolean);
  }

  if (value == null) return [];

  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const normaliseVoiceComparable = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const mapToKnownOptions = (values, options = []) => {
  const safeValues = normaliseFilterValues(values);
  const safeOptions = normaliseFilterValues(options);

  return safeValues.map((value) => {
    const compactValue = normaliseVoiceComparable(value);
    return safeOptions.find((option) => normaliseVoiceComparable(option) === compactValue) || value;
  });
};

export default function App() {
 
  // used for lookbook colorconcept
  const params = new URLSearchParams(window.location.search);
  const colorConceptFromURL = params.get("colorConcept");

  const [themeName, setThemeName] = useState("dark");
  const t = THEMES[themeName];
 
  const isLookbook = new URLSearchParams(window.location.search).get("lookbook") === "true";
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("login");
    if (saved === "true") setIsLoggedIn(true);
  }, []);

  const handleLogin = ({ username, password }) => {
    if (username === "admin" && password === "123") {
      localStorage.setItem("login", "true");
      setIsLoggedIn(true);
    } else {
      alert("Invalid username or password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("login");
    setIsLoggedIn(false);
  };

  const [sections, setSections] = useState([]);
  const [sectionList, setSectionsList] = useState([]);
  

  const [departments, setDepartments] = useState([]);
  const [departmentList, setDepartmentsList] = useState([]);
  
  const [brands, setBrands] = useState([]);
  const [brandList, setBrandList] = useState([]);
  const [showBrandPanel, setShowBrandPanel] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [articleNameList, setArticleNameList] = useState([]);
  const [cat2, setCat2] = useState([]), [cat3, setCat3] = useState([]), [cat4, setCat4] = useState([]), [cat5, setCat5] = useState([]), [cat6, setCat6] = useState([]);
  const 
  [cat2List, setCat2List] = useState([]), 
  [cat3List, setCat3List] = useState([]), 
  [cat4List, setCat4List] = useState([]), 
  [cat5List, setCat5List] = useState([]), 
  [cat6List, setCat6List] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [desc1, setDesc1] = useState([]), [desc2, setDesc2] = useState([]), [desc3, setDesc3] = useState([]), [desc4, setDesc4] = useState([]), [desc5, setDesc5] = useState([]), [desc6, setDesc6] = useState([]);
  const [desc1List, setDesc1List] = useState([]), [desc2List, setDesc2List] = useState([]), [desc3List, setDesc3List] = useState([]), [desc4List, setDesc4List] = useState([]), [desc5List, setDesc5List] = useState([]), [desc6List, setDesc6List] = useState([]);
  const [seasonInitDone, setSeasonInitDone] = useState(false), [appsgmsInitDone, setAppsgmsInitDone] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");
  const [globalSearchInput, setGlobalSearchInput] = useState("");
  const [poSearchInput, setPoSearchInput] = useState("");
  const [activeSearchMode, setActiveSearchMode] = useState("catalog");
  const [voiceSearchSupported, setVoiceSearchSupported] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [cartNotice, setCartNotice] = useState("");
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("catalog-cart");
      return saved
        ? JSON.parse(saved).map((item) => ({
            ...item,
            qty: Number(item.qty) || 1,
            imageUrl: item.imageUrl || "",
            color: item.color || "#888888",
          }))
        : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("catalog-cart", JSON.stringify(cartItems));
  }, [cartItems]);
  useEffect(() => {
    if (!cartNotice) return undefined;
    const timer = setTimeout(() => setCartNotice(""), 1400);
    return () => clearTimeout(timer);
  }, [cartNotice]);
  const handleAddToCart = (item, qty = 1) => {
    if (!item?.id) return;
    const safeQty = Math.max(1, Number(qty) || 1);
    setCartItems((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        return prev.map((cartItem) => cartItem.id === item.id
          ? {
              ...cartItem,
              itemName: item.itemName || cartItem.itemName,
              rsp: item.rsp ?? cartItem.rsp,
              imageUrl: item.imageUrl || cartItem.imageUrl || "",
              color: item.color || cartItem.color || "#888888",
              qty: (cartItem.qty || 0) + safeQty,
            }
          : cartItem);
      }
      return [...prev, {
        id: item.id,
        itemName: item.itemName,
        rsp: item.rsp,
        imageUrl: item.imageUrl || "",
        color: item.color || "#888888",
        qty: safeQty,
      }];
    });
    setCartNotice(`${item.id} added x${safeQty}`);
  };
  const [mrpMin, setMrpMin] = useState(""), [mrpMax, setMrpMax] = useState("");
  // ALL ITEM INFORMATION
  const [items, setItems] = useState([])
  const [metricsMap, setMetricsMap] = useState({});
  //----------------------------------------------
  const [loading, setLoading] = useState(false), [initialLoading, setInitialLoading] = useState(true), [error, setError] = useState(null), [page, setPage] = useState(1), [hasMore, setHasMore] = useState(true);
  const [appsgms, setAppsgms] = useState([]), [seasons, setSeasons] = useState([]), 
  [divisions, setDivisions] = useState([]);
  
  const [mrpSort, setMrpSort] = useState("None"), [saleSort, setSaleSort] = useState("None"), [globalSearch, setGlobalSearch] = useState(""), [barcodeOnly, setBarcodeOnly] = useState(false), [bobsArticle, setBobsArticle] = useState(false);
  const [appsgmsList, setAppsgmsList] = useState([]), [seasonsList, setSeasonsList] = useState([]), 
  [divisionList, setDivisionList] = useState([]) 
  const [clientSort, setClientSort] = useState("none");  
 
  const [modalItem, setModalItem] = useState(null), [viewMode, setViewMode] = useState("grid");
  const loadedTabs = useRef({ section:false,department:false , cat2: false, cat3: false, cat4: false, cat5: false, cat6: false, desc1: false, desc2: false, desc3: false, desc4: false, desc5: false, desc6: false });
  const suppressCategoryResetRef = useRef(false);
  const fetchAbortRef = useRef(null), fetchRequestIdRef = useRef(0), loadingRef = useRef(false);
  const speechRecognitionRef = useRef(null);
  const seasonsListRef = useRef([]), departmentListRef = useRef([]);
  const debouncedGlobalSearch = useDebouncedValue(globalSearch, 300), debouncedArticleSearch = useDebouncedValue(articleSearch, 300);

  const initialLoadDoneRef = useRef(false);

  const filterCacheRef = useRef({});

  useEffect(() => {
    if (!showSidebar) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowSidebar(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showSidebar]);

  //-----------------------------------------------------------

 const submitPOSearch = (searchText) => {
  const trimmedSearch = searchText.trim();
  if (!trimmedSearch) return;
  const normalizedSearch = trimmedSearch.replace(/[.?!,;:]+$/g, "");
  setPoSearchInput(normalizedSearch || trimmedSearch);
  setGlobalSearchInput("");
  setActiveSearchMode("po");
  setVoiceError("");
  setItems([]);
  setPage(1);
  setHasMore(true);
  callPOSearchAPI(normalizedSearch || trimmedSearch, 1, true);  // ← changed
};

const callPOSearchAPI = async (poNumber, pageNum = 1, reset = false) => {
  if (!reset && loadingRef.current) return;

  const requestId = ++fetchRequestIdRef.current;
  fetchAbortRef.current?.abort();
  const controller = new AbortController();
  fetchAbortRef.current = controller;

  loadingRef.current = true;
  setLoading(true);
  setError(null);
  if (reset) setMetricsMap({});

  try {
    // GetItemsByPO returns full item details (RSP, division/section/department,
    // categories, image URL) for the PO in a single call — no second lookup needed.
    const res = await fetch(
      `${API_BASE}/GetItemsByPO?poNumber=${encodeURIComponent(poNumber)}&pageNumber=${pageNum}&pageSize=${PAGE_SIZE}&appstype=${encodeURIComponent(appsgms.join(","))}`,
      { signal: controller.signal }
    );
    if (!res.ok) throw new Error(`PO API error ${res.status}`);

    const data = await res.json();

    if (requestId !== fetchRequestIdRef.current) return;

    const rawItems = Array.isArray(data) ? data : (data.Items ?? []);
    const more = Array.isArray(data) ? rawItems.length >= PAGE_SIZE : (data.HasMore ?? rawItems.length >= PAGE_SIZE);

    let mapped = rawItems.map(mapItem);

    const isNonApps = appsgms.length && appsgms[0].toUpperCase() === "NON APPS";
    mapped = mapped.map(item => {
      if (!item.imageUrl) return item;
      return {
        ...item,
        imageUrl: item.imageUrl.replace("/itemimages/", isNonApps ? "/itemimagesGM/" : "/itemimages/")
      };
    });

    setItems(prev => {
      const newItems = reset ? mapped : [...prev, ...mapped];
      fetchMetrics(mapped);
      return newItems;
    });

    setHasMore(more);
    setPage(pageNum);

  } catch (err) {
    if (err.name !== "AbortError") setError(err.message);
  } finally {
    if (requestId === fetchRequestIdRef.current) {
      loadingRef.current = false;
      setLoading(false);
      setInitialLoading(false);
    }
  }
};



  const getCacheKey = (tab, params) => {
  return `${tab}|${Object.entries(params)
    .map(([k, v]) => `${k}:${v?.join?.(",") || v}`)
    .join("|")}`;
};

  useEffect(() => {
    const div = divisions.join(","), sec = sections.join(","), dep = departments.join(",");
    //let url = `${API_BASE}/GetBrands`;
    let url = `${API_BASE}/GetBrands`;
    if (div || sec || dep) url += `?division=${encodeURIComponent(div)}&section=${encodeURIComponent(sec)}&department=${encodeURIComponent(dep)}`;
    fetch(url).then((response) => response.json()).then((data) => setBrandList(data || [])).catch(console.error);
  }, [divisions, sections, departments]);

  useEffect(() => {
    fetch(`${API_BASE}/GetSeasonHO`)
      .then((response) => response.json())
      .then((list) => { setSeasonsList(list); if (list.length > 0) setSeasons([list[0]]); })
      .catch(console.error)
      .finally(() => setSeasonInitDone(true));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/GetAppsGM`)
      .then((response) => response.json())
      .then((list) => { setAppsgmsList(list); const apparel = list.find((value) => value.toLowerCase().includes("apparel")); if (apparel) setAppsgms([apparel]); })
      .catch(console.error)
      .finally(() => setAppsgmsInitDone(true));
  }, []);

  useEffect(() => { seasonsListRef.current = seasonsList; }, [seasonsList]);
  useEffect(() => { departmentListRef.current = departmentList; }, [departmentList]);

  // useEffect(() => 
  //   { if (!appsgms.length) 
  //     { setDivisionsList([]); 
  //     setDivisions([]); 
  //     return; 
  //   } 
  //   fetch(`${API_BASE}/GetDivisionHO?divisiontype=${appsgms.join(",")}`).then((response) => response.json()).then(setDivisionsList).catch(console.error); }, 
  //   [appsgms]);
 
      useEffect(() => { 
        if (!appsgms.length) { 
          setDivisionList([]);   // ✅ correct
          setDivisions([]); 
          return; 
        } 

  fetch(`${API_BASE}/GetDivision?divisiontype=${appsgms.join(",")}`)
    .then((response) => response.json())
    .then((data) => setDivisionList(normaliseCatList(data))) // ✅ correct
    .catch(console.error); 

}, [appsgms]);


    // useEffect(() => 
    //   { if (!divisions.length) { 
    //     setSectionsList([]); 
    //     setSections([]); return; 
    //   } 
    //   fetch(`${API_BASE}/GetSectionHO?divisionname=${divisions.join(",")}`)
    //   .then((response) => response.json())
    //   .then(setSectionsList).catch(console.error); }, 
    //   [divisions]
    // );


// useEffect(() => { 
//         if (!divisions.length) { 
//           setSectionsList([]);   // ✅ correct
//           setSections([]); 
//           return; 
//         } 

//   fetch(`${API_BASE}/GetSection?division=${divisions.join(",")}&divisiontype=${appsgms.join(",")}`)
//     .then((response) => response.json())
//     .then((data) => setSectionsList(normaliseCatList(data))) // ✅ correct
//     .catch(console.error); 

// }, [divisions,appsgms]);


  

  useEffect(() => { 
    if (suppressCategoryResetRef.current) 
      return; 
    setCat3([]); setCat4([]); setCat5([]); setCat6([]); 
    setCat3List([]); setCat4List([]); setCat5List([]); setCat6List([]); 
    loadedTabs.current.cat3 = false; 
    loadedTabs.current.cat4 = false; 
    loadedTabs.current.cat5 = false; 
    loadedTabs.current.cat6 = false; 
  }, [cat2]);
  useEffect(() => { if (suppressCategoryResetRef.current) return; setCat4([]); setCat5([]); setCat6([]); setCat4List([]); setCat5List([]); setCat6List([]); loadedTabs.current.cat4 = false; loadedTabs.current.cat5 = false; loadedTabs.current.cat6 = false; }, [cat3]);
  useEffect(() => { if (suppressCategoryResetRef.current) return; setCat5([]); setCat6([]); setCat5List([]); setCat6List([]); loadedTabs.current.cat5 = false; loadedTabs.current.cat6 = false; }, [cat4]);
  useEffect(() => { if (suppressCategoryResetRef.current) return; setCat6([]); setCat6List([]); loadedTabs.current.cat6 = false; }, [cat5]);
  useEffect(() => { if (suppressCategoryResetRef.current) suppressCategoryResetRef.current = false; });

  const loadTabData = async (tab, draft = {}) => {

     // ❌ STOP division API call here
    if (tab === "division") return;

    const params = new URLSearchParams();

    const useDivisions = draft.divisions ?? divisions;
    const useSections = draft.sections ?? sections;
    const useDepartments = draft.departments ?? departments;
    const useBrands = draft.brands ?? brands;
    const useCat2 = draft.cat2 ?? cat2, useCat3 = draft.cat3 ?? cat3, useCat4 = draft.cat4 ?? cat4, useCat5 = draft.cat5 ?? cat5, useCat6 = draft.cat6 ?? cat6;


     const paramsObj = {
    division: useDivisions,
    section: useSections,
    department: useDepartments,
    brand: useBrands,
    cat2: useCat2,
    cat3: useCat3,
    cat4: useCat4,
    cat5: useCat5,
    cat6: useCat6
  };

  const cacheKey = getCacheKey(tab, paramsObj);

    // if (useDivisions.length) params.append("division", useDivisions.join(","));
    // if (useSections.length) params.append("section", useSections.join(","));
    // if (useDepartments.length) params.append("department", useDepartments.join(","));
    // if (useBrands.length) params.append("brand", useBrands.join(","));
    // if (useCat2.length) params.append("cat2", useCat2.join(","));
    // if (useCat3.length) params.append("cat3", useCat3.join(","));
    // if (useCat4.length) params.append("cat4", useCat4.join(","));
    // if (useCat5.length) params.append("cat5", useCat5.join(","));
    // if (useCat6.length) params.append("cat6", useCat6.join(","));

    // ✅ CACHE CHECK
  if (filterCacheRef.current[cacheKey]) {
    const list = filterCacheRef.current[cacheKey];

    applyListToState(tab, list);
    return;
  }

    // already define
    //const params = new URLSearchParams();

    Object.entries(paramsObj).forEach(([key, value]) => {
      if (value?.length) {
        params.append(key, value.join(","));
      }
    });

    if (appsgms?.length) {
        params.append("divisiontype", appsgms.join(","));
      }

    setCatLoading(true);

    try {
      const endpoint = tab === "articlename"
        ? "GetArticleName"
        : `Get${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
      const response = await fetch(`${API_BASE}/${endpoint}?${params}`);
      const list = normaliseCatList(await response.json());

       // ✅ SAVE CACHE
      filterCacheRef.current[cacheKey] = list;

      applyListToState(tab, list);

      // if (tab === "section") setSectionsList(list); 
      // if (tab === "department") setDepartmentsList(list); 
      // if (tab === "cat2") setCat2List(list); 
      // if (tab === "cat3") setCat3List(list); 
      // if (tab === "cat4") setCat4List(list); 
      // if (tab === "cat5") setCat5List(list); 
      // if (tab === "cat6") setCat6List(list);
      // if (tab === "desc1") setDesc1List(list); 
      // if (tab === "desc2") setDesc2List(list); 
      // if (tab === "desc3") setDesc3List(list); 
      // if (tab === "desc4") setDesc4List(list); 
      // if (tab === "desc5") setDesc5List(list); 
      // if (tab === "desc6") setDesc6List(list);

      // loadedTabs.current[tab] = true;

    } catch (err) {
      console.error(err);
    }
    setCatLoading(false);
  };
//--------------------------------------------------------------

const applyListToState = (tab, list) => {
  if (tab === "section") setSectionsList(list);
  if (tab === "department") setDepartmentsList(list);
  if (tab === "articlename") setArticleNameList(list);

  if (tab === "cat2") setCat2List(list);
  if (tab === "cat3") setCat3List(list);
  if (tab === "cat4") setCat4List(list);
  if (tab === "cat5") setCat5List(list);
  if (tab === "cat6") setCat6List(list);

  if (tab === "desc1") setDesc1List(list);
  if (tab === "desc2") setDesc2List(list);
  if (tab === "desc3") setDesc3List(list);
  if (tab === "desc4") setDesc4List(list);
  if (tab === "desc5") setDesc5List(list);
  if (tab === "desc6") setDesc6List(list);
};


//-----FETCH ITEMMETRICS OR OTHER INFORMATION---------------------------------------------------------
  const fetchMetrics = useCallback(async (itemsList) => {
    if (!itemsList.length) return;

    const ids = itemsList.map((item) => item.id).filter(Boolean).join(",");
    if (!ids) return;

    try {
      const res = await fetch(`${API_BASE}/GetItemMetrics?ids=${encodeURIComponent(ids)}`);

      const data = await res.json();

      const list = Array.isArray(data)
        ? data
        : data.Items || data.data || [];

      const map = {};
      list.forEach(x => {
        const key = x.itemId || x.ItemCode || x.ITEMCODE || x.itemcode || x.item_code;

        map[key] = {
          sellThru:        parseFloat(x.sellThru        ?? x.SellThru        ?? x.SELLTHRU        ?? 0),
          monthlySellThru: parseFloat(x.monthlySellThru ?? x.MonthlySellThru ?? x.MTHLYSELLTHRU   ?? 0),
          gmpercent:       parseFloat(x.gmper           ?? x.gmPer           ?? x.GMPER           ?? x.gmpercent ?? 0),
          saleQty:         x.storesaleqty || x.STORESALEQTY || x.saleQty || x.SaleQty || 0,
          lmsale:          x.lmsale       || x.lmSale        || x.LMSALE  || 0,
          grcqty:          x.grcqty       || x.grcQty        || x.GRCQTY  || 0,
          ytdgrcqty:       x.ytdgrcqty     || x.ytdgrcQty      || x.YTDGRCQTY || 0,
          lastInDate:      x.grcdt        || x.grcDt         || x.GRCDT   || "",

          ordqty:          x.ordqty       || x.ordQty        || x.ORDQTY  || 0,
          cnlqty:          x.cnlqty       || x.cnlQty        || x.CNLQTY  || 0,
          recqty:          x.rcqty       || x.rcQty        || x.RCQTY  || 0,
          pendqty:         x.pendqty      || x.pendQty       || x.PENDQTY  || 0,
        };
      });

      setMetricsMap(prev => ({ ...prev, ...map }));

    } catch (err) {
      console.error("Metrics API error:", err);
    }
  }, []);

  //----Fetch Items----------------------------------------------------
  const fetchItems = useCallback(async (pageNum, reset = false) => {
    if (!reset && loadingRef.current) return;
    const requestId = ++fetchRequestIdRef.current;
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    if (reset) {
      setMetricsMap({});
    }
    try {
      const itemInfoEndpoint = bobsArticle ? "GetBOBSItemBasicInfo" : "GetItemBasicInfo";
      const url = `${API_BASE}/${itemInfoEndpoint}`
        + `?brand=${brands.join(",")}&maxPrice=99999&division=${divisions.join(",")}&section=${sections.join(",")}&department=${departments.join(",")}`
        + `&pageNumber=${pageNum}&pageSize=${PAGE_SIZE}&selectedfilter=${debouncedGlobalSearch ? "cat1" : "select"}`
        + `&selectedfiltervalue=${encodeURIComponent(debouncedGlobalSearch)}&season=${seasons.join(",")}`
        + `&MRPsortType=${mrpSort === "None" ? "ASC" : mrpSort}&SalesortType=${saleSort === "None" ? "ASC" : saleSort}&appstype=${appsgms.join(",")}`
        + `&cat2=${encodeURIComponent(cat2.join(","))}&cat3=${encodeURIComponent(cat3.join(","))}&cat4=${encodeURIComponent(cat4.join(","))}&cat5=${encodeURIComponent(cat5.join(","))}&cat6=${encodeURIComponent(cat6.join(","))}`
        + `&desc1=${encodeURIComponent(desc1.join(","))}&desc2=${encodeURIComponent(desc2.join(","))}&desc3=${encodeURIComponent(desc3.join(","))}&desc4=${encodeURIComponent(desc4.join(","))}&desc5=${encodeURIComponent(desc5.join(","))}&desc6=${encodeURIComponent(desc6.join(","))}`
        + `&articlename=${encodeURIComponent(debouncedArticleSearch)}&rspfrom=${mrpMin || 0}&rspto=${mrpMax || 99999}`
        + (!bobsArticle ? `&bobsArticle=${bobsArticle}` : "");

      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`API error ${response.status}`);
      const data = await response.json();
      if (requestId !== fetchRequestIdRef.current) return;
      const rawItems = Array.isArray(data) ? data : (data.Items ?? []);
      const more = Array.isArray(data) ? rawItems.length >= PAGE_SIZE : (data.HasMore ?? rawItems.length >= PAGE_SIZE);

      let mapped = rawItems.map(mapItem);

      const isNonApps = appsgms.length && appsgms[0].toUpperCase() === "NON APPS";

      mapped = mapped.map(item => {
        if (!item.imageUrl) return item;

        return {
          ...item,
          imageUrl: item.imageUrl.replace(
            "/itemimages/",
            isNonApps ? "/itemimagesGM/" : "/itemimages/"
          )
        };
      });

      setItems((prev) => {
        const newItems = reset ? mapped : [...prev, ...mapped];
        fetchMetrics(mapped);
        return newItems;
      });

      setHasMore(more);
      setPage(pageNum);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      if (requestId === fetchRequestIdRef.current) { loadingRef.current = false; setLoading(false); setInitialLoading(false); }
    }
  }, [
    bobsArticle, brands, divisions, sections, departments, debouncedGlobalSearch,
    seasons, mrpSort, saleSort, appsgms, cat2, cat3, cat4, cat5, cat6,
    desc1, desc2, desc3, desc4, desc5, desc6, debouncedArticleSearch,
    mrpMin, mrpMax, fetchMetrics,
  ]);

  //--------------ITEM SEARCH API----------------------------------------
  const callSearchAPI = useCallback(async (searchText, pageNum = 1, reset = false, isLookbook = false, searchMode = "catalog") => {
  
  if (!searchText || searchText.trim() === "") {
    fetchItems(1, true);
    return;
  }

  if (reset && !isLookbook) {
    setActiveSearchMode(searchMode);
    if (searchMode === "catalog") {
      setPoSearchInput("");
    } else if (searchMode === "po") {
      setGlobalSearchInput("");
    }
  }

  if (!reset && loadingRef.current) return;

  const requestId = ++fetchRequestIdRef.current;

  fetchAbortRef.current?.abort();
  const controller = new AbortController();
  fetchAbortRef.current = controller;

  loadingRef.current = true;
  setLoading(true);
  setError(null);

  try {
    const url = isLookbook
      ? `${API_BASE}/GetItemBasicInfoLookbook`
        + `?colorConcept=${encodeURIComponent(searchText)}`
        + `&pageNumber=${pageNum}`
        + `&pageSize=50`
      : `${API_BASE}/GetSearchItems`
        + `?selectedfilter=${encodeURIComponent(searchMode === "po" ? "po" : "cat1")}`
        + `&selectedfiltervalue=${encodeURIComponent(searchText)}`
        + `&pageNumber=${pageNum}`
        + `&pageSize=${PAGE_SIZE}`
        + `&appstype=${encodeURIComponent(appsgms.join(","))}`;

    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) throw new Error(`API error ${response.status}`);

    const data = await response.json();

    if (requestId !== fetchRequestIdRef.current) return;

    const rawItems = Array.isArray(data)
      ? data
      : (data.Items ?? []);

    const more = Array.isArray(data)
      ? rawItems.length >= PAGE_SIZE
      : (data.HasMore ?? rawItems.length >= PAGE_SIZE);

    let mapped = rawItems.map(mapItem);

    // ✅ image fallback logic (same as your code)
    const imageMap = {};
    mapped.forEach(item => {
      const key = item.article;
      if (item.imageUrl) imageMap[key] = item.imageUrl;
    });

    // mapped = mapped.map(item => {
    //   const key = item.article;
    //   if (!item.imageUrl && imageMap[key]) {
    //     return { ...item, imageUrl: imageMap[key], imageCount: 5 };
    //   }
    //   return item;
    // });

    // ✅ Same NON APPS image path fix as fetchItems
    const isNonApps = appsgms.length && appsgms[0].toUpperCase() === "NON APPS";

    mapped = mapped.map(item => {
      if (!item.imageUrl) return item;
      return {
        ...item,
        imageUrl: item.imageUrl.replace(
          "/itemimages/",
          isNonApps ? "/itemimagesGM/" : "/itemimages/"
        )
      };
    });

    //setItems(prev => reset ? mapped : [...prev, ...mapped]);

    setItems(prev => {
  const newItems = reset ? mapped : [...prev, ...mapped];

  // ✅ CALL SECOND API (IMPORTANT)
  fetchMetrics(mapped);

  return newItems;
});


    setHasMore(more);
    setPage(pageNum);

  } catch (err) {
    if (err.name !== "AbortError") setError(err.message);
  } finally {
    if (requestId === fetchRequestIdRef.current) {
      loadingRef.current = false;
      setLoading(false);
      setInitialLoading(false);
    }
  }
}, [appsgms, fetchItems, fetchMetrics]);

  // Auto-run catalog search when a lookbook color concept is provided in the URL.
  useEffect(() => {
    if (!colorConceptFromURL || !appsgmsInitDone) return;

    console.log("ColorConcept from URL:", colorConceptFromURL);

    setItems([]);
    setPage(1);
    setHasMore(true);
    setGlobalSearchInput(colorConceptFromURL);

    callSearchAPI(colorConceptFromURL, 1, true, isLookbook);
  }, [colorConceptFromURL, appsgmsInitDone, isLookbook, callSearchAPI]);




  //-------------------------------------------------------------
  useEffect(() => {
  if (colorConceptFromURL) return;

  // wait until both APIs are loaded
  if (!seasonInitDone || !appsgmsInitDone) return;

  // ✅ FIRST TIME → run only once
  if (!initialLoadDoneRef.current) {
    initialLoadDoneRef.current = true;

    setItems([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);

    fetchItems(1, true);
    return;
  }

  // ✅ AFTER FIRST LOAD → normal behavior
  setItems([]);
  setPage(1);
  setHasMore(true);

  fetchItems(1, true);

}, [
  colorConceptFromURL,
  seasonInitDone,
  appsgmsInitDone,
  appsgms,
  seasons,
  divisions,
  sections,
  departments,
  mrpSort,
  saleSort,
  debouncedGlobalSearch,
  brands,
  cat2,
  cat3,
  cat4,
  cat5,
  cat6,
  desc1,
  desc2,
  desc3,
  desc4,
  desc5,
  desc6,
  debouncedArticleSearch,
  mrpMin,
  mrpMax,
  bobsArticle,
  fetchItems,
]);


  useEffect(() => () => fetchAbortRef.current?.abort(), []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSearchSupported(false);
      return undefined;
    }


    setVoiceSearchSupported(true);

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceListening(true);
      setVoiceError("");
    };

    recognition.onresult = (event) => {
      const finalTranscript = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();

      if (finalTranscript) {
        handleAISearch(finalTranscript);
      }
    };

const handleAISearch = async (query) => {
  try {
    const res = await fetch(`${API_BASE}/SmartFilter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

const text = await res.text();

    if (!res.ok) {
  throw new Error(text);
}

    const filters = JSON.parse(text);

    const nestedFilters = [
      filters?.Query,
      filters?.query,
      filters?.data,
      filters?.Data,
      filters?.result,
      filters?.Result,
    ].find((value) => value && typeof value === "object" && !Array.isArray(value));
    const smartFilters = nestedFilters ? { ...filters, ...nestedFilters } : filters;
    
    const resolvedSeasonFilters = mapToKnownOptions(
      normaliseFilterValues(smartFilters?.season),
      seasonsListRef.current
    ).filter((value, index, list) => list.indexOf(value) === index);

    const resolvedDepartmentFilters = mapToKnownOptions(
      normaliseFilterValues(smartFilters?.department),
      departmentListRef.current
    ).filter((value, index, list) => list.indexOf(value) === index);

    // ✅ Apply filters to your existing states

    setSeasons(resolvedSeasonFilters);


    setDepartments(resolvedDepartmentFilters);

   

     if (smartFilters.Brand) {
      setCat2(normaliseFilterValues(smartFilters.Brand).map((d) => d.toUpperCase()));
    }


   
    if (smartFilters.section) {
      setSections(normaliseFilterValues(smartFilters.section));
    }

    if (smartFilters.division) {
      setDivisions(normaliseFilterValues(smartFilters.division));
    }

    const smartRspMin = pickFirstDefined(
      smartFilters?.RSPmin,
      smartFilters?.RSPMin,
      smartFilters?.rspMin,
      smartFilters?.rspmin,
      smartFilters?.rspfrom,
      smartFilters?.rspFrom,
      smartFilters?.RSPFrom
    );
    let smartRspMax = pickFirstDefined(
      smartFilters?.RSPmax,
      smartFilters?.RSPMax,
      smartFilters?.rspMax,
      smartFilters?.rspmax,
      smartFilters?.rspto,
      smartFilters?.rspTo,
      smartFilters?.RSPTo
    );

    setMrpMin(smartRspMin == null ? "" : String(smartRspMin));
    setMrpMax(smartRspMax == null ? "" : String(smartRspMax));

    // 🔥 trigger data reload
    setItems([]);
    setPage(1);
    setHasMore(true);

  } catch (err) {
    console.error("AI error:", err);
    setVoiceError("Voice search could not apply SmartFilter.");
  }
};



    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setVoiceError("Microphone permission is blocked.");
      } else if (event.error !== "aborted") {
        setVoiceError("Voice search could not understand the input.");
      }
    };

    recognition.onend = () => {
      setVoiceListening(false);
    };

    speechRecognitionRef.current = recognition;

    return () => {
      recognition.abort();
      speechRecognitionRef.current = null;
    };
  }, []);

  const toggle = (setter, value) => setter((prev) => prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]);
  const clearAll = () => {
    setClientSort("none"); 
    //setSeasons([]); 
    setDivisions([]); 
    setSections([]); 
    setDepartments([]); 
    setMrpSort("None"); 
    setSaleSort("None"); 
    setGlobalSearch(""); 
    setGlobalSearchInput(""); 
    setPoSearchInput("");
    setActiveSearchMode("catalog");
    setVoiceError("");
    setBarcodeOnly(false); 
    setBobsArticle(false);
    setBrands([]); 
    setCat2([]); 
    setCat3([]); 
    setCat4([]); 
    setCat5([]); 
    setCat6([]); 
    setDesc1([]); setDesc2([]); setDesc3([]); setDesc4([]); setDesc5([]); setDesc6([]);
    setArticleSearch(""); setMrpMin(""); setMrpMax("");
  };
  const applyMrpFilter = () => { setItems([]); setPage(1); setHasMore(true); fetchItems(1, true); };
  const handleVoiceSearch = () => {
    if (!speechRecognitionRef.current) {
      setVoiceError("Voice search is not supported in this browser.");
      return;
    }

    if (voiceListening) {
      speechRecognitionRef.current.stop();
      return;
    }

    setVoiceError("");
    speechRecognitionRef.current.start();
  };

  const activeCount = useMemo(() => appsgms.length + seasons.length + divisions.length + sections.length + departments.length + (barcodeOnly ? 1 : 0) + (bobsArticle ? 1 : 0) + brands.length + cat2.length + cat3.length + cat4.length + cat5.length + cat6.length + desc1.length + desc2.length + desc3.length + desc4.length + desc5.length + desc6.length + (articleSearch ? 1 : 0) + (mrpMin ? 1 : 0) + (mrpMax ? 1 : 0), [appsgms, seasons, divisions, sections, departments, barcodeOnly, bobsArticle, brands, cat2, cat3, cat4, cat5, cat6, desc1, desc2, desc3, desc4, desc5, desc6, articleSearch, mrpMin, mrpMax]);
  // const displayItems = useMemo(() => barcodeOnly ? items.filter((item) => item.category === "NON_TABLE") : items, [barcodeOnly, items]);

  const displayItems = useMemo(() => {
  const getMetricValue = (item, key) => {
    const metric = metricsMap[item.id] || {};
    return metric[key] ?? item[key] ?? 0;
  };

  let result = barcodeOnly
    ? items.filter(item => item.category === "NON_TABLE")
    : items;

  switch (clientSort) {
    case "dead":
      result = [...result].sort((a, b) => getMetricValue(a, "sellThru") - getMetricValue(b, "sellThru"));
      break;
    case "hot":
      result = [...result].sort((a, b) => getMetricValue(b, "sellThru") - getMetricValue(a, "sellThru"));
      break;
    case "slow":
      result = [...result].filter(item => {
        const sellThru = getMetricValue(item, "sellThru");
        return sellThru > 0 && sellThru < 10;
      });
      break;
    case "healthy":
      result = [...result].filter(item => {
        const sellThru = getMetricValue(item, "sellThru");
        return sellThru >= 10 && sellThru < 20;
      });
      break;
    case "highstock":
      result = [...result].sort((a, b) =>
        (b.storeStockQty + b.whStockQty) - (a.storeStockQty + a.whStockQty));
      break;
    case "highsale":
      result = [...result].sort((a, b) => getMetricValue(b, "saleQty") - getMetricValue(a, "saleQty"));
      break;
    case "highgm":
      result = [...result].sort((a, b) => getMetricValue(b, "gmpercent") - getMetricValue(a, "gmpercent"));
      break;
    case "lowgm":
      result = [...result].sort((a, b) => getMetricValue(a, "gmpercent") - getMetricValue(b, "gmpercent"));
      break;
    default:
      break;
  }

  return result;
}, [barcodeOnly, items, clientSort, metricsMap]);

  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    [cartItems]
  );
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + ((Number(item.rsp) || 0) * (Number(item.qty) || 0)), 0),
    [cartItems]
  );
  const getCartQty = (id) => Number(cartItems.find((item) => item.id === id)?.qty) || 0;
  const updateCartQty = (id, nextQtyOrUpdater) => {
    setCartItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const currentQty = Number(item.qty) || 1;
      const nextQty = typeof nextQtyOrUpdater === "function"
        ? nextQtyOrUpdater(currentQty)
        : nextQtyOrUpdater;
      return { ...item, qty: Math.max(1, Number(nextQty) || 1) };
    }));
  };
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };


  const stats = useMemo(() => [
  ["Loaded", items.length, t.accent],

  ["Options", items[0]?.coloroptionsqty ?? 0, "#10b981"],

  ["Dead Stock",
    displayItems.filter(item => {
      const m = metricsMap[item.id] || {};
      const st = m.sellThru ?? item.sellThru ?? 0;
      return st === 0;
    }).length,
    "#ef4444"
  ],

  ["Hot >20%",
    displayItems.filter(item => {
      const m = metricsMap[item.id] || {};
      const st = m.sellThru ?? item.sellThru ?? 0;
      return st > 20;
    }).length,
    "#3b82f6"
  ],

  

], [displayItems, items, metricsMap, t.accent]);

  if (!isLoggedIn) {
    return <Login t={t} onLogin={handleLogin} />;
  }

  if (isLookbook && !colorConceptFromURL) {
    return <LookBook />;
  }

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: `radial-gradient(circle at top left, ${t.accentBg} 0%, transparent 28%), radial-gradient(circle at top right, ${t.legendBg} 0%, transparent 24%), ${t.bg}`, minHeight: "100vh", color: t.text, transition: "background 0.3s,color 0.3s" }}>
      <style>{`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-thumb{background:${t.scrollThumb};border-radius:3px}
  @keyframes cardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  button:focus{outline:none}
  input:focus{outline:none}
  #filter-panel div::-webkit-scrollbar{display:none}

  /* ✅ ADD THESE TWO */
  @keyframes voiceRipple {
    0%   { transform: scale(1);   opacity: 0.4; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  @keyframes wavePulse {
    0%, 100% { transform: scaleY(0.3); }
    50%       { transform: scaleY(1); }
  }

`}
</style>
      <div style={{ borderBottom: `1px solid ${t.borderSub}`, background: t.bgHeader, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              //onClick={() => setShowSidebar(true)}
              onClick={() => setShowSidebar(prev => !prev)}
              aria-label="Open filters sidebar"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                border: `1px solid ${showSidebar ? t.accentBorder : t.border}`,
                background: showSidebar ? t.accentBg : t.bgCard,
                color: showSidebar ? t.accent : t.text,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                flexShrink: 0,
                fontSize: 18,
              }}
            >
              ☰  {/* ✅ REPLACE SVG with unicode hamburger */}
              {activeCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: t.accent,
                  color: "#000",
                  fontSize: 9,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 5px",
                  lineHeight: 1,
                }}>
                  {activeCount}
                </span>
              )}
            </button>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#000" }}>
              ✦
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: t.accent }}>
                  ITEM CATALOG
                  </div>
          <div style={{ fontSize: 9, color: t.textFaint, letterSpacing: "2.5px", textTransform: "uppercase" }}>
            AI-Powered Inventory
            </div>
          </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            
            <div>
              <button
  onClick={() => window.open("/?lookbook=true", "_blank")}
  style={{
    padding: "7px 16px", background: t.accentBg,
    border: `1px solid ${t.accentBorder}`, borderRadius: 8,
    color: t.accent, fontSize: 11, fontWeight: 700, cursor: "pointer",
  }}
>
  📖 LookBook
</button>
     </div>
            
            <div style={{ padding: "6px 12px", borderRadius: 20, background: t.accentBg, border: `1px solid ${t.accentBorder}`, fontSize: 11, color: t.accent }}>
              {displayItems.length} items
              </div>
            

            <button
  onClick={() => setShowCart(true)}
  style={{
    display: "flex", alignItems: "center", gap: 8,
    padding: "7px 14px",
    background: cartItemCount > 0 ? t.accentBg : t.bgCard,
    border: `1px solid ${cartItemCount > 0 ? t.accentBorder : t.border}`,
    borderRadius: 10, cursor: "pointer",
    transition: "all 0.2s",
    position: "relative",
  }}
>
  {/* Cart bag SVG icon */}
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={cartItemCount > 0 ? t.accent : t.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
  <span style={{ fontSize: 11, fontWeight: 700, color: cartItemCount > 0 ? t.accent : t.textMuted }}>
    Cart
  </span>
  {cartItemCount > 0 && (
    <span style={{
      minWidth: 18, height: 18, borderRadius: 9,
      background: t.accent, color: "#000",
      fontSize: 9, fontWeight: 900,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 5px", lineHeight: 1,
      animation: "popBadge 0.22s cubic-bezier(.34,1.56,.64,1)",
    }}>
      {cartItemCount}
    </span>
  )}
</button>

              {["grid", "list"].map((value) => 
              <button key={value} onClick={() => setViewMode(value)} 
              style={{ padding: "6px 12px", background: viewMode === value ? t.accentBg : "transparent", border: `1px solid ${viewMode === value ? t.accentBorder : t.border}`, borderRadius: 8, color: viewMode === value ? t.accent : t.textMuted, fontSize: 11, cursor: "pointer" }}>
                {value === "grid" ? "⊞" : "☰"} {value}
              </button>)}
              <button
                onClick={handleLogout}
                style={{
                  padding: "7px 14px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8,
                  color: "#ef4444",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Logout
              </button>
              <ThemePicker current={themeName} onChange={setThemeName} t={t} /></div>
        

        


</div>
      </div>
      {showSidebar && (
        <div
          onClick={() => setShowSidebar(false)}
          style={{ position: "fixed", inset: 0, top: 60, 
            background: "rgba(0,0,0,0.45)", zIndex: 59 }}
        />
      )}
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", position: "relative" }}>
        <div style={{ 
          width: 252, 
          minWidth: 252, 
          borderRight: `1px solid ${t.borderSub}`, 
          height: "calc(100vh - 60px)", 
          position: "fixed", 
          top: 60, 
          left: 0, 
          overflowY: "auto", 
          background: t.bgSidebar, 
          transition: "transform 0.25s ease, background 0.3s", 
          transform: showSidebar ? "translateX(0)" : "translateX(-100%)", 
          zIndex: 60, 
          boxShadow: showSidebar ? "18px 0 40px rgba(0,0,0,0.28)" : "none" ,
          pointerEvents: showSidebar ? "auto" : "none",
          }}>
          <div style={{ padding: "16px 16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 3, height: 18, borderRadius: 2, background: t.accent }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: t.text, letterSpacing: "3px", textTransform: "uppercase" }}>
              Filters
              </span>
              </div>{activeCount > 0 && <button onClick={clearAll} style={{ fontSize: 10, color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontWeight: 700 }}>✕ Clear {activeCount}</button>}</div>
            <div style={{ position: "relative", marginBottom: 14 }}><span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: t.textFaint, fontSize: 13, pointerEvents: "none" }}>⌕</span>
            <input type="text" placeholder="Search ID, article..." value={globalSearchInput} onChange={(event) => setGlobalSearchInput(event.target.value)} 
            onKeyDown={(event) => { if (event.key === "Enter") 
             {
              // setGlobalSearch(globalSearchInput); 
              setItems([]);
              setPage(1);
              setHasMore(true);
              callSearchAPI(globalSearchInput,1,true); // ✅ NEW API CALL
            }
            }
          } 
              style={{ width: "100%", padding: "9px 42px 9px 30px", background: t.inputBg, border: `1px solid ${voiceListening ? t.accentBorder : t.border}`, borderRadius: 10, color: t.text, fontSize: 11, outline: "none" }} />
             <button
  type="button"
  onClick={handleVoiceSearch}
  disabled={!voiceSearchSupported}
  style={{
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: `1px solid ${voiceListening ? "#6c63ff" : t.border}`,
    background: voiceListening ? "#6c63ff22" : t.bgCard,
    color: voiceListening ? "#6c63ff" : (voiceSearchSupported ? t.textSub : t.textFaint),
    cursor: voiceSearchSupported ? "pointer" : "not-allowed",
    opacity: voiceSearchSupported ? 1 : 0.45,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    //position: "relative", // for ripple rings
    overflow: "visible",
    zIndex: 2,
  }}
>

  {/* inner wrapper — this is the positioning context for ripples */}
  <div style={{
    position: "relative",
    width: 30,
    height: 30,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}>

  
  {/* ripple rings when active */}
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
  {/* mic SVG */}
  <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={voiceListening ? "#6c63ff" : (voiceSearchSupported ? t.textSub : t.textFaint)}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ position: "relative", zIndex: 1, flexShrink: 0 }}
    >
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10a7 7 0 0014 0"/>
      <line x1="12" y1="21" x2="12" y2="17"/>
      <line x1="9" y1="21" x2="15" y2="21"/>
    </svg>
  </div>
</button>

              {(voiceError || voiceListening || !voiceSearchSupported) && (
                <div style={{ marginTop: 6, fontSize: 10, color: voiceError ? "#ef4444" : t.textMuted }}>
                  {voiceError || (voiceListening ? "Listening for your search..." : "Voice search works in supported browsers like Chrome or Edge.")}
                </div>
              )}
              </div>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: t.textFaint, fontSize: 10, fontWeight: 800, pointerEvents: "none" }}>PO</span>
              <input
                type="text"
                placeholder="Search PO..."
                value={poSearchInput}
                onChange={(event) => setPoSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    submitPOSearch(poSearchInput);
                  }
                }}
                style={{ width: "100%", padding: "9px 10px 9px 34px", background: t.inputBg, border: `1px solid ${activeSearchMode === "po" && poSearchInput ? t.accentBorder : t.border}`, borderRadius: 10, color: t.text, fontSize: 11, outline: "none" }}
              />
            </div>
          </div>
          <div style={{ padding: "8px 18px 12px" }}>
  {(() => {
    const totalPanelActive =
      divisions.length + sections.length + departments.length +
      brands.length + cat2.length + cat3.length + cat4.length;

    return (
      <>
        <style>{`
          @keyframes mfShimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
          @keyframes mfBadgePop {
            0%   { transform: scale(0.4); opacity: 0; }
            70%  { transform: scale(1.3); }
            100% { transform: scale(1);   opacity: 1; }
          }
          .mf-btn {
            width: 100%;
            padding: 11px 16px;
            border-radius: 12px;
            border: 1.5px solid ${totalPanelActive > 0 ? "var(--mf-accent)" : "var(--mf-border)"};
            background: ${totalPanelActive > 0 ? "var(--mf-accent)" : "var(--mf-bg)"};
            color: ${totalPanelActive > 0 ? "#fff" : "var(--mf-accent-color)"};
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            position: relative;
            overflow: hidden;
            transition: box-shadow 0.2s ease, transform 0.15s ease, background 0.2s ease;
          }
          .mf-btn:hover {
            box-shadow: 0 0 0 3px var(--mf-border), 0 6px 18px rgba(0,0,0,0.18);
            transform: translateY(-1px);
          }
          .mf-btn:active {
            transform: translateY(0);
            box-shadow: 0 0 0 2px var(--mf-border);
          }
          .mf-shimmer {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              105deg,
              transparent 40%,
              rgba(255,255,255,0.12) 50%,
              transparent 60%
            );
            background-size: 200% 100%;
            animation: mfShimmer 2.6s linear infinite;
            pointer-events: none;
          }
          .mf-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            border-radius: 9px;
            background: rgba(255,255,255,0.25);
            color: #fff;
            font-size: 10px;
            font-weight: 900;
            line-height: 1;
            animation: mfBadgePop 0.22s ease-out;
          }
          .mf-badge-idle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            border-radius: 9px;
            background: var(--mf-accent);
            color: #fff;
            font-size: 10px;
            font-weight: 900;
            line-height: 1;
            animation: mfBadgePop 0.22s ease-out;
          }
          .mf-chevron {
            font-size: 9px;
            color: ${totalPanelActive > 0 ? "rgba(255,255,255,0.7)" : "var(--mf-text-faint)"};
            transition: transform 0.25s ease;
            display: inline-block;
            flex-shrink: 0;
          }
        `}</style>

        {/* CSS variable bridge from theme object */}
        <div style={{
          "--mf-accent":       t.accent,
          "--mf-accent-color": t.accent,
          "--mf-border":       t.accentBorder,
          "--mf-bg":           t.accentBg,
          "--mf-text-faint":   t.textFaint,
        }}>
          <button
            className="mf-btn"
            onClick={() => setShowBrandPanel(open => !open)}
            aria-label={showBrandPanel ? "Close filters panel" : "Open filters panel"}
          >
            {/* shimmer sweep */}
            <span className="mf-shimmer" />

            {/* left side: icon + label + badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>

              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2.25 4h11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M2.25 8h11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M2.25 12h11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>

              <span style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.7px",
                textTransform: "uppercase",
              }}>
                Filters
              </span>

              {/* count badge */}
              {totalPanelActive > 0 && (
                <span className="mf-badge">{totalPanelActive}</span>
              )}
              {totalPanelActive === 0 && showBrandPanel && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: t.textFaint,
                  letterSpacing: "0.3px",
                  opacity: 0.7,
                }}>
                  open
                </span>
              )}
            </div>

            {/* right side: chevron */}
            <span
              className="mf-chevron"
              style={{
                transform: showBrandPanel ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              ▼
            </span>
          </button>
        </div>
      </>
    );
  })()}
</div>
          <div style={{ height: 1, background: t.borderSub, margin: "2px 16px 6px" }} />
          {/* <FilterGroup label="APPs/GM" icon="🗓" options={appsgmsList} selected={appsgms} onToggle={(value) => setAppsgms((prev) => toggleRequiredMulti(prev, value))} onClear={null} accent={t.accent} t={t} /> */}

{/* APPs/GM — radio pill toggle, one always active */}
<div style={{ borderBottom: `1px solid ${t.borderFaint}`, padding: "10px 16px" }}>
  <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8 }}>
    APPs/GM
  </div>
  <div style={{ display: "flex", gap: 6 }}>
    {appsgmsList.map((value) => {
      const active = appsgms.includes(value);
      return (
        <button
          key={value}
          //onClick={() => setAppsgms([value])}
          onClick={() => {
          // prevent duplicate click
          if (appsgms.length === 1 && appsgms[0] === value) 
            return;

            // ✅ CLEAR CACHE
            filterCacheRef.current = {};

            setAppsgms([value]);
            }}
          style={{
            flex: 1,
            padding: "7px 6px",
            borderRadius: 8,
            border: `1px solid ${active ? t.accentBorder : t.border}`,
            background: active ? t.accentBg : t.inputBg,
            color: active ? t.accent : t.textMuted,
            fontSize: 10,
            fontWeight: active ? 700 : 400,
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "'DM Sans','Segoe UI',sans-serif",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </button>
      );
    })}
  </div>
</div>

          <FilterGroup label="Season" icon="🗓" options={seasonsList} selected={seasons} onToggle={(value) => toggle(setSeasons, value)} onClear={() => setSeasons([])} accent={t.accent} t={t} />
          
          
          {/* <div style={{ borderBottom: `1px solid ${t.borderFaint}`, padding: "10px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Article</span>{articleSearch && <span onClick={() => setArticleSearch("")} style={{ fontSize: 9, color: "#ef4444", cursor: "pointer", fontWeight: 700 }}>✕</span>}</div><input value={articleSearch} onChange={(event) => setArticleSearch(event.target.value)} 
          placeholder="Search article name..." style={{ width: "100%", padding: "7px 10px", background: t.inputBg, border: `1px solid ${articleSearch ? t.accentBorder : t.border}`, borderRadius: 8, color: t.text, fontSize: 11, outline: "none" }} />
          </div> */}
          <div style={{ borderBottom: `1px solid ${t.borderFaint}`, padding: "10px 16px" }}><div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: "1.8px", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>MRP Range</span>{(mrpMin || mrpMax) && <span onClick={() => { setMrpMin(""); setMrpMax(""); }} style={{ fontSize: 9, color: "#ef4444", cursor: "pointer", fontWeight: 700 }}>✕</span>}</div><div style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="number" value={mrpMin} onChange={(event) => setMrpMin(event.target.value)} placeholder="Min" style={{ flex: 1, padding: "7px 8px", background: t.inputBg, border: `1px solid ${mrpMin ? t.accentBorder : t.border}`, borderRadius: 8, color: t.text, fontSize: 11, outline: "none", minWidth: 0 }} /><span style={{ color: t.textFaint, fontSize: 10 }}>-</span><input type="number" value={mrpMax} onChange={(event) => setMrpMax(event.target.value)} placeholder="Max" style={{ flex: 1, padding: "7px 8px", background: t.inputBg, border: `1px solid ${mrpMax ? t.accentBorder : t.border}`, borderRadius: 8, color: t.text, fontSize: 11, outline: "none", minWidth: 0 }} /></div><div style={{ display: "flex", gap: 4, marginTop: 7, flexWrap: "wrap" }}>{[["<500", 0, 499], ["500-1k", 500, 999], ["1k-2k", 1000, 1999], ["2k+", 2000, 99999]].map(([label, min, max]) => { const active = mrpMin === String(min) && mrpMax === String(max); return <button key={label} onClick={() => active ? (setMrpMin(""), setMrpMax("")) : (setMrpMin(String(min)), setMrpMax(String(max)))} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 20, cursor: "pointer", background: active ? t.accentBg : t.inputBg, border: `1px solid ${active ? t.accentBorder : t.border}`, color: active ? t.accent : t.textMuted, fontWeight: active ? 700 : 400 }}>{label}</button>; })}</div><button onClick={applyMrpFilter} disabled={!mrpMin && !mrpMax} style={{ marginTop: 8, width: "100%", padding: "6px", fontSize: 11, fontWeight: 600, borderRadius: 8, border: `1px solid ${t.accentBorder}`, background: t.accentBg, color: t.accent, cursor: "pointer" }}>Apply</button></div>
          <div style={{ height: 1, background: t.borderSub, margin: "6px 16px" }} />
          <div style={{ padding: "8px 16px 4px" }}><div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: "1.8px", textTransform: "uppercase" }}>Sort</div></div>
          <SortToggle label="RSP" value={mrpSort} onChange={setMrpSort} t={t} />
          <SortToggle label="Sale Qty" value={saleSort} onChange={setSaleSort} t={t} />
          <div style={{ height: 1, background: t.borderSub, margin: "8px 16px" }} />
          <div style={{ padding: "0 16px", marginBottom: 14 }}>
            <button onClick={() => setBobsArticle((open) => !open)} 
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", borderRadius: 10, background: bobsArticle ? t.accentBg : t.inputBg, border: `1px solid ${bobsArticle ? t.accentBorder : t.border}`, cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>◎</span>
                <span style={{ fontSize: 11, color: bobsArticle ? t.accent : t.textMuted, fontWeight: 600 }}>
                  BOBS Article
                  </span>
                  </div>
                  <div style={{ width: 34, height: 18, borderRadius: 9, background: bobsArticle ? t.accentBg : t.inputBg, border: `1px solid ${bobsArticle ? t.accentBorder : t.border}`, position: "relative" }}>
                    <div style={{ position: "absolute", top: 2, left: bobsArticle ? 17 : 2, width: 12, height: 12, borderRadius: "50%", background: bobsArticle ? t.accent : t.textFaint, transition: "left 0.2s", boxShadow: bobsArticle ? `0 0 6px ${t.accent}` : "none" }} />
                    </div>
                    </button>
                    </div>
         {/* <div style={{ padding: "0 16px", marginBottom: 10 }}>
            <button onClick={() => setBarcodeOnly((open) => !open)} 
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", borderRadius: 10, background: barcodeOnly ? t.accentBg : t.inputBg, border: `1px solid ${barcodeOnly ? t.accentBorder : t.border}`, cursor: "pointer", transition: "all 0.2s" }}>
               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>▦</span>
                <span style={{ fontSize: 11, color: barcodeOnly ? t.accent : t.textMuted, fontWeight: 600 }}>
                  NON_TABLE only
                  </span>
                  </div> 
                  <div style={{ width: 34, height: 18, borderRadius: 9, background: barcodeOnly ? t.accentBg : t.inputBg, border: `1px solid ${barcodeOnly ? t.accentBorder : t.border}`, position: "relative" }}>
                    <div style={{ position: "absolute", top: 2, left: barcodeOnly ? 17 : 2, width: 12, height: 12, borderRadius: "50%", background: barcodeOnly ? t.accent : t.textFaint, transition: "left 0.2s", boxShadow: barcodeOnly ? `0 0 6px ${t.accent}` : "none" }} />
                  </div>
                  </button>
                  </div>*/}
          

   {/* Quick sort chips */}

   
<div style={{display:"flex", gap:6, marginBottom:16, flexWrap:"wrap"}}>
  <span style={{fontSize:10,color:t.textMuted,alignSelf:"center",marginRight:4}}>
    WST sort:</span>
  {[
    ["none",      "All",          t.textMuted],
    ["dead",      "⚠️ Dead stock", "#ef4444"],
    ["slow",      "🔶 Slow",       "#f97316"],
    ["healthy",   "✅ Healthy",    "#10b981"],
    ["hot",       "🔥 Hot",        "#3b82f6"],
    // ["highstock", "📦 High stock", t.textSub],
    // ["highsale",  "💰 Top sale",   t.accent],
    // ["highgm",    "📈 High GM",    "#10b981"],
    // ["lowgm",     "📉 Low GM",     "#ef4444"],
  ].map(([key, label, color]) => {
    const active = clientSort === key;
    return (
      <button key={key} onClick={() => setClientSort(key)}
        style={{
          padding:"5px 12px", borderRadius:20, fontSize:11,
          fontWeight: active ? 700 : 400, cursor:"pointer",
          background: active ? `${color}20` : t.inputBg,
          border:`1px solid ${active ? color : t.border}`,
          color: active ? color : t.textMuted,
          transition:"all 0.15s"
        }}>
        {label}
      </button>
    );
  })}
</div>   

        </div>


        
        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          <div 
          style={{ 
            display: "flex", 
            gap: 12, 
            marginBottom: 24, 
            flexWrap: "wrap" 
            }}>
              {stats.map(([label, value, color]) => 
              <div key={label} style={{ flex: 1, minWidth: 100, padding: "12px 14px", background: t.statBg, border: `1px solid ${t.border}`, borderRadius: 12, borderLeft: `3px solid ${color}` }}>
                <div style={{ fontSize: 9, color: t.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}
                  
                </div>
                </div>
              )}
              </div>

        


          {initialLoading && <div style={{ textAlign: "center", padding: "80px 0" }}><LoadingDots t={t} /><div style={{ fontSize: 13, color: t.textMuted, marginTop: 16 }}>Loading catalog...</div></div>}
          {error && !loading && <div style={{ textAlign: "center", padding: "60px 0" }}><div style={{ fontSize: 32, marginBottom: 12 }}>!</div><div style={{ fontSize: 13, color: "#ef4444", marginBottom: 14 }}>{error}</div><button onClick={() => { setError(null); fetchItems(1, true); }} style={{ padding: "9px 24px", background: t.accentBg, border: `1px solid ${t.accentBorder}`, borderRadius: 9, color: t.accent, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Retry</button></div>}
          {!initialLoading && !error && viewMode === "grid" && 
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {displayItems.map((item, idx) => 
            <ItemCard 
            key={item.id} 
            item={item} 
            metrics={metricsMap[item.id]}
            idx={idx} 
            showAskAi={false}
            zoomEnabled={false}
            onExpand={setModalItem}
            onAddToCart={handleAddToCart}
            cartQty={getCartQty(item.id)}
            t={t} />
            )}
            </div>}
          {!initialLoading && !error && viewMode === "list" && <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{displayItems.map((item, idx) => 
            <ListRow key={item.id} item={item} metrics={metricsMap[item.id]} idx={idx} showAskAi={false} zoomEnabled={false} onOpen={setModalItem} onAddToCart={handleAddToCart} cartQty={getCartQty(item.id)} t={t} />)}</div>}
          {!initialLoading && !error && displayItems.length === 0 && <div style={{ textAlign: "center", padding: "80px 0" }}><div style={{ fontSize: 48, marginBottom: 12 }}>No items</div><div style={{ fontSize: 18, fontWeight: 700, color: t.textMuted }}>No items found</div><div style={{ fontSize: 13, color: t.textFaint, marginTop: 6 }}>
            Try adjusting your filters</div></div>}
          {!initialLoading && !error && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", gap: 12 }}>{loading && <LoadingDots t={t} />}{hasMore && !loading && items.length > 0 && 
          <button onClick={() => {
  const activeSearchText = activeSearchMode === "po" ? poSearchInput : globalSearchInput;
  if (activeSearchText && activeSearchText.trim() !== "") {
    callSearchAPI(activeSearchText, page + 1, false, false, activeSearchMode);
  } else {
    fetchItems(page + 1);
  }
}}
          style={{ padding: "11px 40px", background: t.accentBg, border: `1px solid ${t.accentBorder}`, borderRadius: 12, color: t.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
            Load More <span style={{ marginLeft: 8, fontSize: 10, opacity: 0.6, fontWeight: 400 }}>({items.length} loaded)</span>
            </button>
            }
            {!hasMore && items.length > 0 && 
            <div style={{ fontSize: 11, color: t.textFaint, padding: "8px 24px", border: `1px solid ${t.borderFaint}`, borderRadius: 20 }}>All {items.length} items loaded
              </div>
              }</div>}
        </div>
      </div>
      {modalItem && 
      <ImageModal 
      item={modalItem} metrics={metricsMap[modalItem.id]}
      showAskAi={false}
      onClose={() => setModalItem(null)} onAddToCart={handleAddToCart} cartQty={getCartQty(modalItem.id)} t={t} />}
      {showCart && (
  <div
    onClick={() => setShowCart(false)}
    style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.65)", display: "flex", justifyContent: "flex-end", backdropFilter: "blur(2px)", transition: "opacity 0.3s" }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{ width: "min(440px,100%)", height: "100%", background: t.bgAlt, borderLeft: `1px solid ${t.border}`, display: "flex", flexDirection: "column", animation: "slideInRight 0.32s cubic-bezier(.4,0,.2,1)" }}
    >
      {/* HEAD */}
      <div style={{ padding: "20px 22px", borderBottom: `1px solid ${t.borderSub}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: t.accentBg, border: `1px solid ${t.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛒</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Your Cart</div>
            <div style={{ fontSize: 10, color: t.textMuted, marginTop: 1 }}>{cartItemCount} item{cartItemCount !== 1 ? "s" : ""} · ₹{cartTotal.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <button onClick={() => setShowCart(false)} style={{ width: 32, height: 32, border: `1px solid ${t.border}`, borderRadius: 9, background: t.bgCard, color: t.textMuted, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {cartItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.25 }}>🛒</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: t.textMuted }}>Cart is empty</div>
            <div style={{ fontSize: 11, color: t.textFaint, marginTop: 4 }}>Add items from the catalog</div>
          </div>
        )}
        {cartItems.map(ci => (
          <div key={ci.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, marginBottom: 8 }}>
            <div style={{ width: 52, height: 68, borderRadius: 8, overflow: "hidden", background: "rgba(0,0,0,0.25)", border: `1px solid ${t.borderSub}`, flexShrink: 0 }}>
              <SingleImage itemId={ci.id} color={ci.color} imageUrl={ci.imageUrl} fit="cover" zoomEnabled={false} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.accent }}>{ci.id}</div>
              <div style={{ fontSize: 9, color: t.textMuted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ci.itemName || "Item"}</div>
              <div style={{ fontSize: 10, color: t.textFaint, marginTop: 3 }}>₹{Number(ci.rsp || 0).toLocaleString("en-IN")} per unit</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <button onClick={() => removeFromCart(ci.id)} style={{ width: 20, height: 20, border: "none", background: "transparent", color: t.textFaint, cursor: "pointer", fontSize: 11, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              <div style={{ display: "flex", alignItems: "center", background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, overflow: "hidden" }}>
                <button onClick={() => updateCartQty(ci.id, q => q - 1)} style={{ width: 24, height: 24, border: "none", background: "transparent", color: t.textMuted, fontSize: 14, cursor: "pointer" }}>−</button>
                <input type="number" min="1" value={ci.qty} onChange={e => { const v = e.target.value; if (v !== "") updateCartQty(ci.id, v); }} style={{ width: 30, height: 24, border: "none", background: "transparent", color: t.text, fontSize: 11, fontWeight: 700, textAlign: "center", outline: "none", MozAppearance: "textfield" }} />
                <button onClick={() => updateCartQty(ci.id, q => q + 1)} style={{ width: 24, height: 24, border: "none", background: "transparent", color: t.textMuted, fontSize: 14, cursor: "pointer" }}>+</button>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.text }}>₹{(Number(ci.rsp || 0) * Number(ci.qty || 0)).toLocaleString("en-IN")}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      {cartItems.length > 0 && (
        <div style={{ padding: "18px 20px", borderTop: `1px solid ${t.borderSub}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase", letterSpacing: "1px" }}>Items</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{cartItemCount} qty</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: t.accentBg, border: `1px solid ${t.accentBorder}`, borderRadius: 11, margin: "12px 0 14px" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: t.accent, letterSpacing: "1px", textTransform: "uppercase" }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: t.accent }}>₹{cartTotal.toLocaleString("en-IN")}</span>
          </div>
          <button style={{ width: "100%", height: 48, background: t.accent, border: "none", borderRadius: 12, color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer", letterSpacing: "0.5px" }}>
            Proceed to Checkout →
          </button>
          <button onClick={() => setCartItems([])} style={{ width: "100%", height: 36, background: "transparent", border: `1px solid ${t.border}`, borderRadius: 9, color: t.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
            Clear Cart
          </button>
        </div>
      )}
    </div>
  </div>
)}
      {cartNotice && (
  <div style={{
    position: "fixed", right: 20, bottom: 24, zIndex: 1200,
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 16px",
    background: t.bgCard,
    border: `1px solid ${t.accentBorder}`,
    borderRadius: 12, color: t.text,
    fontSize: 12, fontWeight: 700,
    boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
    animation: "slideInRight 0.28s cubic-bezier(.34,1.56,.64,1)",
  }}>
    <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.accent, flexShrink: 0 }} />
    <span style={{ color: t.accent }}>{cartNotice}</span>
  </div>
)}
     {voiceListening && (
  <div style={{
    position: "fixed", inset: 0, zIndex: 1250,
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
        Speak your item ID, article name,<br />or try "show red shirts under ₹500"
      </div>

      {/* hint chips */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 22 }}>
        {["Item code", "Article name", "Department", "Price range"].map(chip => (
          <span key={chip} style={{
            padding: "4px 10px", borderRadius: 20,
            border: "1px solid rgba(108,99,255,0.3)",
            background: "rgba(108,99,255,0.08)",
            color: "#8b85f5", fontSize: 10, fontWeight: 600,
          }}>{chip}</span>
        ))}
      </div>

      <button onClick={handleVoiceSearch} style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "10px 24px", borderRadius: 999,
        border: "1.5px solid rgba(108,99,255,0.5)",
        background: "transparent",
        color: "#8b85f5", fontSize: 12, fontWeight: 700,
        cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: "#6c63ff" }} />
        Stop listening
      </button>
    </div>
  </div>
)}
      
      
      {showBrandPanel && 
      <FilterPanel 
      rspFrom={mrpMin}
      rspTo={mrpMax}
      setRspFrom={setMrpMin}
      setRspTo={setMrpMax}
      divisionList={divisionList} 
      divisions={divisions} 
      sectionList={sectionList}       // ✅ ADD
      sections={sections}   
      departmentList={departmentList}
      departments={departments}
      articleNameList={articleNameList}
      articleName={articleSearch}
      brandList={brandList} 
      brands={brands} 
      cat2List={cat2List} 
      cat3List={cat3List} 
      cat4List={cat4List} 
      cat5List={cat5List} 
      cat6List={cat6List} 
      cat2={cat2} 
      cat3={cat3} 
      cat4={cat4} 
      cat5={cat5} 
      cat6={cat6} 
      desc1List={desc1List} 
      desc2List={desc2List} 
      desc3List={desc3List} 
      desc4List={desc4List} 
      desc5List={desc5List} 
      desc6List={desc6List} 
      desc1={desc1} 
      desc2={desc2} 
      desc3={desc3} 
      desc4={desc4} 
      desc5={desc5} 
      desc6={desc6} 
      catLoading={catLoading} 
      loadTabData={loadTabData} 
      
      visibleTabs={["division", "section", "department",  "brands", "cat2", "cat3", "cat4", "cat5", "cat6", "desc1", "desc2", "desc3", "desc4", "desc5", "desc6"]}
      presentation="modal"
      
      //  articlename,
      
      onApply={(data) => { 
        suppressCategoryResetRef.current = true; 
        
        const newDivisions = data.divisions || [];
        const newSections = data.sections || [];
        const newDepartments = data.departments || [];
          // if division changed
        if (JSON.stringify(divisions) !== JSON.stringify(newDivisions)) {

          // ✅ CLEAR CACHE (IMPORTANT FIX)
          filterCacheRef.current = {};

          setDivisions(newDivisions);

          
        }

         // ✅ Section
          if (JSON.stringify(sections) !== JSON.stringify(newSections)) {
            filterCacheRef.current = {};
            setSections(newSections);
          }

        // ✅ Department
          if (JSON.stringify(departments) !== JSON.stringify(newDepartments)) {
            filterCacheRef.current = {};
            setDepartments(newDepartments);
          }

        setMrpMin(data.rspFrom ?? "");
        setMrpMax(data.rspTo ?? "");


        //setSections(data.sections);
        //setDepartments(data.departments);
        setArticleSearch(data.articleName || "");
        setBrands(data.brands); 
        setCat2(data.cat2); 
        setCat3(data.cat3); 
        setCat4(data.cat4); 
        setCat5(data.cat5); 
        setCat6(data.cat6); 
        setDesc1(data.desc1); 
        setDesc2(data.desc2); 
        setDesc3(data.desc3); 
        setDesc4(data.desc4); 
        setDesc5(data.desc5); 
        setDesc6(data.desc6); }} 
        onClose={() => setShowBrandPanel(false)} t={t} />
        }


       
    </div>
  );
}
