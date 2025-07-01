import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import useStore from "./hooks/useStore";

import Profile from "./pages/Landing/Profile"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/profile" replace />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/profile/:email",
    element: <Profile />,
  },
  {
    path: "*",
    element: <Navigate to="/profile" replace />,
  }
]);

function App() {
  const { save } = useStore();

  useEffect(() => {
    // Inicializar el carrito de compras si es necesario
    const ShopCart = localStorage.getItem("ShopCart");
    if (ShopCart) {
      save({ ShopCart: JSON.parse(ShopCart) });
    } else {
      localStorage.setItem("ShopCart", JSON.stringify([]));
      save({ ShopCart: [] });
    }

    // Inicializar datos de SPA si es necesario
    const spaData = sessionStorage.getItem("spaData");
    if (spaData) {
      save({ spaData: JSON.parse(spaData) });
    }
  }, [save]);

  return <RouterProvider router={router} />;
}

export default App;