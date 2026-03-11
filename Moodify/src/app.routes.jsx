import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import Login from "./features/auth/pages/Login.jsx";
import Register from "./features/auth/pages/Register.jsx";
import { Protected } from "./features/auth/Protected.jsx";
import Home from "./features/home/pages/Home.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Protected>
        <Home/>
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
]);
