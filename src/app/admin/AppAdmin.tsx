import React, { useState, useEffect } from "react";
import { User, Reel, Product, Order } from "./tipos";
import AdminApp from "./AdminApp";
import { apiFetch } from "./config";
import { sessionState } from "../../utils/sessionState";
import { isSuperAdmin } from "../../superAdmin";
import { INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_REELS } from "../../initialData";
import { ShieldAlert, LogIn, ArrowLeft } from "lucide-react";

export default function AppAdmin() {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (typeof window !== "undefined") {
      const savedUser = sessionState.getUser();
      if (savedUser && savedUser.id) return savedUser;
    }
    return {
      id: "admin_preview",
      name: "Carlos David Garcia Batista",
      email: "cg0220037@gmail.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      bio: "Superadministrador",
      followers: 0,
      following: 0,
      isAdmin: true,
    };
  });

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [reels, setReels] = useState<Reel[]>(INITIAL_REELS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const loadData = async () => {
    try {
      const [uRes, pRes, rRes] = await Promise.all([
        apiFetch("/api/users"),
        apiFetch("/api/products"),
        apiFetch("/api/reels"),
      ]);
      if (uRes.ok) {
        const u = await uRes.json();
        if (Array.isArray(u)) setUsers(u);
      }
      if (pRes.ok) {
        const p = await pRes.json();
        if (Array.isArray(p)) setProducts(p);
      }
      if (rRes.ok) {
        const r = await rRes.json();
        if (Array.isArray(r)) setReels(r);
      }
    } catch (e) {
      console.warn("Notice loading admin data:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Superadmin authorization guard
  const isAuthorized = isSuperAdmin(currentUser);

  if (!isAuthorized) {
    return (
      <div className="w-full min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-white">Acceso Administrativo Restringido</h1>
        <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
          Esta aplicación es exclusiva para el superadministrador. Inicia sesión con las credenciales autorizadas en la tienda para ingresar al panel.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/tienda/catalogo";
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Tienda</span>
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/index.html";
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900" id="admin-app-independent-root">
      <AdminApp
        currentUser={currentUser}
        users={users}
        reels={reels}
        products={products}
        onRefreshAll={loadData}
        onCreatorClick={(cId) => {
          window.location.href = `/perfil/${encodeURIComponent(cId)}`;
        }}
        onProductClick={(p) => {
          window.location.href = `/tienda/producto/${encodeURIComponent(p.id)}`;
        }}
        onReelClick={() => {}}
        onNavigateToTab={(tab) => {
          if (tab === "shop") {
            window.location.href = "/tienda/catalogo";
          } else if (tab === "profile") {
            window.location.href = "/perfil";
          } else {
            window.location.href = `/${tab}`;
          }
        }}
        setUsers={setUsers}
        setReels={setReels}
        setProducts={setProducts}
        activePlatform="web"
        onSwitchPlatform={(p) => {
          if (p === "android") window.location.href = "/movil.html";
        }}
      />
    </div>
  );
}
