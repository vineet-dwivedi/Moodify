import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import Login from "./features/auth/pages/Login.jsx";
import Register from "./features/auth/pages/Register.jsx";
import { Protected } from "./features/auth/Protected.jsx";
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Protected>
        <App />
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
