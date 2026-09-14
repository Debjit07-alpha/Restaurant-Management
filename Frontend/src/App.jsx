import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import FavoriteNotice from "./components/FavoriteNotice";
import ProtectedRoute from "./components/ProtectedRoute";
import UserRoute from "./components/UserRoute";
import AdminLayout from "./components/AdminLayout";

import Home from "./pages/Home";
import MenuItemDetails from "./pages/MenuItemDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import MyOrders from "./pages/MyOrders";
import Notifications from "./pages/Notifications";
import Rewards from "./pages/Rewards";
import OrderDetails from "./pages/OrderDetails";
import Favorites from "./pages/Favorites";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";

import DineIn from "./pages/DineIn";
import DineInCart from "./pages/DineInCart";
import DineInCheckout from "./pages/DineInCheckout";
import BookTable from "./pages/BookTable";
import MyReservations from "./pages/MyReservations";
import { DineInCartProvider } from "./context/DineInCartContext";
import Dashboard from "./pages/admin/Dashboard";
import Tables from "./pages/admin/Tables";
import Reservations from "./pages/admin/Reservations";
import MenuItems from "./pages/admin/MenuItems";
import AddMenuItem from "./pages/admin/AddMenuItem";
import EditMenuItem from "./pages/admin/EditMenuItem";
import Users from "./pages/admin/Users";
import Orders from "./pages/admin/Orders";
import Reviews from "./pages/admin/Reviews";
import Coupons from "./pages/admin/Coupons";
import Delivery from "./pages/admin/Delivery";
import RewardsAdmin from "./pages/admin/Rewards";

function App() {
  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <FavoriteNotice />
      <Routes>
        {/* Public / user pages with navbar */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
            </>
          }
        />
        <Route
          path="/menu/:id"
          element={
            <>
              <Navbar />
              <MenuItemDetails />
            </>
          }
        />
        <Route
          path="/cart"
          element={
            <>
              <Navbar />
              <Cart />
            </>
          }
        />
        <Route
          path="/register"
          element={
            <>
              <Navbar />
              <Register />
            </>
          }
        />
        <Route
          path="/checkout"
          element={
            <UserRoute>
              <>
                <Navbar />
                <Checkout />
              </>
            </UserRoute>
          }
        />
        <Route
          path="/order-success/:orderId"
          element={
            <UserRoute>
              <>
                <Navbar />
                <OrderSuccess />
              </>
            </UserRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <UserRoute>
              <>
                <Navbar />
                <MyOrders />
              </>
            </UserRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <UserRoute>
              <>
                <Navbar />
                <OrderDetails />
              </>
            </UserRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <UserRoute>
              <>
                <Navbar />
                <Favorites />
              </>
            </UserRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <UserRoute>
              <>
                <Navbar />
                <Rewards />
              </>
            </UserRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <UserRoute>
              <>
                <Navbar />
                <Notifications />
              </>
            </UserRoute>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <Navbar />
              <Login />
            </>
          }
        />
        <Route
          path="/dine-in/:tableNumber"
          element={
            <DineInCartProvider>
              <DineIn />
            </DineInCartProvider>
          }
        />
        <Route
          path="/dine-in/cart"
          element={
            <UserRoute>
              <DineInCartProvider>
                <>
                  <Navbar />
                  <DineInCart />
                </>
              </DineInCartProvider>
            </UserRoute>
          }
        />
        <Route
          path="/dine-in/checkout"
          element={
            <UserRoute>
              <DineInCartProvider>
                <>
                  <Navbar />
                  <DineInCheckout />
                </>
              </DineInCartProvider>
            </UserRoute>
          }
        />
        <Route
          path="/book-table"
          element={
            <UserRoute>
              <>
                <Navbar />
                <BookTable />
              </>
            </UserRoute>
          }
        />
        <Route
          path="/reservations"
          element={
            <UserRoute>
              <>
                <Navbar />
                <MyReservations />
              </>
            </UserRoute>
          }
        />
        <Route
          path="/admin/login"
          element={
            <>
              <Navbar />
              <AdminLogin />
            </>
          }
        />

        {/* Protected admin pages */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/menu-items"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <MenuItems />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/menu-items/add"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AddMenuItem />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/menu-items/edit/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <EditMenuItem />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Users />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Orders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Reviews />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Coupons />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rewards"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <RewardsAdmin />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Tables />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reservations"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Reservations />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/delivery"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Delivery />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <>
              <Navbar />
              <p className="p-6 text-center">Page not found.</p>
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
