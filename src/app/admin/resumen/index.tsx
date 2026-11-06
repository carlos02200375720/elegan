import React from "react";
import { useEstadoAdmin } from "./estado";
import Encabezado from "./encabezado";
import Indicadores from "./indicadores";
import PanelResumen from "./panel_resumen";
import FotosPredeterminadas from "./fotos_predeterminadas";
import ModalEliminacion from "./modal_eliminacion";
import ModalPedidos from "./modal_pedidos";
import { AdminViewProps } from "./tipos";
import PublishView from "../publicar";
import UsuariosAdminView from "../usuarios";
import ReelsAdminView from "../reels";
import ProductoAdminView from "../producto";
import PedidosAdminView from "../pedidos";
import MetricaAdminView from "../metrica";
import SistemaAdminView from "../sistema";

export default function AdminView(props: AdminViewProps) {
 const datos = useEstadoAdmin(props);
 const { currentUser, users, reels, products, onRefreshAll, onCreatorClick, onProductClick, onReelClick, setUsers, setReels, setProducts, activeAdminTab, handleSelectAdminTab, allOrders, setAllOrders, isRefreshing, setStatusMessage, publishInitialTab, setDeletingTarget, setEditingOrder, setOrderNewStatus, setOrderNewCarrier, setOrderNewTracking, setOrderNewNotes, systemHealth, fetchOrdersAndHealth } = datos;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 select-none" id="admin-dashboard-view">
      

      <Encabezado datos={datos} />
      <Indicadores datos={datos} />
      <PanelResumen datos={datos} />
      {/* Tab 2: Gestión de Usuarios */}
      {activeAdminTab === 'usuarios' && (
        <UsuariosAdminView
          currentUser={currentUser}
          users={users}
          setUsers={setUsers}
          onCreatorClick={onCreatorClick}
          onStatusMessage={setStatusMessage}
          onRequestDeleteUser={(target) => setDeletingTarget(target)}
        />
      )}

      {/* Tab 3: Moderación de Reels y Publicaciones */}
      {activeAdminTab === 'reels' && (
        <ReelsAdminView
          reels={reels}
          setReels={setReels}
          onReelClick={onReelClick}
          onStatusMessage={setStatusMessage}
          onRequestDeleteReel={(target) => setDeletingTarget(target)}
        />
      )}

      {/* Tab 4: Gestión del Catálogo de Tienda */}
      {activeAdminTab === 'productos' && (
        <ProductoAdminView
          products={products}
          setProducts={setProducts}
          onProductClick={onProductClick}
          onStatusMessage={setStatusMessage}
          onRequestDeleteProduct={(target) => setDeletingTarget(target)}
        />
      )}

      {/* Tab Publicar: Publicador de Contenido y Productos */}
      {activeAdminTab === 'publicar' && (
        <div className="w-full" id="admin-tab-content-publicar">
          <PublishView
            currentUser={currentUser}
            initialTab={publishInitialTab}
            onBack={() => handleSelectAdminTab('resumen')}
            onSuccess={() => {
              onRefreshAll();
              handleSelectAdminTab('resumen');
            }}
            userProducts={products}
          />
        </div>
      )}

      {/* Tab 5: Pedidos & Logística Global */}
      {activeAdminTab === 'ordenes' && (
        <PedidosAdminView
          orders={allOrders}
          setOrders={setAllOrders}
          onStatusMessage={setStatusMessage}
          onRequestEditOrder={(order) => {
            setEditingOrder(order);
            setOrderNewStatus(order.status || 'processing');
            setOrderNewCarrier(order.carrier || '');
            setOrderNewTracking(order.trackingNumber || '');
            setOrderNewNotes(order.sellerNotes || '');
          }}
        />
      )}

      {/* Tab Métricas: Analítica y Rendimiento */}
      {activeAdminTab === 'metrica' && (
        <MetricaAdminView
          users={users}
          reels={reels}
          products={products}
          orders={allOrders}
          onCreatorClick={onCreatorClick}
          onProductClick={onProductClick}
          onReelClick={onReelClick}
        />
      )}

      {/* Tab 6: Estado del Sistema & Configuración (Con el banner exclusivo) */}
      {activeAdminTab === 'sistema' && (
        <SistemaAdminView
          systemHealth={systemHealth}
          currentUser={currentUser}
          onRefreshHealth={fetchOrdersAndHealth}
          isRefreshing={isRefreshing}
        />
      )}

      <FotosPredeterminadas datos={datos} />
      <ModalEliminacion datos={datos} />
      <ModalPedidos datos={datos} />
    </div>
  );
}
