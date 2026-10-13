import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import NewOrder from "./pages/NewOrder";
import Orders from "./pages/Orders";
import AddFunds from "./pages/AddFunds";
import Wallet from "./pages/Wallet";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCustomers from "./pages/admin/Customers";
import AdminOrders from "./pages/admin/Orders";
import AdminDeposits from "./pages/admin/Deposits";
import PaymentSettings from "./pages/admin/PaymentSettings";
import AdminServices from "./pages/admin/Services";
import AdminCategories from "./pages/admin/Categories";
import Layout from "./components/Layout";
import { RequireAdmin, RequireAuth } from "./auth/guards";
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new-order" element={<NewOrder />} />
        <Route path="/services" element={<Services />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/add-funds" element={<AddFunds />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/customers" element={<RequireAdmin><AdminCustomers /></RequireAdmin>} />
        <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
        <Route path="/admin/deposits" element={<RequireAdmin><AdminDeposits /></RequireAdmin>} />
        <Route path="/admin/payment-settings" element={<RequireAdmin><PaymentSettings /></RequireAdmin>} />
        <Route path="/admin/services" element={<RequireAdmin><AdminServices /></RequireAdmin>} />
        <Route path="/admin/categories" element={<RequireAdmin><AdminCategories /></RequireAdmin>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
