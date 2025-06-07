// src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllOrders, updateOrder } from '../services/orderService';
import classes from './AdminDashboardPage.module.css';
import AdminOrderListView from '../components/Admin/AdminOrderListView';
import AdminMangoManager from '../components/Admin/AdminMangoManager'; 
import { exportOrdersToCSV, exportUsersToCSV } from '../services/exportService'; 
import AdminQuickOrderForm from '../components/Admin/AdminQuickOrderForm'; 
import AdminPromoCodeManager from '../components/Admin/AdminPromoCodeManager'; 
// import AdminSettingsManager from '../components/Admin/AdminSettingsManager'; // Import

const AdminDashboardPage = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [activeView, setActiveView] = useState('allOrders');
  const [orders, setOrders] = useState([]);
  const [allFetchedOrders, setAllFetchedOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filterCriteria, setFilterCriteria] = useState({ status: '', payment: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = async () => {
    try { await logout(); navigate('/admin/login'); }
    catch (error) { console.error('Failed to log out', error); alert('Failed to log out'); }
  };
  const handleExportOrders = async () => {
    setIsExporting(true);
    await exportOrdersToCSV(allFetchedOrders); // Pass currently fetched/filtered orders
    setIsExporting(false);
  };

  const handleExportUsers = async () => {
    setIsExporting(true);
    await exportUsersToCSV();
    setIsExporting(false);
  };

  const nonOrderViews = ['inventory', 'adminQuickOrder', 'promoCodes'];

  const fetchAllOrders = useCallback(async () => {
    if (nonOrderViews.includes(activeView)) {
        setLoadingOrders(false);
        return;
    }
    setLoadingOrders(true);
    try {
      const fetchedOrders = await getAllOrders();
      setAllFetchedOrders(fetchedOrders); // Store all, filtering will happen in useEffect
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setAllFetchedOrders([]); // Clear on error
    } finally {
      setLoadingOrders(false);
    }
  }, [activeView]); // Add activeView as dependency

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]); // fetchAllOrders itself depends on activeView

  useEffect(() => {
    if (nonOrderViews.includes(activeView)) {
        setOrders([]); 
        return; 
    }

    let filtered = [...allFetchedOrders];
    if (filterCriteria.status) {
      filtered = filtered.filter(o => o.orderStatus === filterCriteria.status);
    }
    if (filterCriteria.payment === 'paid') {
      filtered = filtered.filter(o => o.paymentStatus?.isPaid === true);
    } else if (filterCriteria.payment === 'unpaid') {
      // Show unpaid unless they are 'Cancelled' or 'Collected' (assuming Collected implies paid or payment being handled)
      // Or more simply, just check isPaid === false and not cancelled.
      filtered = filtered.filter(o => o.paymentStatus?.isPaid === false && o.orderStatus !== "Cancelled");
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.appOrderId?.toLowerCase().includes(lowerSearchTerm) ||
        o.customer?.name?.toLowerCase().includes(lowerSearchTerm) || // Updated from customerDetails to customer
        o.customer?.phone?.includes(lowerSearchTerm) ||
        o.customer?.address?.toLowerCase().includes(lowerSearchTerm) ||
        o.customer?.area?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    setOrders(filtered);
  }, [filterCriteria, searchTerm, allFetchedOrders, activeView]);


  const handleUpdateOrder = async (orderId, dataToUpdate) => {
    const result = await updateOrder(orderId, dataToUpdate);
    if (result.success) {
      // Optimistically update local state or refetch
      // For simplicity, refetching:
      await fetchAllOrders(); 
      alert('Order updated successfully!');
    } else {
      alert('Failed to update order: ' + (result.error || 'Unknown error'));
    }
    return result.success;
  };

  const handleOrderDeleted = (deletedOrderId) => {
    console.log(`Order ${deletedOrderId} was deleted, refetching orders.`);
    fetchAllOrders(); // Refetch orders to update the UI
    // Or, more optimistically:
    // setAllFetchedOrders(prevOrders => prevOrders.filter(o => o.id !== deletedOrderId));
  };

  const handleSidebarClick = (viewName, statusFilter = '', paymentFilter = '') => {
    setActiveView(viewName); // This will trigger useEffect for fetching/filtering orders
    if (!nonOrderViews.includes(viewName)) {
        setFilterCriteria({ status: statusFilter, payment: paymentFilter });
    } else {
        setFilterCriteria({ status: '', payment: '' }); // Reset filters for non-order views
    }
    setSearchTerm(''); // Reset search on view change
  };
  
  const onAdminQuickOrderSuccess = () => {
    fetchAllOrders(); // Refresh order list after admin places an order
    // Optionally switch view back to allOrders or the newly created order
    // setActiveView('allOrders');
  };


  const renderMainContent = () => {
    if (loadingOrders && !nonOrderViews.includes(activeView)) {
        return <p style={{ textAlign: 'center', padding: '20px', fontSize: '1.2em' }}>Loading orders...</p>;
    }

    switch (activeView) {
        case 'inventory':
            return <AdminMangoManager />;
        case 'adminQuickOrder':
            return <AdminQuickOrderForm onAdminOrderSuccess={onAdminQuickOrderSuccess} />;
        case 'promoCodes':
            return <AdminPromoCodeManager />;
        default: // Order list views
            let title = "All Orders";
            if (filterCriteria.status && filterCriteria.payment) {
                title = `${filterCriteria.status} & ${filterCriteria.payment === 'paid' ? 'Paid' : 'Pending Payment'} Orders`;
            } else if (filterCriteria.status) {
                title = `${filterCriteria.status} Orders`;
            } else if (filterCriteria.payment) {
                title = `${filterCriteria.payment === 'paid' ? 'Paid' : 'Pending Payment'} Orders`;
            }

            return (
              <>
                <div className={classes.filterControls}>
                  <input
                    type="text"
                    placeholder="Search by Order ID, Name, Phone, Address, Area..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={classes.filterInput}
                  />
                  <select
                    value={filterCriteria.status}
                    onChange={(e) => setFilterCriteria(prev => ({ ...prev, status: e.target.value }))}
                    className={classes.filterSelect}
                  >
                    <option value="">All Order Statuses</option>
                    <option value="Ordered">Ordered</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Collected">Collected/Delivered</option>
                    {/* <option value="Cancelled">Cancelled</option> */}
                  </select>
                   <select
                    value={filterCriteria.payment}
                    onChange={(e) => setFilterCriteria(prev => ({ ...prev, payment: e.target.value }))}
                    className={classes.filterSelect}
                  >
                    <option value="">All Payment Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Pending Payment</option>
                  </select>
                </div>
                <AdminOrderListView
                  title={title}
                  orders={orders}
                  onUpdateOrder={handleUpdateOrder}
                  onOrderDeleted={handleOrderDeleted} // <<< PASS THE NEW HANDLER
                  loading={loadingOrders}
                />
              </>
            );
    }
  };

  if (!currentUser) { // Should be handled by ProtectedRoute, but as a fallback
      navigate('/admin/login');
      return <p>Redirecting to login...</p>;
  }


  return (
    <div className={classes.dashboardPage}>
      <header className={classes.header}>
        <h1 className={classes.headerTitle}>Mango Business Admin</h1>
        <div className={classes.headerUser}>
            Logged in as: {currentUser.email}
            <button onClick={handleLogout} className={classes.logoutButton}>Logout</button>
        </div>
      </header>
      <div className={classes.contentArea}>
        <div className={classes.sidebar}>
          <h3 className={classes.sidebarTitle}>Orders</h3>
          <a href="#allOrders" className={activeView === 'allOrders' || (activeView !== 'inventory' && !filterCriteria.status && !filterCriteria.payment && !nonOrderViews.includes(activeView)) ? `${classes.navLink} ${classes.activeNavLink}` : classes.navLink} onClick={(e) => { e.preventDefault(); handleSidebarClick('allOrders', ''); }}>All Orders</a>
          <a href="#ordered" className={activeView === 'ordered' && filterCriteria.status === 'Ordered' ? `${classes.navLink} ${classes.activeNavLink}` : classes.navLink} onClick={(e) => { e.preventDefault(); handleSidebarClick('ordered', 'Ordered'); }}>Ordered</a>
          <a href="#collected" className={activeView === 'collected' && filterCriteria.status === 'Collected' ? `${classes.navLink} ${classes.activeNavLink}` : classes.navLink} onClick={(e) => { e.preventDefault(); handleSidebarClick('collected', 'Collected'); }}>Collected/Delivered</a>
          <a href="#pendingPayment" className={activeView === 'pendingPayment' && filterCriteria.payment === 'unpaid' ? `${classes.navLink} ${classes.activeNavLink}` : classes.navLink} onClick={(e) => { e.preventDefault(); handleSidebarClick('pendingPayment', '', 'unpaid'); }}>Pending Payment</a>
          <a href="#paidCollected" className={activeView === 'paidCollected' && filterCriteria.status === 'Collected' && filterCriteria.payment === 'paid' ? `${classes.navLink} ${classes.activeNavLink}` : classes.navLink} onClick={(e) => { e.preventDefault(); handleSidebarClick('paidCollected', 'Collected', 'paid'); }}>Paid & Collected</a>
          <a href="#allPaid" className={activeView === 'allPaid' && filterCriteria.payment === 'paid' ? `${classes.navLink} ${classes.activeNavLink}` : classes.navLink} onClick={(e) => { e.preventDefault(); handleSidebarClick('allPaid', '', 'paid'); }}>All Paid Orders</a>
          <a href="#cancelled" className={activeView === 'cancelled' && filterCriteria.status === 'Cancelled' ? `${classes.navLink} ${classes.activeNavLink}` : classes.navLink} onClick={(e) => { e.preventDefault(); handleSidebarClick('cancelled', 'Cancelled'); }}>Cancelled</a>
          
          <hr className={classes.sidebarDivider} />
          <h3 className={classes.sidebarTitle}>Management</h3>
          <a href="#adminQuickOrder" className={activeView === 'adminQuickOrder' ? `${classes.navLink} ${classes.activeNavLink}` : classes.navLink} onClick={(e) => { e.preventDefault(); handleSidebarClick('adminQuickOrder'); }}>Quick Add Order</a>
          <a href="#promoCodes" className={activeView === 'promoCodes' ? `${classes.navLink} ${classes.activeNavLink}` : classes.navLink} onClick={(e) => { e.preventDefault(); handleSidebarClick('promoCodes'); }}>Manage Promo Codes</a>
          <a href="#inventory" className={activeView === 'inventory' ? `${classes.navLink} ${classes.activeNavLink}` : classes.navLink} onClick={(e) => { e.preventDefault(); handleSidebarClick('inventory'); }}>Manage Mango Types</a>
          {/* <a href="#appSettings" className={activeView === 'appSettings' ? `${classes.navLink} ${classes.activeNavLink}` : classes.navLink} onClick={(e) => { e.preventDefault(); handleSidebarClick('appSettings'); }}>App Settings</a> */}
            
          <hr className={classes.sidebarDivider} />
          <h3 className={classes.sidebarTitle} style={{marginTop: '15px'}}>Exports</h3>
          <button
            onClick={handleExportOrders}
            disabled={isExporting || loadingOrders || orders.length === 0} // Disable if no orders or loading
            className={`${classes.navLink} ${classes.exportButton}`} 
            title={orders.length === 0 ? "No orders to export in current view" : "Export currently viewed orders to CSV"}
          >
            {isExporting ? 'Exporting Orders...' : 'Export Viewed Orders'}
          </button>
          <button
            onClick={handleExportUsers}
            disabled={isExporting}
            className={`${classes.navLink} ${classes.exportButton}`} 
          >
            {isExporting ? 'Exporting Users...' : 'Export All Users'}
          </button>
        </div>
        <div className={classes.mainContent}>
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};
export default AdminDashboardPage;