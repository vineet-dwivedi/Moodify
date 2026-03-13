import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import * as THREE from "three";
import "./Register.scss";
import { useAuth } from "../hooks/useAuth";

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

function Register() {
  const shaderMountRef = useRef(null);
  const { user, loading, handleRegister } = useAuth();
  const [formValues, setFormValues] = useState({
    name: "",
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
    setFormValues((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await handleRegister({
        username: formValues.name.trim(),
        email: formValues.email.trim(),
        password: formValues.password,
      });

      setSuccessMessage("Account created. You are now signed in.");
      setFormValues({ name: "", email: "", password: "" });
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      setErrorMessage(backendMessage || "Unable to register right now.");
    }
  };

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <section className="register-shell">
      <div ref={shaderMountRef} className="register-shader" aria-hidden="true" />
      <div className="register-overlay" aria-hidden="true" />

      <div className="register-card">
        <p className="register-kicker">Create account</p>
        <h1>Register</h1>
        <p className="register-subtitle">Start your personalized vibe journey with Moodify.</p>

        <form className="register-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Your full name"
            value={formValues.name}
            onChange={handleChange}
            autoComplete="name"
            required
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formValues.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Create a password"
            value={formValues.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        {errorMessage ? (
          <p className="register-feedback register-feedback--error">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="register-feedback register-feedback--success">{successMessage}</p>
        ) : null}

        <p className="register-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
}

export default Register;
