import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "./features/auth/pages/Login.jsx";
import Register from "./features/auth/pages/Register.jsx";
import { Protected } from "./features/auth/Protected.jsx";
import Player from "./features/home/component/Player.jsx";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/app",
    element: (
      <Protected>
        <Player />
      </Protected>
    ),
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
