import { useState, useRef, useEffect } from "react";
import {
  collection, doc,
  onSnapshot, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/* ─── Styles ────────────────────────────────────────────────── */
const S = {
  page:    { minHeight:"100vh", background:"#08090c", fontFamily:"'Segoe UI',sans-serif", color:"#f0f0f2" },
  layout:  { display:"flex", minHeight:"100vh" },
  sidebar: {
    width:"220px", background:"#0d0f14",
    borderRight:"1px solid rgba(0,200,180,0.1)",
    display:"flex", flexDirection:"column",
    flexShrink:0, position:"sticky", top:0, height:"100vh",
  },
  sideTop:  { padding:"22px 20px 18px", borderBottom:"1px solid rgba(0,200,180,0.1)" },
  sideLogo: { fontFamily:"monospace", fontSize:"15px", fontWeight:"800", color:"#00c8b4", letterSpacing:"0.5px" },
  sideRole: { fontSize:"11px", color:"rgba(255,255,255,0.3)", marginTop:"3px", textTransform:"uppercase", letterSpacing:"1.5px" },
  sideNav:  { padding:"14px 12px", flex:1 },
  navItem: a => ({
    display:"flex", alignItems:"center", gap:"10px",
    padding:"10px 12px", borderRadius:"8px", cursor:"pointer",
    fontSize:"13px", fontWeight: a?"600":"400",
    color: a?"#00c8b4":"rgba(255,255,255,0.5)",
    background: a?"rgba(0,200,180,0.1)":"transparent",
    marginBottom:"4px", transition:"all .15s", userSelect:"none",
  }),
  sideFooter:   { padding:"14px 16px", borderTop:"1px solid rgba(0,200,180,0.1)" },
  viewStoreBtn: {
    width:"100%", background:"#00c8b4", border:"none", color:"#000",
    borderRadius:"8px", padding:"9px", fontSize:"12px", fontWeight:"700",
    cursor:"pointer", letterSpacing:"0.5px",
  },
  main:   { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  topbar: {
    height:"58px", background:"#0d0f14",
    borderBottom:"1px solid rgba(0,200,180,0.1)",
    display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px",
  },
  topTitle: { fontSize:"15px", fontWeight:"600", color:"#f0f0f2" },
  addBtn:   {
    background:"#00c8b4", border:"none", color:"#000", borderRadius:"8px",
    padding:"8px 18px", fontSize:"13px", fontWeight:"700", cursor:"pointer",
    display:"flex", alignItems:"center", gap:"6px",
  },
  content:  { padding:"24px 28px", overflowY:"auto", flex:1 },
  statsRow: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"28px" },
  statCard: { background:"#0d0f14", border:"1px solid rgba(0,200,180,0.12)", borderRadius:"12px", padding:"18px 20px" },
  statLabel:    { fontSize:"11px", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"8px" },
  statVal:      { fontSize:"26px", fontWeight:"800", color:"#f0f0f2" },
  statValGreen: { fontSize:"26px", fontWeight:"800", color:"#00c8b4" },
  statSub:      { fontSize:"11px", color:"rgba(255,255,255,0.25)", marginTop:"4px" },
  sectionHead:  { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" },
  sectionTitle: { fontSize:"14px", fontWeight:"700", color:"#f0f0f2", letterSpacing:"0.3px" },
  grid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:"14px" },

  prodCard:    { background:"#0d0f14", border:"1px solid rgba(0,200,180,0.12)", borderRadius:"12px", overflow:"hidden" },
  prodImgWrap: {
    width:"100%", aspectRatio:"4/3", background:"#111318",
    display:"flex", alignItems:"center", justifyContent:"center",
    overflow:"hidden", position:"relative", cursor:"pointer",
  },
  typeBadge: {
    position:"absolute", top:"8px", left:"8px",
    background:"rgba(8,9,12,0.8)", border:"1px solid rgba(0,200,180,0.25)",
    color:"#00c8b4", borderRadius:"6px", padding:"3px 8px",
    fontSize:"10px", fontWeight:"600", textTransform:"uppercase", letterSpacing:"0.5px",
  },
  stockBadge: low => ({
    position:"absolute", top:"8px", right:"8px",
    background: low?"rgba(255,69,69,0.15)":"rgba(0,200,180,0.1)",
    border:`1px solid ${low?"rgba(255,69,69,0.4)":"rgba(0,200,180,0.3)"}`,
    color: low?"#ff7070":"#00c8b4",
    borderRadius:"6px", padding:"3px 8px", fontSize:"10px", fontWeight:"600",
  }),
  photoToggle: {
    position:"absolute", bottom:"8px", right:"8px",
    background:"rgba(8,9,12,0.75)", border:"1px solid rgba(0,200,180,0.3)",
    color:"#00c8b4", borderRadius:"6px", padding:"3px 10px",
    fontSize:"10px", fontWeight:"700", cursor:"pointer", letterSpacing:"0.3px",
  },
  prodBody:    { padding:"12px 14px" },
  prodName:    { fontSize:"13px", fontWeight:"700", color:"#f0f0f2", marginBottom:"2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", letterSpacing:"0.5px" },
  prodPrice:   { fontSize:"14px", fontWeight:"800", color:"#00c8b4", marginBottom:"4px" },
  prodMeta:    { fontSize:"11px", color:"rgba(255,255,255,0.35)" },
  prodActions: { display:"flex", gap:"6px", padding:"0 14px 12px" },
  actBtn: danger => ({
    flex: danger?"0 0 36px":1,
    background:"rgba(255,255,255,0.04)",
    border:`1px solid ${danger?"rgba(255,69,69,0.25)":"rgba(255,255,255,0.08)"}`,
    color: danger?"#ff7070":"rgba(255,255,255,0.6)",
    borderRadius:"7px", padding:"7px", fontSize:"12px", cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"center", gap:"4px", transition:"all .15s",
  }),

  table: { width:"100%", borderCollapse:"collapse", fontSize:"13px", background:"#0d0f14", border:"1px solid rgba(0,200,180,0.12)", borderRadius:"12px", overflow:"hidden" },
  th:    { padding:"12px 16px", textAlign:"left", fontSize:"11px", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"1px", fontWeight:"400", borderBottom:"1px solid rgba(0,200,180,0.1)", background:"#0d0f14" },
  td:    { padding:"13px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", color:"#f0f0f2" },

  overlay:    { position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" },
  modal:      { background:"#0d0f14", border:"1px solid rgba(0,200,180,0.2)", borderRadius:"16px", width:"100%", maxWidth:"500px", maxHeight:"90vh", overflowY:"auto" },
  modalHead:  { padding:"20px 22px 16px", borderBottom:"1px solid rgba(0,200,180,0.1)", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"#0d0f14", zIndex:1 },
  modalTitle: { fontSize:"16px", fontWeight:"700", color:"#f0f0f2" },
  modalClose: { background:"rgba(255,255,255,0.06)", border:"none", color:"#fff", borderRadius:"8px", width:"32px", height:"32px", cursor:"pointer", fontSize:"18px", display:"flex", alignItems:"center", justifyContent:"center" },
  modalBody:  { padding:"20px 22px" },
  photosRow:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"18px" },
  imgUpload:  { border:"1.5px dashed rgba(0,200,180,0.25)", borderRadius:"10px", padding:"16px 12px", textAlign:"center", cursor:"pointer", transition:"border-color .15s", position:"relative" },
  imgLabel:   { fontSize:"10px", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px", display:"block" },
  clearPhotoBtn: { position:"absolute", top:"6px", right:"6px", background:"rgba(255,69,69,0.2)", border:"none", color:"#ff7070", borderRadius:"50%", width:"20px", height:"20px", cursor:"pointer", fontSize:"12px", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 },
  field:      { marginBottom:"16px" },
  fieldLabel: { display:"block", fontSize:"11px", color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"7px" },
  input:      { width:"100%", background:"#111318", border:"1px solid rgba(0,200,180,0.15)", color:"#f0f0f2", borderRadius:"8px", padding:"10px 14px", fontSize:"13px", outline:"none", fontFamily:"inherit", boxSizing:"border-box" },
  typeToggleRow: { display:"flex", gap:"8px", marginBottom:"16px" },
  typeToggleBtn: a => ({ flex:1, padding:"10px", borderRadius:"8px", border: a?"2px solid #00c8b4":"1px solid rgba(0,200,180,0.15)", background: a?"rgba(0,200,180,0.12)":"#111318", color: a?"#00c8b4":"rgba(255,255,255,0.4)", fontWeight: a?"700":"400", fontSize:"13px", cursor:"pointer", transition:"all .15s", fontFamily:"inherit", letterSpacing:"0.5px" }),
  fieldRow:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" },
  modalFoot:  { padding:"14px 22px", borderTop:"1px solid rgba(0,200,180,0.1)", display:"flex", gap:"8px", justifyContent:"flex-end", position:"sticky", bottom:0, background:"#0d0f14" },
  cancelBtn:  { background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", borderRadius:"8px", padding:"9px 20px", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" },
  saveBtn:    { background:"#00c8b4", border:"none", color:"#000", borderRadius:"8px", padding:"9px 20px", fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" },
  toast: show => ({ position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", background:"#00c8b4", color:"#000", borderRadius:"20px", padding:"8px 20px", fontSize:"13px", fontWeight:"700", opacity: show?1:0, pointerEvents:"none", transition:"opacity .25s", zIndex:999, whiteSpace:"nowrap" }),
  statusBadge: status => ({
    background: status==="Paid"?"rgba(37,211,102,0.12)":status==="Pending"?"rgba(255,200,0,0.12)":"rgba(255,100,100,0.12)",
    color:      status==="Paid"?"#25d366":status==="Pending"?"#f0c040":"#ff7070",
    borderRadius:"20px", padding:"3px 12px", fontSize:"11px", fontWeight:"700",
  }),
  orderBtn: color => ({
    background:"transparent", border:`1px solid ${color}`, color,
    borderRadius:"6px", padding:"4px 10px", fontSize:"10px", fontWeight:"700",
    cursor:"pointer", fontFamily:"inherit", letterSpacing:"0.5px", transition:"all .15s",
  }),
  loadingWrap: { display:"flex", alignItems:"center", justifyContent:"center", padding:"80px 0", gap:"12px", color:"rgba(0,200,180,0.5)", fontSize:"13px" },
};

const NAV = [
  { key:"inventory", label:"Inventory" },
  { key:"orders",    label:"Orders"    },
  { key:"settings",  label:"Settings"  },
];

const ADMIN_MOBILE_CSS = `
  @media (max-width: 768px) {
    .admin-sidebar { transform: translateX(-100%); transition: transform .25s ease; position: fixed !important; z-index: 200; height: 100vh; }
    .admin-sidebar.open { transform: translateX(0); }
    .admin-overlay { display: block !important; }
    .admin-main { width: 100% !important; }
    .admin-topbar { padding: 0 14px !important; }
    .admin-content { padding: 16px 14px !important; }
    .admin-stats { grid-template-columns: 1fr 1fr !important; }
    .admin-grid { grid-template-columns: 1fr 1fr !important; }
    .admin-table-wrap { overflow-x: auto; }
    .admin-table-wrap table { min-width: 580px; }
  }
  @media (max-width: 480px) {
    .admin-stats { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
    .admin-grid { grid-template-columns: 1fr !important; }
    .admin-modal { margin: 0 !important; border-radius: 16px 16px 0 0 !important; position: fixed; bottom: 0; max-height: 92vh !important; }
    .admin-overlay-modal { align-items: flex-end !important; }
  }
`;

function useAdminStyle() {
  useEffect(() => {
    const id = "capstore-admin-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = ADMIN_MOBILE_CSS;
    document.head.appendChild(el);
  }, []);
}

/* ─── Image compression helper ──────────────────────────────── */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 600;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else       { w = Math.round(w * MAX / h); h = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* ─── Cap Card ───────────────────────────────────────────────── */
function CapCard({ cap, onEdit, onDelete }) {
  const [showRear, setShowRear] = useState(false);
  const img      = showRear ? cap.imgRear : cap.imgFront;
  const hasRear  = !!cap.imgRear;
  const hasFront = !!cap.imgFront;

  return (
    <div style={S.prodCard}>
      <div style={S.prodImgWrap} onClick={() => hasRear && setShowRear(v => !v)} title={hasRear ? "Click to flip" : ""}>
        {img
          ? <img src={img} alt={cap.name} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"opacity .2s" }} />
          : <span style={{ fontSize:"36px", opacity:0.2 }}>🧢</span>
        }
        <span style={S.typeBadge}>{cap.type}</span>
        <span style={S.stockBadge(cap.stock <= 2)}>{cap.stock} left</span>
        {(hasFront || hasRear) && (
          <span style={S.photoToggle}>{showRear ? "◀ Front" : "Rear ▶"}</span>
        )}
      </div>
      <div style={S.prodBody}>
        <div style={S.prodName}>{cap.name}</div>
        <div style={S.prodPrice}>KSh {cap.price.toLocaleString()}</div>
        <div style={S.prodMeta}>{cap.color}</div>
      </div>
      <div style={S.prodActions}>
        <button style={S.actBtn(false)} onClick={() => onEdit(cap)}>✏ Edit</button>
        <button style={S.actBtn(true)}  onClick={() => onDelete(cap.id)}>✕</button>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────── */
export default function AdminDashboard() {
  useAdminStyle();

  const [tab,          setTab]         = useState("inventory");
  const [sidebarOpen,  setSidebarOpen] = useState(false);
  const [caps,         setCaps]        = useState([]);
  const [orders,       setOrders]      = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [modal,        setModal]       = useState(null);
  const [form,         setForm]        = useState({});
  const [previewFront, setPreviewFront]= useState(null);
  const [previewRear,  setPreviewRear] = useState(null);
  const [toast,        setToast]       = useState("");
  const [toastShow,    setToastShow]   = useState(false);
  const [saving,       setSaving]      = useState(false);
  const frontRef = useRef();
  const rearRef  = useRef();

  /* ── Real-time listeners ── */
  useEffect(() => {
    const unsubCaps = onSnapshot(
      collection(db, "caps"),
      snap => {
        setCaps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => { console.error("caps listener:", err); setLoading(false); }
    );

    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error("orders listener:", err)
    );

    return () => { unsubCaps(); unsubOrders(); };
  }, []);

  const showToast = msg => {
    setToast(msg); setToastShow(true);
    setTimeout(() => setToastShow(false), 2200);
  };

  /* ── Modal helpers ── */
  const openAdd = () => {
    setForm({ name:"", type:"fitted", price:1350, stock:1, color:"" });
    setPreviewFront(null); setPreviewRear(null);
    setModal({ mode:"add" });
  };

  const openEdit = cap => {
    setForm({ ...cap });
    setPreviewFront(cap.imgFront || null);
    setPreviewRear(cap.imgRear   || null);
    setModal({ mode:"edit", cap });
  };

  /* ── CRUD: Caps ── */
  const deleteCap = async id => {
    try {
      await deleteDoc(doc(db, "caps", id));
      showToast("Cap removed");
    } catch (e) { showToast("Error removing cap"); console.error(e); }
  };

  const saveModal = async () => {
    if (!form.name?.trim()) { showToast("Enter a cap name"); return; }
    setSaving(true);
    const capData = {
      name:     form.name.trim(),
      type:     form.type     || "fitted",
      price:    Number(form.price)  || 0,
      stock:    Number(form.stock)  || 0,
      color:    form.color    || "",
      imgFront: previewFront  || null,
      imgRear:  previewRear   || null,
      img:      previewFront  || previewRear || null,
    };

    try {
      if (modal.mode === "add") {
        await addDoc(collection(db, "caps"), {
          ...capData,
          createdAt: serverTimestamp(),
        });
        showToast("Cap added! ✓");
      } else {
        const { id, ...rest } = capData;
        await updateDoc(doc(db, "caps", modal.cap.id), {
          ...rest,
          updatedAt: serverTimestamp(),
        });
        showToast("Cap updated ✓");
      }
      setModal(null);
    } catch (e) {
      showToast("Error: " + e.message);
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  /* ── CRUD: Orders ── */
  const cycleStatus = async orderId => {
    const cycle = { "Pending":"Confirmed", "Confirmed":"Delivered", "Delivered":"Pending" };
    const order  = orders.find(o => o.id === orderId);
    if (!order) return;
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: cycle[order.status] || "Pending",
        updatedAt: serverTimestamp(),
      });
      showToast("Order status updated");
    } catch (e) { showToast("Error updating order"); console.error(e); }
  };

  const deleteOrder = async orderId => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      showToast("Order removed");
    } catch (e) { showToast("Error removing order"); console.error(e); }
  };

  /* ── Image handler with compression ── */
  const handleImg = side => async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      side === "front" ? setPreviewFront(compressed) : setPreviewRear(compressed);
    } catch (err) {
      console.error("Image compression failed:", err);
      showToast("Failed to process image");
    }
  };

  /* ── Stats ── */
  const totalStock    = caps.reduce((s, c) => s + (c.stock  || 0), 0);
  const estValue      = caps.reduce((s, c) => s + (c.price  || 0) * (c.stock || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "Pending").length;

  return (
    <div style={S.page}>
      <div style={S.layout}>

        {/* mobile overlay */}
        <div
          className="admin-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{ display:"none", position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:199, backdropFilter:"blur(4px)" }}
        />

        {/* ── Sidebar ── */}
        <aside style={S.sidebar} className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
          <div style={S.sideTop}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={S.sideLogo}>_.CAPSTORE.KE</div>
                <div style={S.sideRole}>Seller Dashboard</div>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:"20px", cursor:"pointer", lineHeight:1, padding:"2px" }}>×</button>
            </div>
          </div>
          <nav style={S.sideNav}>
            {NAV.map(n => (
              <div key={n.key} style={S.navItem(tab === n.key)} onClick={() => { setTab(n.key); setSidebarOpen(false); }}>
                <span>{n.label}</span>
                {n.key === "orders" && pendingOrders > 0 && (
                  <span style={{ marginLeft:"auto", background:"#00c8b4", color:"#000", borderRadius:"10px", padding:"1px 7px", fontSize:"10px", fontWeight:"800" }}>
                    {pendingOrders}
                  </span>
                )}
              </div>
            ))}
          </nav>
          <div style={S.sideFooter}>
            <button style={S.viewStoreBtn} onClick={() => window.open("/", "_blank")}>View Storefront →</button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={S.main} className="admin-main">
          <div style={S.topbar} className="admin-topbar">
            <div style={{ display:"flex", alignItems:"center" }}>
              <button
                onClick={() => setSidebarOpen(true)}
                style={{ background:"none", border:"1px solid rgba(0,200,180,0.2)", color:"#00c8b4", borderRadius:"6px", padding:"6px 10px", cursor:"pointer", marginRight:"12px", display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", fontWeight:"600", letterSpacing:"1px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              <span style={S.topTitle}>
                {tab === "inventory" ? "Product Inventory" : tab === "orders" ? "Orders" : "Settings"}
              </span>
            </div>
            {tab === "inventory" && (
              <button style={S.addBtn} onClick={openAdd}>+ Add Cap</button>
            )}
          </div>

          <div style={S.content} className="admin-content">

            {/* ── INVENTORY ── */}
            {tab === "inventory" && (
              <>
                <div style={S.statsRow} className="admin-stats">
                  {[
                    { label:"Products",   val:caps.length,                    sub:"Caps listed",      green:false },
                    { label:"Total Units",val:totalStock,                     sub:"In stock",         green:false },
                    { label:"Est. Value", val:`KSh ${estValue.toLocaleString()}`, sub:"At listing price", green:true  },
                    { label:"Orders",     val:orders.length,                  sub:`${pendingOrders} pending`, green:false },
                  ].map(({ label, val, sub, green }) => (
                    <div key={label} style={S.statCard}>
                      <div style={S.statLabel}>{label}</div>
                      <div style={green ? S.statValGreen : S.statVal}>{val}</div>
                      <div style={S.statSub}>{sub}</div>
                    </div>
                  ))}
                </div>

                <div style={S.sectionHead}>
                  <span style={S.sectionTitle}>All caps ({caps.length})</span>
                </div>

                {loading ? (
                  <div style={S.loadingWrap}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation:"spin 1s linear infinite" }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Loading inventory…
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </div>
                ) : caps.length === 0 ? (
                  <div style={{ padding:"60px 0", textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:"14px", fontStyle:"italic" }}>
                    No caps yet. Add your first cap above.
                  </div>
                ) : (
                  <div style={S.grid} className="admin-grid">
                    {caps.map(cap => (
                      <CapCard key={cap.id} cap={cap} onEdit={openEdit} onDelete={deleteCap} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── ORDERS ── */}
            {tab === "orders" && (
              <>
                <div style={S.sectionHead}>
                  <span style={S.sectionTitle}>Orders ({orders.length})</span>
                  {orders.length > 0 && (
                    <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)" }}>Click status to cycle</span>
                  )}
                </div>

                {orders.length === 0 ? (
                  <div style={{ padding:"80px 0", textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:"14px", fontStyle:"italic" }}>
                    No orders yet.<br />
                    <span style={{ fontSize:"12px", display:"block", marginTop:"8px", color:"rgba(0,200,180,0.4)" }}>
                      Orders placed via WhatsApp on the storefront will appear here.
                    </span>
                  </div>
                ) : (
                  <div className="admin-table-wrap">
                    <table style={S.table}>
                      <thead>
                        <tr>{["Order","Customer","Items","Total","Status","Date",""].map(h => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o.id}>
                            <td style={{ ...S.td, color:"#00c8b4", fontWeight:"700", fontSize:"12px" }}>{o.id}</td>
                            <td style={S.td}>
                              <div style={{ fontWeight:"600", marginBottom:"2px" }}>{o.customer || "—"}</div>
                              {o.phone && <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)" }}>{o.phone}</div>}
                            </td>
                            <td style={{ ...S.td, color:"rgba(255,255,255,0.5)", fontSize:"12px", maxWidth:"180px" }}>
                              {Array.isArray(o.items)
                                ? o.items.map((item, i) => <div key={i} style={{ marginBottom:"2px" }}>{item}</div>)
                                : o.item || "—"
                              }
                            </td>
                            <td style={{ ...S.td, fontWeight:"700", color:"#00c8b4" }}>KSh {(o.total || 0).toLocaleString()}</td>
                            <td style={S.td}>
                              <span
                                style={{ ...S.statusBadge(o.status), cursor:"pointer" }}
                                title="Click to update status"
                                onClick={() => cycleStatus(o.id)}
                              >{o.status || "Pending"}</span>
                            </td>
                            <td style={{ ...S.td, color:"rgba(255,255,255,0.3)", fontSize:"12px", whiteSpace:"nowrap" }}>
                              {o.date || (o.createdAt?.toDate?.()?.toLocaleDateString("en-KE", { day:"numeric", month:"short" })) || "—"}
                            </td>
                            <td style={S.td}>
                              <button style={S.orderBtn("rgba(255,69,69,0.6)")} onClick={() => deleteOrder(o.id)}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* ── SETTINGS ── */}
            {tab === "settings" && (
              <div style={{ maxWidth:"460px" }}>
                <div style={{ marginBottom:"20px", fontSize:"13px", color:"rgba(255,255,255,0.4)", lineHeight:"1.6" }}>
                  Configure your store details below.
                </div>
                {[
                  { label:"Store Name",      placeholder:"_.caps_store kenya",  key:"storeName" },
                  { label:"WhatsApp Number", placeholder:"254712345678",         key:"waNumber"  },
                  { label:"Location / City", placeholder:"Nairobi, Kenya",       key:"location"  },
                ].map(f => (
                  <div key={f.key} style={S.field}>
                    <label style={S.fieldLabel}>{f.label}</label>
                    <input
                      style={S.input}
                      placeholder={f.placeholder}
                      defaultValue={localStorage.getItem("capstore_setting_" + f.key) || ""}
                      onBlur={e => localStorage.setItem("capstore_setting_" + f.key, e.target.value)}
                    />
                  </div>
                ))}
                <button
                  style={{ ...S.saveBtn, padding:"11px 28px", marginTop:"6px" }}
                  onClick={() => showToast("Settings saved ✓")}
                >Save Settings</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>{modal.mode === "add" ? "Add new cap" : "Edit cap"}</span>
              <button style={S.modalClose} onClick={() => setModal(null)}>×</button>
            </div>
            <div style={S.modalBody}>
              {/* Photos */}
              <div style={S.photosRow}>
                {[
                  ["front","📷","Front photo", previewFront, setPreviewFront, frontRef],
                  ["rear", "🔄","Rear photo",  previewRear,  setPreviewRear,  rearRef],
                ].map(([side, icon, lbl, preview, setPreview, ref]) => (
                  <div key={side}>
                    <span style={S.imgLabel}>{lbl}</span>
                    <div style={S.imgUpload} onClick={() => ref.current.click()}>
                      {preview ? (
                        <>
                          <img src={preview} alt={side} style={{ width:"100%", maxHeight:"110px", objectFit:"contain", borderRadius:"6px", marginBottom:"4px" }} />
                          <button style={S.clearPhotoBtn} onClick={e => { e.stopPropagation(); setPreview(null); }}>×</button>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize:"24px", marginBottom:"4px", opacity:0.4 }}>{icon}</div>
                          <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)" }}>Upload {side}</div>
                        </>
                      )}
                      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImg(side)} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Type */}
              <div style={S.field}>
                <label style={S.fieldLabel}>Cap type</label>
                <div style={S.typeToggleRow}>
                  {["fitted","snapback"].map(t => (
                    <button key={t} style={S.typeToggleBtn(form.type === t)} onClick={() => setForm(p => ({ ...p, type:t }))}>
                      {t === "fitted" ? "🧢 Fitted" : "🔄 Snapback"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div style={S.field}>
                <label style={S.fieldLabel}>Cap name</label>
                <input
                  style={S.input} value={form.name || ""} placeholder="e.g. Yankees 9FIFTY"
                  onChange={e => setForm(p => ({ ...p, name:e.target.value }))}
                />
              </div>

              {/* Price + Stock */}
              <div style={S.fieldRow}>
                <div style={S.field}>
                  <label style={S.fieldLabel}>Price (KSh)</label>
                  <input
                    style={S.input} type="number" value={form.price || ""}
                    onChange={e => setForm(p => ({ ...p, price:parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div style={S.field}>
                  <label style={S.fieldLabel}>Stock units</label>
                  <input
                    style={S.input} type="number" value={form.stock || ""}
                    onChange={e => setForm(p => ({ ...p, stock:parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Color */}
              <div style={S.field}>
                <label style={S.fieldLabel}>Color / Description</label>
                <input
                  style={S.input} value={form.color || ""} placeholder="e.g. Black / White"
                  onChange={e => setForm(p => ({ ...p, color:e.target.value }))}
                />
              </div>
            </div>

            <div style={S.modalFoot}>
              <button style={S.cancelBtn} onClick={() => setModal(null)}>Cancel</button>
              <button style={{ ...S.saveBtn, opacity: saving ? 0.6 : 1 }} onClick={saveModal} disabled={saving}>
                {saving ? "Saving…" : modal.mode === "add" ? "Add Cap" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={S.toast(toastShow)}>{toast}</div>
    </div>
  );
}