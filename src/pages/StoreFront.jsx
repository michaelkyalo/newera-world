import { useState, useEffect } from "react";
import {
  collection, addDoc, onSnapshot,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// ✅ Your WhatsApp number
const WHATSAPP_NUMBER = "254796248712";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:         #08090c;
    --surface:    #0d0f14;
    --surface2:   #111318;
    --border:     rgba(0,200,180,0.1);
    --border-hot: rgba(0,200,180,0.35);
    --teal:       #00c8b4;
    --teal-dim:   rgba(0,200,180,0.12);
    --teal-glow:  rgba(0,200,180,0.25);
    --white:      #f0f0f2;
    --white-60:   rgba(240,240,242,0.6);
    --white-30:   rgba(240,240,242,0.3);
    --white-10:   rgba(240,240,242,0.08);
    --white-05:   rgba(240,240,242,0.04);
    --red:        #ff7070;
    --display:    'Bebas Neue', sans-serif;
    --serif:      'Libre Baskerville', Georgia, serif;
    --body:       'Outfit', system-ui, sans-serif;
  }

  html { scroll-behavior: smooth; }
  body { background: var(--bg); }

  .cs-page {
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--body);
    color: var(--white);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  .cs-page::after {
    content: '';
    position: fixed;
    inset: -200%;
    width: 400%;
    height: 400%;
    pointer-events: none;
    z-index: 1000;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 256px;
    animation: grain .8s steps(1) infinite;
  }
  @keyframes grain {
    0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-3%)} 20%{transform:translate(3%,1%)}
    30%{transform:translate(-1%,4%)} 40%{transform:translate(4%,-2%)} 50%{transform:translate(-3%,2%)}
    60%{transform:translate(2%,3%)} 70%{transform:translate(-4%,-1%)} 80%{transform:translate(1%,-4%)} 90%{transform:translate(3%,2%)}
  }

  /* ─── NAV ─── */
  .cs-nav {
    position: sticky; top: 0; z-index: 500;
    height: 64px;
    background: rgba(13,15,20,0.97);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 44px;
  }
  .cs-nav-left { display: flex; align-items: center; gap: 12px; }
  .cs-logo { display: flex; flex-direction: column; gap: 1px; cursor: pointer; }
  .cs-logo-name {
    font-family: var(--display);
    font-size: 22px; letter-spacing: 3px; line-height: 1;
    color: var(--white);
  }
  .cs-logo-name span { color: var(--teal); }
  .cs-logo-tag {
    font-size: 8px; font-weight: 500; letter-spacing: 3.5px;
    text-transform: uppercase; color: var(--white-30);
  }
  .cs-nav-right { display: flex; align-items: center; gap: 18px; }
  .cs-nav-dot {
    font-size: 9px; font-weight: 600; letter-spacing: 2.5px;
    text-transform: uppercase; color: var(--white-30);
    display: flex; align-items: center; gap: 7px;
  }
  .cs-nav-dot::before {
    content: '';
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--teal);
    box-shadow: 0 0 8px var(--teal);
    animation: blink 2s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{opacity:1;box-shadow:0 0 8px var(--teal)} 50%{opacity:.4;box-shadow:none} }

  .cs-cart-btn {
    position: relative;
    background: var(--teal-dim);
    border: 1px solid var(--border-hot);
    color: var(--teal);
    border-radius: 8px;
    padding: 9px 22px 9px 16px;
    font-size: 10px; font-weight: 600; font-family: var(--body);
    letter-spacing: 2.5px; text-transform: uppercase;
    cursor: pointer; display: flex; align-items: center; gap: 9px;
    transition: all .22s; overflow: hidden;
  }
  .cs-cart-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: var(--teal);
    transform: scaleX(0); transform-origin: left;
    transition: transform .28s cubic-bezier(.25,.8,.25,1);
  }
  .cs-cart-btn:hover { color: #08090c; }
  .cs-cart-btn:hover::before { transform: scaleX(1); }
  .cs-cart-btn > * { position: relative; z-index: 1; }
  .cs-cart-count {
    position: absolute; top: -7px; right: -7px; z-index: 2;
    background: var(--teal); color: #08090c;
    font-size: 8px; font-weight: 800;
    width: 17px; height: 17px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }

  /* ─── DELIVERY BAR ─── */
  .cs-delivery-bar {
    background: var(--teal-dim);
    border-bottom: 1px solid var(--border-hot);
    padding: 11px 44px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    font-size: 10px; font-weight: 600; letter-spacing: 2.5px;
    text-transform: uppercase; color: var(--teal);
    position: relative; overflow: hidden;
  }
  .cs-delivery-bar::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(0,200,180,0.08), transparent);
    animation: shimmer 3.5s ease-in-out infinite;
  }
  @keyframes shimmer { 0%,100%{transform:translateX(-100%)} 60%{transform:translateX(100%)} }
  .cs-delivery-pill {
    background: var(--teal); color: #08090c;
    font-size: 8px; font-weight: 800; letter-spacing: 1.5px;
    padding: 3px 10px; border-radius: 20px;
    white-space: nowrap;
  }

  /* ─── HERO ─── */
  .cs-hero {
    padding: 28px 44px 24px;
    border-bottom: 1px solid var(--border);
    position: relative; overflow: hidden;
  }
  .cs-hero::before {
    content: '';
    position: absolute; top: -40px; right: 0;
    width: 260px; height: 260px;
    background: radial-gradient(circle, rgba(0,200,180,0.05) 0%, transparent 70%);
    pointer-events: none;
  }
  .cs-hero-left { position: relative; z-index: 1; }
  .cs-hero-overline {
    font-size: 9px; font-weight: 600; letter-spacing: 5px;
    text-transform: uppercase; color: var(--teal);
    margin-bottom: 8px;
    display: flex; align-items: center; gap: 10px;
  }
  .cs-hero-overline::after {
    content: ''; flex: 0 0 28px; height: 1px;
    background: var(--teal); opacity: 0.5;
  }
  .cs-hero-h1 {
    font-family: var(--display);
    font-size: clamp(36px, 5vw, 64px);
    letter-spacing: 4px; line-height: 0.9;
    color: var(--white);
  }
  .cs-hero-h1 .accent { color: var(--teal); }
  .cs-hero-sub {
    font-family: var(--serif);
    font-size: 13px;
    font-style: italic; color: var(--white-30);
    margin-top: 10px; font-weight: 400;
  }
  .cs-hero-stats {
    display: flex; gap: 24px; margin-top: 16px; flex-wrap: wrap; align-items: flex-end;
  }
  .cs-stat-num {
    font-family: var(--display);
    font-size: 28px; letter-spacing: 2px;
    color: var(--teal); line-height: 1;
  }
  .cs-stat-label {
    font-size: 7px; font-weight: 600; letter-spacing: 3px;
    text-transform: uppercase; color: var(--white-30); margin-top: 2px;
  }

  /* ─── FILTER ─── */
  .cs-filter-wrap {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 44px;
    border-bottom: 1px solid var(--border);
  }
  .cs-filter-bar { display: flex; }
  .cs-filter-btn {
    background: transparent; border: none;
    border-bottom: 2px solid transparent;
    color: var(--white-30);
    padding: 18px 26px 16px;
    font-size: 9px; font-weight: 600; font-family: var(--body);
    letter-spacing: 3px; text-transform: uppercase;
    cursor: pointer; transition: color .18s, border-color .18s;
    margin-bottom: -1px;
  }
  .cs-filter-btn:hover { color: var(--white-60); }
  .cs-filter-btn.active { color: var(--teal); border-bottom-color: var(--teal); }
  .cs-count-label {
    font-size: 9px; font-weight: 600; letter-spacing: 3px;
    text-transform: uppercase; color: var(--white-30);
  }

  /* ─── GRID ─── */
  .cs-grid-wrap { padding: 28px 44px; }
  .cs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 18px;
  }

  /* ─── CARD ─── */
  @property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
  @keyframes rotateBorder { to { --angle: 360deg; } }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }

  .cs-card {
    background: var(--surface);
    border-radius: 12px;
    border: 1px solid var(--border);
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
    cursor: pointer;
    animation: fadeIn .4s ease both;
    transition: border-color .25s, background .25s, transform .22s, box-shadow .22s;
  }
  .cs-card:nth-child(1){animation-delay:.04s} .cs-card:nth-child(2){animation-delay:.08s}
  .cs-card:nth-child(3){animation-delay:.12s} .cs-card:nth-child(4){animation-delay:.16s}
  .cs-card:nth-child(5){animation-delay:.20s} .cs-card:nth-child(6){animation-delay:.24s}
  .cs-card:nth-child(7){animation-delay:.28s} .cs-card:nth-child(8){animation-delay:.32s}

  .cs-card:hover {
    background: var(--surface2);
    border-color: var(--border-hot);
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,200,180,0.12);
  }

  .cs-slider {
    position: relative; width: 100%; aspect-ratio: 1/1;
    background: #09090c; overflow: hidden;
    border-radius: 12px 12px 0 0;
  }
  .cs-slider-img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform .65s cubic-bezier(.25,.1,.25,1);
  }
  .cs-card:hover .cs-slider-img { transform: scale(1.06); }
  .cs-slider-ph {
    width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; color: var(--white-30);
    font-size: 9px; letter-spacing: 3px; text-transform: uppercase;
  }

  .cs-view-tag {
    position: absolute; top: 10px; left: 10px; z-index: 5;
    font-size: 7px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;
    color: var(--teal);
    background: rgba(13,15,20,0.88);
    border: 1px solid rgba(0,200,180,0.3); border-radius: 6px;
    padding: 3px 8px; backdrop-filter: blur(6px);
  }

  .cs-card-body { padding: 14px 14px 16px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .cs-card-name {
    font-family: var(--display);
    font-size: 18px; letter-spacing: 1.5px; color: var(--white); line-height: 1;
  }
  .cs-type-badge {
    font-size: 7px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    padding: 2px 8px; border-radius: 6px;
    border: 1px solid rgba(0,200,180,0.25);
    color: var(--teal); background: var(--teal-dim);
    white-space: nowrap; align-self: flex-start;
  }
  .cs-price-row {
    display: flex; align-items: baseline; justify-content: space-between;
    border-top: 1px solid var(--border); padding-top: 10px;
  }
  .cs-price {
    font-family: var(--display);
    font-size: 24px; letter-spacing: 1px; color: var(--teal); line-height: 1;
  }
  .cs-price-currency {
    font-family: var(--body); font-size: 9px; font-weight: 500;
    color: var(--white-30); margin-right: 3px; letter-spacing: 1px;
  }
  .cs-stock {
    font-size: 7px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    color: rgba(0,200,180,0.6);
    border: 1px solid rgba(0,200,180,0.2); border-radius: 6px;
    padding: 2px 7px; background: var(--teal-dim);
  }
  .cs-stock.low { color: var(--red); border-color: rgba(255,112,112,0.3); background: rgba(255,112,112,0.08); }

  .cs-add-btn {
    width: 100%; background: transparent;
    border: 1px solid rgba(0,200,180,0.3); border-radius: 8px;
    color: var(--teal);
    font-size: 9px; font-weight: 700; font-family: var(--body);
    letter-spacing: 2px; text-transform: uppercase;
    padding: 11px; cursor: pointer; transition: all .25s;
    position: relative; overflow: hidden;
  }
  .cs-add-btn::before {
    content: ''; position: absolute; inset: 0;
    background: var(--teal);
    transform: translateY(100%);
    transition: transform .28s cubic-bezier(.25,.8,.25,1);
  }
  .cs-add-btn span { position: relative; z-index: 1; transition: color .25s; }
  .cs-add-btn:hover { border-color: var(--teal); }
  .cs-add-btn:hover::before { transform: translateY(0); }
  .cs-add-btn:hover span { color: #08090c; }
  .cs-add-btn.incart { background: var(--teal); border-color: var(--teal); }
  .cs-add-btn.incart span { color: #08090c; }
  .cs-add-btn.incart::before { transform: translateY(0); }

  /* ─── LOADING / EMPTY ─── */
  .cs-loading {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 120px 40px; gap: 16px;
  }
  .cs-loading-ring {
    width: 36px; height: 36px; border-radius: 50%;
    border: 2px solid rgba(0,200,180,0.15);
    border-top-color: var(--teal);
    animation: spin .8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .cs-loading-text {
    font-size: 9px; font-weight: 600; letter-spacing: 3px;
    text-transform: uppercase; color: var(--white-30);
  }
  .cs-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 150px 40px; gap: 14px; text-align: center;
  }
  .cs-empty-title { font-family: var(--display); font-size: 48px; letter-spacing: 4px; color: var(--white-10); }
  .cs-empty-sub { font-family: var(--serif); font-size: 14px; font-style: italic; color: var(--white-30); max-width: 260px; line-height: 1.8; }

  /* ─── DETAIL MODAL ─── */
  .cs-detail-overlay {
    position: fixed; inset: 0; z-index: 700;
    background: rgba(0,0,0,0.82);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: cs-fade .2s ease;
  }
  @keyframes cs-fade { from{opacity:0} to{opacity:1} }

  .cs-detail {
    background: var(--surface);
    border: 1px solid var(--border-hot);
    border-radius: 16px;
    width: 100%; max-width: 860px;
    max-height: 90vh; overflow-y: auto;
    display: flex; gap: 0;
    animation: cs-pop .3s cubic-bezier(.34,1.56,.64,1);
    position: relative;
  }
  @keyframes cs-pop { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
  .cs-detail::-webkit-scrollbar { width: 2px; }
  .cs-detail::-webkit-scrollbar-thumb { background: var(--border-hot); }

  .cs-detail-close {
    position: absolute; top: 16px; right: 16px; z-index: 10;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--white-60); border-radius: 8px;
    width: 36px; height: 36px; font-size: 22px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all .18s; line-height: 1;
  }
  .cs-detail-close:hover { border-color: var(--border-hot); color: var(--teal); }

  .cs-detail-images {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column;
  }
  .cs-detail-main-img {
    width: 100%; aspect-ratio: 1/1;
    background: #09090c; border-radius: 16px 0 0 0;
    overflow: hidden; position: relative;
  }
  .cs-detail-main-img img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform .5s ease;
  }
  .cs-detail-main-img:hover img { transform: scale(1.04); }
  .cs-detail-thumbs {
    display: flex; gap: 8px; padding: 12px 16px;
    background: var(--surface2); border-top: 1px solid var(--border);
    border-radius: 0 0 0 16px;
  }
  .cs-detail-thumb {
    width: 56px; height: 56px; border-radius: 8px; overflow: hidden;
    border: 2px solid transparent; cursor: pointer;
    transition: border-color .18s; flex-shrink: 0;
  }
  .cs-detail-thumb.active { border-color: var(--teal); }
  .cs-detail-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  .cs-detail-info {
    flex: 0 0 320px;
    padding: 40px 32px 32px;
    display: flex; flex-direction: column; gap: 20px;
    border-left: 1px solid var(--border);
  }
  .cs-detail-overline {
    font-size: 8px; font-weight: 700; letter-spacing: 4px;
    text-transform: uppercase; color: var(--teal);
  }
  .cs-detail-name {
    font-family: var(--display);
    font-size: 38px; letter-spacing: 3px; line-height: 0.95;
    color: var(--white);
  }
  .cs-detail-price {
    font-family: var(--display);
    font-size: 44px; letter-spacing: 2px; color: var(--teal); line-height: 1;
  }
  .cs-detail-price span {
    font-family: var(--body); font-size: 12px;
    font-weight: 500; color: var(--white-30); margin-right: 6px;
  }
  .cs-detail-meta {
    display: flex; gap: 10px; flex-wrap: wrap;
    border-top: 1px solid var(--border); padding-top: 18px;
  }
  .cs-detail-pill {
    font-size: 8px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    padding: 5px 12px; border-radius: 20px;
    background: var(--teal-dim); border: 1px solid var(--border-hot); color: var(--teal);
  }
  .cs-detail-pill.stock-low {
    background: rgba(255,112,112,0.08); border-color: rgba(255,112,112,0.3); color: var(--red);
  }
  .cs-detail-add {
    width: 100%;
    background: var(--teal); border: none; color: #08090c;
    border-radius: 10px; padding: 16px;
    font-size: 11px; font-weight: 800; font-family: var(--body);
    letter-spacing: 3px; text-transform: uppercase;
    cursor: pointer; transition: opacity .18s, transform .15s;
    margin-top: auto;
  }
  .cs-detail-add:hover { opacity: 0.88; transform: translateY(-2px); }
  .cs-detail-add.incart { background: var(--surface2); color: var(--teal); border: 1px solid var(--border-hot); }

  /* ─── CART DRAWER ─── */
  .cs-overlay {
    position: fixed; inset: 0; z-index: 600;
    background: rgba(0,0,0,0.72); backdrop-filter: blur(8px);
    display: flex; justify-content: flex-end;
    animation: cs-fade .2s ease;
  }
  .cs-drawer {
    width: 400px; height: 100vh;
    background: var(--surface); border-left: 1px solid rgba(0,200,180,0.2);
    display: flex; flex-direction: column;
    animation: cs-slide .28s cubic-bezier(.25,.8,.25,1);
  }
  @keyframes cs-slide { from{transform:translateX(100%)} to{transform:translateX(0)} }
  .cs-drawer-head {
    padding: 28px 30px; border-bottom: 1px solid var(--border);
    display: flex; align-items: flex-start; justify-content: space-between;
  }
  .cs-drawer-title { font-family: var(--display); font-size: 34px; letter-spacing: 3px; color: var(--white); line-height: 1; }
  .cs-drawer-sub { font-size: 9px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--white-30); margin-top: 5px; }
  .cs-close-btn {
    background: var(--white-05); border: 1px solid rgba(255,255,255,0.08);
    color: var(--white-60); border-radius: 8px;
    width: 34px; height: 34px; cursor: pointer;
    font-size: 20px; display: flex; align-items: center; justify-content: center;
    transition: all .18s; margin-top: 2px; line-height: 1;
  }
  .cs-close-btn:hover { border-color: var(--border-hot); color: var(--teal); }
  .cs-drawer-items { flex: 1; overflow-y: auto; padding: 0 30px; }
  .cs-drawer-items::-webkit-scrollbar { width: 2px; }
  .cs-drawer-items::-webkit-scrollbar-thumb { background: var(--border-hot); }
  .cs-cart-item {
    display: flex; align-items: center; gap: 14px;
    padding: 18px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .cs-ci-thumb {
    width: 56px; height: 56px; border-radius: 8px;
    background: var(--surface2); flex-shrink: 0; overflow: hidden;
    border: 1px solid var(--border);
  }
  .cs-ci-name { font-family: var(--display); font-size: 16px; letter-spacing: 1.5px; color: var(--white); line-height: 1.1; margin-bottom: 4px; }
  .cs-ci-price { font-size: 11px; color: var(--teal); font-weight: 500; letter-spacing: 1px; }
  .cs-rm-btn {
    background: none; border: 1px solid transparent;
    cursor: pointer; color: var(--white-30);
    font-size: 16px; padding: 5px; transition: all .15s;
    border-radius: 6px; margin-left: auto; flex-shrink: 0; line-height: 1;
  }
  .cs-rm-btn:hover { color: var(--red); border-color: rgba(255,112,112,0.3); }
  .cs-drawer-foot {
    padding: 24px 30px 30px; border-top: 1px solid var(--border);
    background: var(--surface2);
  }
  .cs-total-row {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 22px; padding-bottom: 18px; border-bottom: 1px solid var(--border);
  }
  .cs-total-label { font-size: 9px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: var(--white-30); }
  .cs-total-val { font-family: var(--display); font-size: 38px; letter-spacing: 2px; color: var(--teal); line-height: 1; }
  .cs-wa-btn {
    width: 100%;
    background: linear-gradient(135deg, #25d366, #128c7e);
    border: none; color: #fff; border-radius: 8px; padding: 15px;
    font-size: 10px; font-weight: 700; font-family: var(--body);
    cursor: pointer; letter-spacing: 2.5px; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: opacity .18s, transform .15s;
  }
  .cs-wa-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .cs-wa-btn:active { transform: translateY(0); }
  .cs-wa-btn:disabled { opacity: 0.25; cursor: not-allowed; transform: none; }
  .cs-wa-note { font-size: 10px; color: var(--white-30); text-align: center; margin-top: 10px; line-height: 1.6; }
  .cs-empty-cart {
    font-family: var(--serif); font-style: italic;
    text-align: center; color: var(--white-30); padding: 68px 0; font-size: 14px;
  }
  .cs-delivery-note {
    background: var(--teal-dim); border: 1px solid var(--border-hot);
    border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;
    display: flex; align-items: center; gap: 10px;
    font-size: 10px; font-weight: 600; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--teal);
  }

  /* ─── FOOTER ─── */
  .cs-footer {
    border-top: 1px solid var(--border); padding: 28px 44px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .cs-footer-brand { font-family: var(--display); font-size: 16px; letter-spacing: 3px; color: var(--white-30); }
  .cs-footer-brand span { color: var(--teal); }
  .cs-footer-copy { font-size: 9px; color: var(--white-30); letter-spacing: 1.5px; }

  /* ─── MOBILE ─── */
  @media (max-width: 768px) {
    .cs-nav { padding: 0 16px; height: 56px; }
    .cs-logo-name { font-size: 17px; letter-spacing: 2px; }
    .cs-logo-tag { display: none; }
    .cs-nav-dot { display: none; }
    .cs-cart-btn { padding: 8px 14px 8px 12px; font-size: 9px; letter-spacing: 2px; }

    .cs-delivery-bar { padding: 9px 16px; font-size: 9px; gap: 7px; flex-wrap: wrap; justify-content: center; }

    .cs-hero { padding: 20px 16px 18px; }
    .cs-hero-h1 { font-size: clamp(32px, 10vw, 48px); }
    .cs-hero-sub { font-size: 11px; }
    .cs-hero-stats { gap: 16px; margin-top: 12px; }
    .cs-stat-num { font-size: 22px; }

    .cs-filter-wrap { padding: 0 16px; }
    .cs-filter-btn { padding: 14px 14px 12px; font-size: 9px; letter-spacing: 2px; }

    .cs-grid-wrap { padding: 16px; }
    .cs-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .cs-card-name { font-size: 15px; }
    .cs-price { font-size: 20px; }
    .cs-card-body { padding: 10px 10px 12px; gap: 8px; }
    .cs-add-btn { padding: 9px; font-size: 8px; letter-spacing: 1.5px; }

    .cs-detail {
      flex-direction: column;
      max-width: 100%;
      max-height: 92vh;
      border-radius: 16px;
    }
    .cs-detail-images { min-width: unset; }
    .cs-detail-main-img { border-radius: 16px 16px 0 0; aspect-ratio: 4/3; }
    .cs-detail-thumbs { border-radius: 0; }
    .cs-detail-info {
      flex: none; border-left: none;
      border-top: 1px solid var(--border);
      padding: 22px 20px 24px;
      gap: 14px;
    }
    .cs-detail-name { font-size: 28px; }
    .cs-detail-price { font-size: 34px; }

    .cs-drawer { width: 100vw; }
    .cs-drawer-head { padding: 20px; }
    .cs-drawer-items { padding: 0 20px; }
    .cs-drawer-foot { padding: 18px 20px 24px; }

    .cs-footer { padding: 20px 16px; flex-direction: column; gap: 8px; text-align: center; }
  }

  @media (max-width: 380px) {
    .cs-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .cs-grid-wrap { padding: 10px; }
    .cs-card-name { font-size: 13px; }
    .cs-price { font-size: 17px; }
    .cs-add-btn { font-size: 7px; letter-spacing: 1px; padding: 8px; }
  }
`;

function useGlobalStyle(css) {
  if (typeof document !== "undefined") {
    const id = "capstore-v5";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = css;
      document.head.appendChild(el);
    }
  }
  useEffect(() => {
    return () => {
      ["capstore-v4", "capstore-v3", "capstore-v2", "capstore-styles"].forEach(old => {
        const o = document.getElementById(old);
        if (o) o.remove();
      });
    };
  }, []);
}

/* ──────────────────────────────────────────────
   CAP DETAIL MODAL
────────────────────────────────────────────── */
function CapDetail({ cap, inCart, onAdd, onClose }) {
  const photos = [cap.imgFront, cap.imgRear].filter(Boolean);
  if (!photos.length && cap.img) photos.push(cap.img);
  const [idx, setIdx] = useState(0);
  const stockLow = (cap.stock || 0) <= 2;

  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="cs-detail-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cs-detail">
        <button className="cs-detail-close" onClick={onClose}>×</button>

        <div className="cs-detail-images">
          <div className="cs-detail-main-img">
            {photos.length > 0
              ? <img src={photos[idx]} alt={cap.name} />
              : <div className="cs-slider-ph" style={{ height: "100%" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>No photo</span>
                </div>
            }
          </div>
          {photos.length > 1 && (
            <div className="cs-detail-thumbs">
              {photos.map((p, i) => (
                <div
                  key={i}
                  className={`cs-detail-thumb${i === idx ? " active" : ""}`}
                  onClick={() => setIdx(i)}
                >
                  <img src={p} alt={`${cap.name} view ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cs-detail-info">
          <div className="cs-detail-overline">Capstore.KE — Authentic Headwear</div>
          <div className="cs-detail-name">{cap.name}</div>
          <div className="cs-detail-price">
            <span>KSh</span>{cap.price?.toLocaleString()}
          </div>
          <div className="cs-detail-meta">
            <div className="cs-detail-pill">{cap.type}</div>
            <div className={`cs-detail-pill${stockLow ? " stock-low" : ""}`}>
              {stockLow ? `Only ${cap.stock} left` : `${cap.stock} in stock`}
            </div>
          </div>
          <button
            className={`cs-detail-add${inCart ? " incart" : ""}`}
            onClick={() => { onAdd(cap); }}
          >
            {inCart ? "✓  In Bag — View Bag" : "Add to Bag"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   GRID CARD
────────────────────────────────────────────── */
function CapCard({ cap, inCart, onOpen }) {
  const thumb = cap.imgFront || cap.img || null;
  const stockLow = (cap.stock || 0) <= 2;

  return (
    <div className="cs-card" onClick={() => onOpen(cap)}>
      <div className="cs-slider">
        {thumb
          ? <img src={thumb} alt={cap.name} className="cs-slider-img" />
          : <div className="cs-slider-ph">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>No photo</span>
            </div>
        }
        {inCart && (
          <span className="cs-view-tag" style={{ background: "var(--teal)", color: "#08090c", borderColor: "var(--teal)" }}>
            ✓ In Bag
          </span>
        )}
      </div>
      <div className="cs-card-body">
        <div>
          <div className="cs-card-name">{cap.name}</div>
          <div className="cs-type-badge" style={{ marginTop: "5px" }}>{cap.type}</div>
        </div>
        <div className="cs-price-row">
          <div className="cs-price"><span className="cs-price-currency">KSh</span>{cap.price?.toLocaleString()}</div>
          <div className={`cs-stock${stockLow ? " low" : ""}`}>{stockLow ? `${cap.stock} left` : "In stock"}</div>
        </div>
        <button
          className={`cs-add-btn${inCart ? " incart" : ""}`}
          onClick={e => { e.stopPropagation(); onOpen(cap); }}
        >
          <span>{inCart ? "✓ In Bag" : "View & Buy"}</span>
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   MAIN STOREFRONT
────────────────────────────────────────────── */
export default function StoreFront() {
  useGlobalStyle(GLOBAL_CSS);
  const [caps,       setCaps]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [cart,       setCart]       = useState([]);
  const [filter,     setFilter]     = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailCap,  setDetailCap]  = useState(null);
  const [ordering,   setOrdering]   = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "caps"),
      snap => {
        setCaps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      err => { console.error("caps:", err); setLoading(false); }
    );
    return () => unsub();
  }, []);

  const visible        = filter === "all" ? caps : caps.filter(c => c.type === filter);
  const inCart         = id => cart.some(c => c.id === id);
  const addToCart      = cap => {
    if (!inCart(cap.id)) setCart(p => [...p, cap]);
    setDetailCap(null);
    setDrawerOpen(true);
  };
  const removeFromCart = id => setCart(p => p.filter(c => c.id !== id));
  const total          = cart.reduce((s, c) => s + (c.price || 0), 0);

  const orderOnWhatsApp = async () => {
    if (!cart.length) return;
    setOrdering(true);
    try {
      await addDoc(collection(db, "orders"), {
        id:        `ORD-${String(Date.now()).slice(-6)}`,
        items:     cart.map(c => `${c.name} — KSh ${c.price?.toLocaleString()}`),
        total,
        status:    "Pending",
        date:      new Date().toLocaleDateString("en-KE", { day: "numeric", month: "short" }),
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("order save failed:", e);
    } finally {
      setOrdering(false);
    }

    const items = cart.map((c, i) => `${i + 1}. ${c.name} — KSh ${c.price?.toLocaleString()}`).join("%0A");
    const msg =
      `*CAPSTORE.KE — NEW ORDER* 🧢%0A━━━━━━━━━━━━━━━━━━%0A${items}%0A━━━━━━━━━━━━━━━━━━%0A` +
      `*Total: KSh ${total.toLocaleString()}*%0A%0A` +
      `Hi! I'd like to order the above. Please confirm availability, payment & delivery. Thank you!`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <div className="cs-page">

      {/* NAV */}
      <nav className="cs-nav">
        <div className="cs-nav-left">
          <div className="cs-logo" onClick={() => setDetailCap(null)}>
            <div className="cs-logo-name"><span>_.</span>CAPSTORE<span style={{ color: "var(--white-30)", fontSize: "14px" }}>.KE</span></div>
            <div className="cs-logo-tag">Premium Headwear · Kenya</div>
          </div>
        </div>
        <div className="cs-nav-right">
          <div className="cs-nav-dot">Nairobi, KE</div>
          <button className="cs-cart-btn" onClick={() => setDrawerOpen(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span>Bag</span>
            {cart.length > 0 && <span className="cs-cart-count">{cart.length}</span>}
          </button>
        </div>
      </nav>

      {/* DELIVERY BANNER */}
      <div className="cs-delivery-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: "relative", zIndex: 1 }}>
          <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 5v3h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        <span style={{ position: "relative", zIndex: 1 }}>Free delivery within</span>
        <span className="cs-delivery-pill" style={{ position: "relative", zIndex: 1 }}>Nairobi CBD</span>
        <span style={{ position: "relative", zIndex: 1, color: "var(--white-30)" }}>·</span>
        <span style={{ position: "relative", zIndex: 1 }}>Same-day pickup available</span>
      </div>

      {/* HERO */}
      <div className="cs-hero">
        <div className="cs-hero-left">
          <div className="cs-hero-overline">Est. 2024 · Nairobi, Kenya</div>
          <div className="cs-hero-h1">PREMIUM<br /><span className="accent">CAPS</span></div>
          <div className="cs-hero-sub">Curated for the city. Built for the culture.</div>
          <div className="cs-hero-stats">
            <div className="cs-stat-item">
              <div className="cs-stat-num">{loading ? "—" : caps.length || "—"}</div>
              <div className="cs-stat-label">Pieces</div>
            </div>
            <div className="cs-stat-item">
              <div className="cs-stat-num">2</div>
              <div className="cs-stat-label">Styles</div>
            </div>
            <div className="cs-stat-item">
              <div className="cs-stat-num" style={{ fontSize: "18px", paddingTop: "6px" }}>59FIFTY</div>
              <div className="cs-stat-label">Authentic</div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER */}
      <div className="cs-filter-wrap">
        <div className="cs-filter-bar">
          {[["all", "All Pieces"], ["fitted", "Fitted"], ["snapback", "Snapback"]].map(([val, label]) => (
            <button key={val} className={`cs-filter-btn${filter === val ? " active" : ""}`} onClick={() => setFilter(val)}>
              {label}
            </button>
          ))}
        </div>
        <div className="cs-count-label">{visible.length} {visible.length === 1 ? "piece" : "pieces"}</div>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="cs-loading">
          <div className="cs-loading-ring" />
          <div className="cs-loading-text">Loading inventory</div>
        </div>
      ) : caps.length === 0 ? (
        <div className="cs-empty">
          <div className="cs-empty-title">DROPPING SOON</div>
          <div className="cs-empty-sub">We're curating something special. Check back shortly.</div>
        </div>
      ) : visible.length === 0 ? (
        <div className="cs-empty">
          <div className="cs-empty-title">NONE YET</div>
          <div className="cs-empty-sub">Try a different filter above.</div>
        </div>
      ) : (
        <div className="cs-grid-wrap">
          <div className="cs-grid">
            {visible.map(cap => (
              <CapCard
                key={cap.id}
                cap={cap}
                inCart={inCart(cap.id)}
                onOpen={setDetailCap}
              />
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="cs-footer">
        <div className="cs-footer-brand"><span>_.</span>CAPSTORE<span>.KE</span></div>
        <div className="cs-footer-copy">© 2024 — All rights reserved</div>
      </div>

      {/* ── DETAIL MODAL ── */}
      {detailCap && (
        <CapDetail
          cap={detailCap}
          inCart={inCart(detailCap.id)}
          onAdd={addToCart}
          onClose={() => setDetailCap(null)}
        />
      )}

      {/* ── CART DRAWER ── */}
      {drawerOpen && (
        <div className="cs-overlay" onClick={e => e.target === e.currentTarget && setDrawerOpen(false)}>
          <div className="cs-drawer">
            <div className="cs-drawer-head">
              <div>
                <div className="cs-drawer-title">YOUR BAG</div>
                <div className="cs-drawer-sub">{cart.length} {cart.length === 1 ? "item" : "items"}</div>
              </div>
              <button className="cs-close-btn" onClick={() => setDrawerOpen(false)}>×</button>
            </div>

            <div className="cs-drawer-items">
              {cart.length === 0 ? (
                <div className="cs-empty-cart">Your bag is empty</div>
              ) : cart.map(c => (
                <div key={c.id} className="cs-cart-item">
                  <div className="cs-ci-thumb">
                    {(c.imgFront || c.img)
                      ? <img src={c.imgFront || c.img} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: "18px", opacity: .2, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>🧢</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="cs-ci-name">{c.name}</div>
                    <div className="cs-ci-price">KSh {c.price?.toLocaleString()}</div>
                  </div>
                  <button className="cs-rm-btn" onClick={() => removeFromCart(c.id)}>×</button>
                </div>
              ))}
            </div>

            <div className="cs-drawer-foot">
              <div className="cs-total-row">
                <span className="cs-total-label">Total</span>
                <span className="cs-total-val">KSh {total.toLocaleString()}</span>
              </div>
              <div className="cs-delivery-note">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 5v3h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                Free delivery · <span style={{ color: "var(--white)", fontWeight: 700 }}>Nairobi CBD</span>
              </div>
              <button
                className="cs-wa-btn"
                onClick={orderOnWhatsApp}
                disabled={cart.length === 0 || ordering}
              >
                {ordering ? <span>Saving order…</span> : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Order via WhatsApp
                  </>
                )}
              </button>
              <div className="cs-wa-note">Tap to send your order directly to the seller on WhatsApp.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}