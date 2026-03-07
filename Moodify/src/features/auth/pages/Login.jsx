import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./Login.scss";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

const fragmentShader = `
vec4 abyssColor = vec4(0.02, 0.03, 0.07, 1.0);
vec4 tunnelColor = vec4(1.9, 1.6, 1.45, 1.0);

uniform float time;
uniform vec2 resolution;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y * 0.6;

  float r = length(uv);
  float y = fract(r / 0.005 / (r - 0.01) + time);

  y = smoothstep(0.01, 4.0, y);

  float x = length(uv);
  x = smoothstep(0.5, 0.01, x);

  vec3 tunnel = mix(tunnelColor.rgb, abyssColor.rgb, x) * y;
  gl_FragColor = vec4(tunnel, 1.0);
}
`;

const vertexShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function Login() {
  const shaderMountRef = useRef(null);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const mountNode = shaderMountRef.current;

    if (!mountNode) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 2);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 1.0 },
        resolution: { value: new THREE.Vector2(1, 1) },
      },
      fragmentShader,
      vertexShader,
      transparent: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x020206, 1);
    mountNode.appendChild(renderer.domElement);

    const resize = () => {
      const width = mountNode.clientWidth;
      const height = mountNode.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      material.uniforms.resolution.value.set(width, height);
      renderer.setSize(width, height, false);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mountNode);

    const startTime = Date.now();
    let animationId = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedMilliseconds = Date.now() - startTime;
      material.uniforms.time.value = elapsedMilliseconds / 1000;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      mountNode.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((previous) => ({ ...previous, [name]: value }));
  };

  const { user, loading, handleLogin } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await handleLogin({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      setSuccessMessage("Logged in successfully.");
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      setErrorMessage(backendMessage || "Unable to login right now.");
    }
  };

  const navigate = useNavigate();

  useEffect(()=>{
    if(user) navigate('/',{replace:true});
  },[user,navigate])

  return (
    <section className="login-shell">
      <div className="login-card">
        <div className="login-visual">
          <div className="shader-frame">
            <div ref={shaderMountRef} className="shader-mount" />
          </div>
        </div>

        <div className="login-content">
          <p className="login-kicker">Moodify access</p>
          <h1>Sign In</h1>
          <p className="login-subtitle">Use your email and password to continue.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={credentials.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={credentials.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
          {errorMessage ? <p className="login-feedback login-feedback--error">{errorMessage}</p> : null}
          {successMessage ? <p className="login-feedback login-feedback--success">{successMessage}</p> : null}
          {user ? (
            <p className="login-feedback login-feedback--success">
              Signed in as {user.username || user.email}
            </p>
          ) : null}
          <p className="login-footer">
            Don&apos;t have account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;
