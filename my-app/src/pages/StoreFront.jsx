import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import "./StoreFront.css";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import { db, authReady } from "../firebase";

import heroCap from "../assets/hero-red-cap.png";


/* =========================================================
   ICONS
   ========================================================= */

function Icon({ type, size = 24 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (type === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (type === "user") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c.8-4.2 3.4-6.5 8-6.5s7.2 2.3 8 6.5" />
      </svg>
    );
  }

  if (type === "cart") {
    return (
      <svg {...common}>
        <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.5L21 8H6" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>
    );
  }

  if (type === "truck") {
    return (
      <svg {...common}>
        <path d="M3 6h11v10H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    );
  }

  if (type === "shield") {
    return (
      <svg {...common}>
        <path d="M12 3 20 6v5c0 5-3.2 8.2-8 10-4.8-1.8-8-5-8-10V6l8-3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    );
  }

  if (type === "heart") {
    return (
      <svg {...common}>
        <path d="M20.8 8.9c0 5.5-8.8 10.1-8.8 10.1S3.2 14.4 3.2 8.9A4.8 4.8 0 0 1 12 6.2a4.8 4.8 0 0 1 8.8 2.7Z" />
      </svg>
    );
  }

  if (type === "diamond") {
    return (
      <svg {...common}>
        <path d="m12 3 8 4-8 14L4 7l8-4Z" />
        <path d="M4 7h16M8 5l4 16 4-16" />
      </svg>
    );
  }

  if (type === "crown") {
    return (
      <svg {...common}>
        <path d="m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Z" />
        <path d="M5 19h14" />
      </svg>
    );
  }

  return null;
}


/* =========================================================
   HELPERS
   ========================================================= */

function formatCategory(type) {
  const value = String(type || "").toLowerCase();

  if (value === "fitted") return "FITTED";
  if (value === "snapback") return "SNAPBACK";
  if (value === "street") return "STREET";

  return value ? value.toUpperCase() : "CAP";
}


function getProductImage(product) {
  return (
    product?.imgFront ||
    product?.img ||
    product?.imgRear ||
    heroCap
  );
}


/*
 * Front/rear pair for a cap. Rear falls back to front (and
 * vice versa) so cards and the modal always have something
 * to show even if the admin only uploaded one side.
 */
function getProductImages(product) {
  const front =
    product?.imgFront ||
    product?.img ||
    product?.imgRear ||
    heroCap;

  const rear =
    product?.imgRear ||
    product?.imgFront ||
    product?.img ||
    heroCap;

  return {
    front,
    rear,
    hasRear: Boolean(product?.imgRear),
  };
}


function getCreatedTime(product) {
  const createdAt = product?.createdAt;

  if (!createdAt) return 0;

  if (typeof createdAt.toMillis === "function") {
    return createdAt.toMillis();
  }

  if (typeof createdAt.seconds === "number") {
    return createdAt.seconds * 1000;
  }

  if (createdAt instanceof Date) {
    return createdAt.getTime();
  }

  return 0;
}


/* =========================================================
   MAIN STOREFRONT
   ========================================================= */

export default function StoreFront() {

  const [activePage, setActivePage] = useState("home");

  const [activeCategory, setActiveCategory] = useState("ALL");

  const [searchOpen, setSearchOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [cartOpen, setCartOpen] = useState(false);

  const [cart, setCart] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);

  /* Quantity picker for the currently open product modal */
  const [modalQuantity, setModalQuantity] = useState(1);

  /* Firebase products */
  const [products, setProducts] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(true);

  const [firebaseError, setFirebaseError] = useState("");


  /*
   * Reset the modal quantity picker back to 1 every time a
   * different product is opened, so it never carries over a
   * stale quantity from whatever cap was viewed previously.
   */
  useEffect(() => {

    setModalQuantity(1);

  }, [selectedProduct]);


  /* =======================================================
     FIREBASE REAL-TIME CAP LISTENER
     ======================================================= */

  useEffect(() => {
    let unsubscribe = null;
    let cancelled = false;

    const startListener = async () => {
      try {

        /*
         * Admin.jsx already uses authReady before listening
         * to the "caps" collection.
         *
         * We do the same here so Firestore security rules
         * that require authentication continue to work.
         */

        await authReady;

        if (cancelled) return;

        unsubscribe = onSnapshot(
          collection(db, "caps"),

          (snapshot) => {

            const firebaseCaps = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            /*
             * Convert Firebase data into the structure
             * expected by the StoreFront.
             */

            const formattedCaps = firebaseCaps.map((cap) => ({
              ...cap,

              id: cap.id,

              name: cap.name || "Unnamed Cap",

              category: formatCategory(cap.type),

              color: cap.color || "Classic",

              price: Number(cap.price) || 0,

              stock: Number(cap.stock) || 0,

              image:
                cap.imgFront ||
                cap.img ||
                cap.imgRear ||
                null,

              filter: "",
            }));

            setProducts(formattedCaps);

            setLoadingProducts(false);

            setFirebaseError("");
          },

          (error) => {
            console.error("StoreFront caps listener:", error);

            setFirebaseError(
              "Unable to load caps from the store."
            );

            setLoadingProducts(false);
          }
        );

      } catch (error) {

        console.error("StoreFront Firebase error:", error);

        setFirebaseError(
          "Unable to connect to the store."
        );

        setLoadingProducts(false);
      }
    };

    startListener();

    return () => {
      cancelled = true;

      if (unsubscribe) {
        unsubscribe();
      }
    };

  }, []);


  /* =======================================================
     SORT PRODUCTS
     ======================================================= */

  const sortedProducts = useMemo(() => {

    return [...products].sort(
      (a, b) =>
        getCreatedTime(b) -
        getCreatedTime(a)
    );

  }, [products]);


  /* =======================================================
     FILTER PRODUCTS
     ======================================================= */

  const filteredProducts = useMemo(() => {

    const term = searchTerm.trim().toLowerCase();

    return sortedProducts.filter((product) => {

      const categoryMatch =
        activeCategory === "ALL" ||
        product.category === activeCategory;

      const searchMatch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.color.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term);

      return categoryMatch && searchMatch;
    });

  }, [
    sortedProducts,
    activeCategory,
    searchTerm,
  ]);


  /* =======================================================
     NEW ARRIVALS
     ======================================================= */

  const newArrivals = useMemo(() => {

    return sortedProducts.slice(0, 6);

  }, [sortedProducts]);


  /* =======================================================
     HERO PRODUCT
     ======================================================= */

  const heroProduct = sortedProducts[0] || null;

  /*
   * Keep the storefront hero image permanently tied to the
   * imported asset. Updating/replacing hero-red-cap.png in
   * src/assets will automatically update this image.
   */
  const heroImage = heroCap;


  /* =======================================================
     CART
     ======================================================= */

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );


  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
      item.quantity,
    0
  );


  /* =======================================================
     MONEY
     ======================================================= */

  const money = (amount) =>
    new Intl.NumberFormat(
      "en-KE",
      {
        style: "currency",
        currency: "KES",
        maximumFractionDigits: 0,
      }
    ).format(Number(amount) || 0);


  /* =======================================================
     NAVIGATION
     ======================================================= */

  const goTo = (page) => {

    setActivePage(page);

    setSelectedProduct(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  /* =======================================================
     CART FUNCTIONS
     ======================================================= */

  /*
   * addToCart now accepts an optional quantity (defaults to 1
   * so every existing call site that only passes a product
   * still behaves exactly as before). Whatever quantity is
   * passed in is clamped to available stock, whether the item
   * is brand new to the cart or already sitting in it.
   */
  const addToCart = (product, qty = 1) => {

    const stock = Number(product.stock) || 0;

    if (stock <= 0) {
      return;
    }

    const requestedQty = Math.max(
      1,
      Math.floor(Number(qty) || 1)
    );

    setCart((current) => {

      const existing =
        current.find(
          (item) =>
            item.id === product.id
        );

      if (existing) {

        /*
         * Don't allow cart quantity to exceed stock.
         */

        const newQuantity = Math.min(
          stock,
          existing.quantity + requestedQty
        );

        if (newQuantity === existing.quantity) {
          return current;
        }

        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: newQuantity,
              }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          quantity: Math.min(
            stock,
            requestedQty
          ),
        },
      ];

    });

    setCartOpen(true);
  };


  const removeFromCart = (id) => {

    setCart((current) =>
      current.filter(
        (item) =>
          item.id !== id
      )
    );

  };


  const updateQuantity = (
    id,
    change
  ) => {

    setCart((current) =>

      current
        .map((item) => {

          if (item.id !== id) {
            return item;
          }

          const newQuantity =
            item.quantity + change;

          const maxStock =
            Number(item.stock) || 999999;

          return {
            ...item,
            quantity: Math.min(
              maxStock,
              Math.max(
                1,
                newQuantity
              )
            ),
          };

        })
        .filter(
          (item) =>
            item.quantity > 0
        )

    );
  };


  /* =======================================================
     WHATSAPP CHECKOUT
     ======================================================= */

  /*
   * WhatsApp can only pre-fill TEXT into wa.me links - there is
   * no way to attach an actual photo file this way. What we can
   * do is drop a direct, hosted (https://) image URL into the
   * message: WhatsApp auto-generates a photo preview card for a
   * link like that. Note WhatsApp typically only renders a full
   * preview card for one link per message (usually the first),
   * so with multiple items only the first tends to show a real
   * thumbnail - the rest still show as tappable photo links.
   *
   * Base64 data-URL images (inline-saved instead of uploaded to
   * Storage) can't be previewed by WhatsApp at all, so those are
   * skipped entirely rather than dumping raw text into the chat.
   */
  const checkoutWhatsApp = () => {

    if (!cart.length) return;

    const isLinkableImage = (src) =>
      typeof src === "string" &&
      /^https?:\/\//i.test(src);

    const orderLines =
      cart
        .map((item) => {

          const image =
            getProductImage(item);

          const line = `*${item.name}* (${item.color}) x${item.quantity} - ${money(
            item.price *
              item.quantity
          )}`;

          return isLinkableImage(image)
            ? `${line}\n📸 ${image}`
            : line;

        })
        .join("\n\n");

    const message = `Hello CAPSTORE 👋

I would like to order:

${orderLines}

Total: ${money(cartTotal)}

Please let me know about delivery and payment.`;

    window.open(
      `https://wa.me/254796248712?text=${encodeURIComponent(
        message
      )}`,
      "_blank"
    );
  };


  /* =======================================================
     RENDER
     ======================================================= */

  return (

    <div className="capstore-app">

      {/* ===================================================
          TOP BAR
          =================================================== */}

      <div className="capstore-topbar">

        <div className="topbar-item">

          <span className="topbar-icon green">
            <Icon
              type="truck"
              size={19}
            />
          </span>

          FREE NAIROBI CBD DELIVERY

        </div>


        <div className="topbar-item">

          <span className="topbar-icon purple">
            <Icon
              type="crown"
              size={19}
            />
          </span>

          PREMIUM QUALITY FITTED & SNAPBACK CAPS

        </div>


        <div className="topbar-item">

          <span className="topbar-icon green">

            <span className="whatsapp-symbol">
              ◉
            </span>

          </span>

          ORDER DIRECTLY ON WHATSAPP

        </div>

      </div>


      {/* ===================================================
          NAVIGATION
          =================================================== */}

      <header className="capstore-header">

        <div
          className="capstore-logo"
          onClick={() =>
            goTo("home")
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" ||
              e.key === " "
            ) {
              goTo("home");
            }
          }}
        >

          <div className="logo-box">
            C
          </div>


          <div className="logo-text-wrap">

            <div className="logo-word">
              CAP<span>STORE</span>
            </div>

            <div className="logo-tagline">
              WEAR YOUR STYLE
            </div>

          </div>

        </div>


        <nav className="capstore-nav">

          <button
            className={`nav-link home ${
              activePage === "home"
                ? "active"
                : ""
            }`}
            onClick={() =>
              goTo("home")
            }
          >
            Home
          </button>


          <button
            className={`nav-link shop ${
              activePage === "shop"
                ? "active"
                : ""
            }`}
            onClick={() =>
              goTo("shop")
            }
          >
            Shop
          </button>


          <button
            className={`nav-link arrivals ${
              activePage === "arrivals"
                ? "active"
                : ""
            }`}
            onClick={() =>
              goTo("arrivals")
            }
          >
            New Arrivals
          </button>


          <button
            className={`nav-link collections ${
              activePage === "collections"
                ? "active"
                : ""
            }`}
            onClick={() =>
              goTo("collections")
            }
          >
            Collections
          </button>


          <button
            className={`nav-link why ${
              activePage === "why"
                ? "active"
                : ""
            }`}
            onClick={() =>
              goTo("why")
            }
          >
            Why Us
          </button>

        </nav>


        <div className="nav-actions">

          <button
            className="nav-icon-button"
            onClick={() =>
              setSearchOpen(
                !searchOpen
              )
            }
            aria-label="Search"
          >
            <Icon
              type="search"
              size={25}
            />
          </button>


          <button
            className="nav-icon-button"
            aria-label="Account"
          >
            <Icon
              type="user"
              size={25}
            />
          </button>


          <button
            className="nav-icon-button cart-button"
            onClick={() =>
              setCartOpen(true)
            }
            aria-label="Shopping cart"
          >

            <Icon
              type="cart"
              size={27}
            />

            {cartCount > 0 && (

              <span className="cart-count">
                {cartCount}
              </span>

            )}

          </button>

        </div>

      </header>


      {/* ===================================================
          SEARCH
          =================================================== */}

      {searchOpen && (

        <div className="search-panel">

          <div className="search-inner">

            <Icon
              type="search"
              size={22}
            />

            <input
              autoFocus
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              placeholder="Search caps by name or colour..."
            />

            <button
              onClick={() => {

                setSearchTerm("");

                setSearchOpen(false);

              }}
            >
              ×
            </button>

          </div>

        </div>

      )}


      {/* ===================================================
          HOME
          =================================================== */}

      {activePage === "home" && (

        <>

          <section className="hero-section">

            <div className="hero-copy">

              <div className="hero-eyebrow">

                <span className="eyebrow-line"></span>

                PREMIUM HEADWEAR

              </div>


              <h1>

                WEAR YOUR

                <br />

                <span className="style-word">
                  STYLE.
                </span>

              </h1>


              <p>
                Find premium fitted,
                snapback and classic
                caps that match your
                personality.
              </p>


              <button
                className="primary-blue-button"
                onClick={() =>
                  goTo("shop")
                }
              >
                Shop The Collection
                <span>→</span>
              </button>

            </div>


            <div className="hero-product">

              <div className="blue-glow-ring"></div>

              <div className="hero-platform"></div>


              <img
                src={heroImage}
                alt={
                  heroProduct?.name ||
                  "Premium cap"
                }
                className="hero-cap-image"
              />


              <div className="hero-label">

                <strong>
                  {heroProduct
                    ? heroProduct.name
                    : "CAPSTORE"}
                </strong>

                <small>
                  {heroProduct
                    ? heroProduct.category
                    : "PREMIUM FITTED"}
                </small>

              </div>

            </div>

          </section>


          <Benefits />


          <WhyPreview
            goTo={goTo}
          />


          <FeaturedProducts
            products={
              loadingProducts
                ? []
                : sortedProducts.slice(
                    0,
                    3
                  )
            }
            loading={loadingProducts}
            money={money}
            addToCart={addToCart}
            setSelectedProduct={
              setSelectedProduct
            }
          />

        </>

      )}


      {/* ===================================================
          SHOP
          =================================================== */}

      {activePage === "shop" && (

        <ShopPage
          products={filteredProducts}
          activeCategory={
            activeCategory
          }
          setActiveCategory={
            setActiveCategory
          }
          money={money}
          addToCart={addToCart}
          setSelectedProduct={
            setSelectedProduct
          }
          loading={loadingProducts}
          error={firebaseError}
        />

      )}


      {/* ===================================================
          NEW ARRIVALS
          =================================================== */}

      {activePage === "arrivals" && (

        <ShopPage
          title="NEW ARRIVALS"
          subtitle="Fresh drops. Clean fits. New energy."
          products={newArrivals}
          activeCategory="ALL"
          setActiveCategory={() => {}}
          money={money}
          addToCart={addToCart}
          setSelectedProduct={
            setSelectedProduct
          }
          hideFilters
          loading={loadingProducts}
          error={firebaseError}
        />

      )}


      {/* ===================================================
          COLLECTIONS
          =================================================== */}

      {activePage === "collections" && (

        <ShopPage
          title="COLLECTIONS"
          subtitle="Choose the colour. Build the look."
          products={filteredProducts}
          activeCategory={
            activeCategory
          }
          setActiveCategory={
            setActiveCategory
          }
          money={money}
          addToCart={addToCart}
          setSelectedProduct={
            setSelectedProduct
          }
          loading={loadingProducts}
          error={firebaseError}
        />

      )}


      {/* ===================================================
          WHY US
          =================================================== */}

      {activePage === "why" && (
        <WhyPage goTo={goTo} />
      )}


      {/* ===================================================
          PRODUCT MODAL
          =================================================== */}

      {selectedProduct && (

        <div
          className="product-modal-overlay"
          onClick={() =>
            setSelectedProduct(null)
          }
        >

          <div
            className="product-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="modal-close"
              onClick={() =>
                setSelectedProduct(null)
              }
            >
              ×
            </button>


            <ModalImage
              key={selectedProduct.id}
              product={selectedProduct}
            />


            <div className="modal-details">

              <span className="product-category">
                {selectedProduct.category}
              </span>


              <h2>
                {selectedProduct.name}
              </h2>


              <p className="modal-colour">
                Colour:{" "}
                <strong>
                  {selectedProduct.color}
                </strong>
              </p>


              <div className="modal-price">
                {money(
                  selectedProduct.price
                )}
              </div>


              <p>
                Premium everyday
                headwear designed for
                a clean fit and
                effortless style.
              </p>


              {Number(
                selectedProduct.stock
              ) > 0 ? (

                <>

                  <div className="quantity-controls modal-quantity-controls">

                    <button
                      onClick={() =>
                        setModalQuantity(
                          (q) =>
                            Math.max(
                              1,
                              q - 1
                            )
                        )
                      }
                      disabled={
                        modalQuantity <= 1
                      }
                      style={
                        modalQuantity <= 1
                          ? {
                              opacity: 0.35,
                              cursor: "not-allowed",
                            }
                          : undefined
                      }
                    >
                      −
                    </button>


                    <b>
                      {modalQuantity}
                    </b>


                    <button
                      onClick={() =>
                        setModalQuantity(
                          (q) =>
                            Math.min(
                              Number(
                                selectedProduct.stock
                              ),
                              q + 1
                            )
                        )
                      }
                      disabled={
                        modalQuantity >=
                        Number(selectedProduct.stock)
                      }
                      style={
                        modalQuantity >=
                        Number(selectedProduct.stock)
                          ? {
                              opacity: 0.35,
                              cursor: "not-allowed",
                            }
                          : undefined
                      }
                    >
                      +
                    </button>

                  </div>


                  {modalQuantity >=
                    Number(selectedProduct.stock) && (

                    <small
                      style={{
                        display: "block",
                        marginTop: "-8px",
                        marginBottom: "12px",
                        color: "#ff7070",
                        fontSize: "10px",
                      }}
                    >
                      Max stock reached (
                      {selectedProduct.stock} available)
                    </small>

                  )}


                  <button
                    className="primary-blue-button full-button"
                    onClick={() => {

                      addToCart(
                        selectedProduct,
                        modalQuantity
                      );

                      setSelectedProduct(
                        null
                      );

                    }}
                  >
                    Add To Bag →
                  </button>

                </>

              ) : (

                <button
                  className="primary-blue-button full-button"
                  disabled
                  style={{
                    opacity: 0.45,
                    cursor: "not-allowed",
                  }}
                >
                  OUT OF STOCK
                </button>

              )}

            </div>

          </div>

        </div>

      )}


      {/* ===================================================
          CART
          =================================================== */}

      {cartOpen && (

        <div
          className="cart-overlay"
          onClick={() =>
            setCartOpen(false)
          }
        >

          <aside
            className="cart-drawer"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="cart-header">

              <div>

                <span className="cart-small-title">
                  YOUR
                </span>

                <h2>
                  SHOPPING BAG
                </h2>

              </div>


              <button
                onClick={() =>
                  setCartOpen(false)
                }
              >
                ×
              </button>

            </div>


            {!cart.length ? (

              <div className="empty-cart">

                <div className="empty-cart-icon">

                  <Icon
                    type="cart"
                    size={48}
                  />

                </div>


                <h3>
                  Your bag is empty.
                </h3>


                <p>
                  Find a cap that fits
                  your style and add it
                  to your collection.
                </p>


                <button
                  className="primary-blue-button"
                  onClick={() => {

                    setCartOpen(false);

                    goTo("shop");

                  }}
                >
                  Shop Caps →
                </button>

              </div>

            ) : (

              <>

                <div className="cart-items">

                  {cart.map((item) => (

                    <div
                      className="cart-item"
                      key={item.id}
                    >

                      <div className="cart-item-image">

                        <img
                          src={getProductImage(
                            item
                          )}
                          alt={item.name}
                          className="product-cap-image"
                        />

                      </div>


                      <div className="cart-item-info">

                        <span>
                          {item.category}
                        </span>


                        <h3>
                          {item.name}
                        </h3>


                        <p>
                          {item.color}
                        </p>


                        <strong>
                          {money(
                            item.price
                          )}
                        </strong>


                        <div className="quantity-controls">

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                -1
                              )
                            }
                            disabled={
                              item.quantity <= 1
                            }
                            style={
                              item.quantity <= 1
                                ? {
                                    opacity: 0.35,
                                    cursor: "not-allowed",
                                  }
                                : undefined
                            }
                          >
                            −
                          </button>


                          <b>
                            {item.quantity}
                          </b>


                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                1
                              )
                            }
                            disabled={
                              item.quantity >=
                              (Number(item.stock) || 0)
                            }
                            style={
                              item.quantity >=
                              (Number(item.stock) || 0)
                                ? {
                                    opacity: 0.35,
                                    cursor: "not-allowed",
                                  }
                                : undefined
                            }
                          >
                            +
                          </button>

                        </div>


                        {item.quantity >=
                          (Number(item.stock) || 0) && (

                          <small
                            style={{
                              display: "block",
                              marginTop: "4px",
                              color: "#ff7070",
                              fontSize: "10px",
                            }}
                          >
                            Max stock reached
                            ({item.stock} available)
                          </small>

                        )}

                      </div>


                      <button
                        className="remove-item"
                        onClick={() =>
                          removeFromCart(
                            item.id
                          )
                        }
                      >
                        ×
                      </button>

                    </div>

                  ))}

                </div>


                <div className="cart-footer">

                  <div className="cart-total">

                    <span>
                      Total
                    </span>

                    <strong>
                      {money(cartTotal)}
                    </strong>

                  </div>


                  <button
                    className="whatsapp-button"
                    onClick={
                      checkoutWhatsApp
                    }
                  >
                    Order On WhatsApp →
                  </button>


                  <small>
                    Nairobi CBD delivery
                    available. Kenya-wide
                    delivery available.
                  </small>

                </div>

              </>

            )}

          </aside>

        </div>

      )}


      {/* ===================================================
          FOOTER
          =================================================== */}

      <footer className="capstore-footer">

        <div className="footer-brand">

          <div className="footer-logo">
            CAP<span>STORE</span>
          </div>

          <p>
            WEAR YOUR STYLE.
          </p>

        </div>


        <div className="footer-links">

          <button
            onClick={() =>
              goTo("shop")
            }
          >
            Shop
          </button>


          <button
            onClick={() =>
              goTo("arrivals")
            }
          >
            New Arrivals
          </button>


          <button
            onClick={() =>
              goTo("collections")
            }
          >
            Collections
          </button>


          <button
            onClick={() =>
              goTo("why")
            }
          >
            Why Us
          </button>

        </div>


        <div className="footer-copy">

          © {new Date().getFullYear()}{" "}
          CAPSTORE. Nairobi, Kenya.

        </div>

      </footer>

    </div>

  );
}


/* =========================================================
   BENEFITS
   ========================================================= */

function Benefits() {

  const benefits = [

    {
      icon: "diamond",
      color: "green",
      title: "Premium Quality",
      text: "Authentic & Durable",
    },

    {
      icon: "truck",
      color: "green",
      title: "Nationwide Delivery",
      text: "Across Kenya",
    },

    {
      icon: "shield",
      color: "purple",
      title: "Secure Payments",
      text: "Safe & Easy",
    },

    {
      icon: "heart",
      color: "cyan",
      title: "Loved by Cap Lovers",
      text: "Join Our Community",
    },

  ];


  return (

    <section className="benefits-section">

      {benefits.map(
        (benefit) => (

          <div
            className="benefit-card"
            key={benefit.title}
          >

            <div
              className={`benefit-icon ${benefit.color}`}
            >
              <Icon
                type={benefit.icon}
                size={31}
              />
            </div>


            <div>

              <strong>
                {benefit.title}
              </strong>

              <span>
                {benefit.text}
              </span>

            </div>

          </div>

        )
      )}

    </section>

  );
}


/* =========================================================
   WHY PREVIEW
   ========================================================= */

function WhyPreview({ goTo }) {

  return (

    <section className="why-preview">

      <div className="section-heading-line green-line"></div>


      <h2>
        WHY <span>CAPSTORE</span>?
      </h2>


      <div className="section-heading-line blue-line"></div>


      <h3>
        A GOOD CAP{" "}
        <span>
          CHANGES THE LOOK.
        </span>
      </h3>


      <p>
        We are building a cap
        store around one simple
        idea: you should be able
        to find a cap that looks
        premium, feels right and
        fits your style.
      </p>


      <button
        className="outline-button"
        onClick={() =>
          goTo("why")
        }
      >
        Why CAPSTORE? →
      </button>

    </section>

  );
}


/* =========================================================
   FEATURED PRODUCTS
   ========================================================= */

function FeaturedProducts({
  products,
  loading,
  money,
  addToCart,
  setSelectedProduct,
}) {

  return (

    <section className="featured-section">

      <div className="featured-header">

        <div>

          <span>
            OUR PICKS
          </span>

          <h2>
            SHOP THE LOOK.
          </h2>

        </div>


        <div className="featured-header-line"></div>

      </div>


      {loading ? (

        <div className="no-products">

          <h3>
            Loading caps...
          </h3>

          <p>
            Getting the latest
            caps from the store.
          </p>

        </div>

      ) : products.length ? (

        <div className="products-grid">

          {products.map(
            (product) => (

              <ProductCard
                key={product.id}
                product={product}
                money={money}
                addToCart={addToCart}
                setSelectedProduct={
                  setSelectedProduct
                }
              />

            )
          )}

        </div>

      ) : (

        <div className="no-products">

          <h3>
            No caps yet.
          </h3>

          <p>
            Upload your first cap
            from the Admin dashboard
            and it will appear here
            automatically.
          </p>

        </div>

      )}

    </section>

  );
}


/* =========================================================
   SHOP PAGE
   ========================================================= */

function ShopPage({
  title = "SHOP THE COLLECTION",
  subtitle = "Premium caps. Clean fits. Everyday style.",
  products,
  activeCategory,
  setActiveCategory,
  money,
  addToCart,
  setSelectedProduct,
  hideFilters = false,
  loading = false,
  error = "",
}) {

  const categories = [
    "ALL",
    "FITTED",
    "SNAPBACK",
    "STREET",
  ];


  return (

    <main className="shop-page">

      <section className="shop-heading">

        <span className="shop-heading-label">
          CAPSTORE COLLECTION
        </span>


        <h1>
          {title}
        </h1>


        <p>
          {subtitle}
        </p>

      </section>


      {!hideFilters && (

        <div className="category-tabs">

          {categories.map(
            (category) => (

              <button
                key={category}
                className={
                  activeCategory ===
                  category
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setActiveCategory(
                    category
                  )
                }
              >
                {category}
              </button>

            )
          )}

        </div>

      )}


      {error && (

        <div className="no-products">

          <h3>
            Store connection problem
          </h3>

          <p>
            {error}
          </p>

        </div>

      )}


      <section className="shop-products">

        {loading ? (

          <div className="no-products">

            <h3>
              Loading caps...
            </h3>

          </div>

        ) : products.length ? (

          products.map(
            (product) => (

              <ProductCard
                key={product.id}
                product={product}
                money={money}
                addToCart={addToCart}
                setSelectedProduct={
                  setSelectedProduct
                }
              />

            )
          )

        ) : (

          <div className="no-products">

            <h3>
              No caps found.
            </h3>

            <p>
              Try another search or
              category.
            </p>

          </div>

        )}

      </section>

    </main>

  );
}


/* =========================================================
   PRODUCT CARD
   ========================================================= */

function ProductCard({
  product,
  money,
  addToCart,
  setSelectedProduct,
}) {

  const { front, rear, hasRear } =
    getProductImages(product);

  const [showRear, setShowRear] =
    useState(false);

  const outOfStock =
    Number(product.stock) <= 0;


  return (

    <article className="product-card">

      <button
        className="product-image-container"
        onClick={() =>
          setSelectedProduct(product)
        }
        onMouseEnter={() =>
          hasRear && setShowRear(true)
        }
        onMouseLeave={() =>
          setShowRear(false)
        }
      >

        <div className="product-badge">
          {product.category}
        </div>


        <img
          src={
            showRear ? rear : front
          }
          alt={
            showRear
              ? `${product.name} (rear view)`
              : product.name
          }
          className="product-cap-image"
        />


        {hasRear && (

          <span className="product-side-indicator">
            {showRear
              ? "BACK"
              : "FRONT"}
          </span>

        )}


        {outOfStock && (

          <span
            className="quick-view"
          >
            OUT OF STOCK
          </span>

        )}


        {!outOfStock && (

          <span
            className="quick-view"
          >
            VIEW →
          </span>

        )}

      </button>


      <div className="product-info">

        <div className="product-name-row">

          <div>

            <span>
              {product.color}
            </span>

            <h3>
              {product.name}
            </h3>

          </div>


          <strong>
            {money(
              product.price
            )}
          </strong>

        </div>


        <div
          style={{
            marginTop: "5px",
            color:
              outOfStock
                ? "#ff5555"
                : "#71808c",
            fontSize: "10px",
          }}
        >
          {outOfStock
            ? "Out of stock"
            : `${product.stock} available`}
        </div>


        <button
          className="add-button"
          onClick={() =>
            addToCart(product)
          }
          disabled={outOfStock}
          style={
            outOfStock
              ? {
                  opacity: 0.45,
                  cursor:
                    "not-allowed",
                }
              : undefined
          }
        >
          {outOfStock
            ? "OUT OF STOCK"
            : "ADD TO BAG +"}
        </button>

      </div>

    </article>

  );
}


/* =========================================================
   MODAL IMAGE (front / rear toggle)
   ========================================================= */

function ModalImage({ product }) {

  const { front, rear, hasRear } =
    getProductImages(product);

  const [activeSide, setActiveSide] =
    useState("front");

  const mainImage =
    activeSide === "rear"
      ? rear
      : front;


  return (

    <div className="modal-image">

      <img
        src={mainImage}
        alt={
          activeSide === "rear"
            ? `${product.name} (rear view)`
            : `${product.name} (front view)`
        }
        className="product-cap-image"
        onClick={() =>
          hasRear &&
          setActiveSide((side) =>
            side === "front"
              ? "rear"
              : "front"
          )
        }
        style={
          hasRear
            ? { cursor: "pointer" }
            : undefined
        }
      />


      {hasRear && (

        <div className="modal-image-toggle">

          <button
            className={
              activeSide === "front"
                ? "selected"
                : ""
            }
            onClick={() =>
              setActiveSide("front")
            }
          >
            Front
          </button>


          <button
            className={
              activeSide === "rear"
                ? "selected"
                : ""
            }
            onClick={() =>
              setActiveSide("rear")
            }
          >
            Back
          </button>

        </div>

      )}

    </div>

  );
}


/* =========================================================
   WHY PAGE
   ========================================================= */

function WhyPage({ goTo }) {

  const reasons = [

    {
      number: "01",
      title: "QUALITY FIRST",
      text: "We focus on caps that look good, feel good and are built for everyday wear.",
      color: "green",
    },

    {
      number: "02",
      title: "CLEAN STYLE",
      text: "No unnecessary noise. Just premium headwear that lets your style speak.",
      color: "blue",
    },

    {
      number: "03",
      title: "KENYA DELIVERY",
      text: "We make getting your next favourite cap simple with Nairobi and nationwide delivery.",
      color: "purple",
    },

    {
      number: "04",
      title: "REAL PEOPLE",
      text: "CAPSTORE is built around cap lovers who understand that the right cap changes the whole look.",
      color: "yellow",
    },

  ];


  return (

    <main className="why-page">

      <section className="why-hero">

        <span>
          WHY CAPSTORE?
        </span>


        <h1>

          A GOOD CAP

          <br />

          <strong>
            CHANGES THE LOOK.
          </strong>

        </h1>


        <p>
          We are building a cap
          store around one simple
          idea: premium headwear
          should be easy to find,
          easy to wear and easy
          to love.
        </p>

      </section>


      <section className="reasons-grid">

        {reasons.map(
          (reason) => (

            <article
              className="reason-card"
              key={reason.number}
            >

              <span
                className={`reason-number ${reason.color}`}
              >
                {reason.number}
              </span>


              <h2>
                {reason.title}
              </h2>


              <p>
                {reason.text}
              </p>

            </article>

          )
        )}

      </section>


      <section className="why-bottom">

        <h2>
          FIND YOUR
          <span> FIT.</span>
        </h2>


        <p>
          Fitted. Snapback.
          Classic. Whatever your
          style, there is a cap
          waiting for you.
        </p>


        <button
          className="primary-blue-button"
          onClick={() =>
            goTo("shop")
          }
        >
          Shop The Collection →
        </button>

      </section>

    </main>

  );
}