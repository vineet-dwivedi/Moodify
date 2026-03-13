import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FaceExpression from "../../Expressions/components/FaceExpression";
import useSong from "../hooks/useSong";
import { useAuth } from "../../auth/hooks/useAuth";
import "./Player.scss";
import gsap from "gsap";

const MOODS = [
  { id: "happy", label: "Happy", tone: "Bright / radiant" },
  { id: "sad", label: "Sad", tone: "Soft / reflective" },
  { id: "neutral", label: "Neutral", tone: "Balanced / focus" },
  { id: "suprised", label: "Suprised", tone: "Spark / energetic" },
];

const initialMood = "neutral";

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getInitials = (value) => {
  if (!value) return "MF";
  const base = value.split("@")[0].replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  if (!base) return "MF";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const Player = () => {
  const { loading: songLoading, song, handleGetSong } = useSong();
  const { user, loading: authLoading, handleLogout } = useAuth();
  const [activeMood, setActiveMood] = useState(initialMood);
  const [errorMessage, setErrorMessage] = useState("");
  const [detectedExpression, setDetectedExpression] = useState("Detecting...");
  const [isDetecting, setIsDetecting] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const [recentTracks, setRecentTracks] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("moodify-favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("moodify-theme") || "dark";
  });
  const [themeJiggle, setThemeJiggle] = useState(false);
  const audioRef = useRef(null);
  const shellRef = useRef(null);
  const lastAutoMoodRef = useRef(null);
  const shouldStopAfterPlayRef = useRef(false);
  const lastSongIdRef = useRef(null);
  const copyTimerRef = useRef(null);
  const navigate = useNavigate();

  const resolveMoodFromExpression = (expression) => {
    if (!expression) return null;

    const normalized = expression.toLowerCase();

    if (normalized === "happy") return "happy";
    if (normalized === "sad") return "sad";
    if (normalized === "neutral") return "neutral";
    if (normalized === "surprised") return "suprised";
    if (normalized === "angry") return "neutral";
    if (normalized === "no face") return null;
    if (normalized === "detecting...") return null;

    return null;
  };

  const activeMoodLabel = useMemo(() => {
    const match = MOODS.find((mood) => mood.id === activeMood);
    return match?.label ?? "Mood";
  }, [activeMood]);

  const moodClass = `mood-${activeMood}`;

  const displayName = useMemo(() => {
    if (user?.username) return user.username;
    if (user?.email) return user.email;
    return "Moodify listener";
  }, [user]);

  const userInitials = useMemo(() => getInitials(displayName), [displayName]);

  const isFavorite = useMemo(() => {
    if (!song?.url) return false;
    return favorites.some((item) => item.url === song.url);
  }, [favorites, song?.url]);

  const latestTimestamp = recentTracks[0]?.timestamp;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mood = activeMood;
    return () => {
      if (root.dataset.mood === activeMood) {
        delete root.dataset.mood;
      }
    };
  }, [activeMood]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("moodify-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (!song?.url) return;
    if (lastSongIdRef.current === song.url) return;

    lastSongIdRef.current = song.url;
    setSessionCount((count) => count + 1);

    const entry = {
      id: song.url,
      title: song.title || "Untitled track",
      mood: song.mood || activeMood,
      timestamp: new Date().toISOString(),
    };

    setRecentTracks((previous) => [
      entry,
      ...previous.filter((item) => item.id !== entry.id),
    ].slice(0, 6));
  }, [song?.url, song?.title, song?.mood, activeMood]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".player-panel", { y: 24, opacity: 0, duration: 0.9 })
        .from(".player-card", { y: 24, opacity: 0, duration: 0.9 }, "-=0.6")
        .from(".player-insights", { y: 24, opacity: 0, duration: 0.8 }, "-=0.6")
        .from(".player-mood", { y: 16, opacity: 0, duration: 0.6, stagger: 0.06 }, "-=0.5")
        .from(".player-expression", { y: 16, opacity: 0, duration: 0.6 }, "-=0.4");

      gsap.to(".player-glow--left", {
        x: 80,
        y: 50,
        duration: 12,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".player-glow--right", {
        x: -80,
        y: -60,
        duration: 14,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, shellRef);

    return () => ctx.revert();
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("moodify-theme", nextTheme);
    }
    setThemeJiggle(true);
    window.setTimeout(() => setThemeJiggle(false), 520);
  };

  const handleMoodSelect = async (mood) => {
    setActiveMood(mood);
    setErrorMessage("");

    try {
      const nextSong = await handleGetSong({ mood });
      if (!nextSong) {
        setErrorMessage("No song found for this mood yet.");
      }
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      setErrorMessage(backendMessage || "Unable to fetch a song right now.");
    }
  };

  const handleExpressionChange = async (expression) => {
    if (!isDetecting) return;

    setDetectedExpression(expression);

    const mood = resolveMoodFromExpression(expression);
    if (!mood) return;

    if (lastAutoMoodRef.current === mood) return;
    lastAutoMoodRef.current = mood;

    setActiveMood(mood);
    setErrorMessage("");

    try {
      const nextSong = await handleGetSong({ mood });
      if (!nextSong) {
        setErrorMessage("No song found for this mood yet.");
        return;
      }
      shouldStopAfterPlayRef.current = true;
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      setErrorMessage(backendMessage || "Unable to fetch a song right now.");
    }
  };

  useEffect(() => {
    if (!song?.url || !audioRef.current) return;
    setAutoplayBlocked(false);
    const playPromise = audioRef.current.play();
    if (playPromise?.catch) {
      playPromise
        .then(() => {
          if (shouldStopAfterPlayRef.current) {
            shouldStopAfterPlayRef.current = false;
            setIsDetecting(false);
            setDetectedExpression("Paused");
          }
        })
        .catch(() => setAutoplayBlocked(true));
    }
  }, [song?.url]);

  const handleAudioPlay = () => {
    if (shouldStopAfterPlayRef.current) {
      shouldStopAfterPlayRef.current = false;
      setIsDetecting(false);
      setDetectedExpression("Paused");
    }
  };

  const handleToggleDetection = () => {
    setIsDetecting((previous) => {
      const next = !previous;
      if (next) {
        lastAutoMoodRef.current = null;
        shouldStopAfterPlayRef.current = false;
        setDetectedExpression("Detecting...");
        setErrorMessage("");
        setAutoplayBlocked(false);
      } else {
        setDetectedExpression("Paused");
      }
      return next;
    });
  };

  const handleCopyLink = async () => {
    if (!song?.url) return;
    try {
      await navigator.clipboard.writeText(song.url);
      setCopyMessage("Link copied to clipboard");
    } catch {
      setCopyMessage("Copy failed. Use manual copy.");
    }

    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => setCopyMessage(""), 2200);
  };

  const handleOpenLink = () => {
    if (!song?.url) return;
    window.open(song.url, "_blank", "noreferrer");
  };

  const handleToggleFavorite = () => {
    if (!song?.url) return;

    setFavorites((previous) => {
      const exists = previous.find((item) => item.url === song.url);
      if (exists) {
        return previous.filter((item) => item.url !== song.url);
      }
      const nextItem = {
        url: song.url,
        title: song.title || "Untitled track",
        mood: song.mood || activeMood,
      };
      return [nextItem, ...previous].slice(0, 8);
    });
  };

  const handleClearHistory = () => {
    setRecentTracks([]);
  };

  const handleClearFavorites = () => {
    setFavorites([]);
  };

  const handleLogoutClick = async () => {
    try {
      await handleLogout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <section ref={shellRef} className={`player-shell ${moodClass} theme-${theme}`}>
      <div className="player-glow player-glow--left" />
      <div className="player-glow player-glow--right" />

      <div className="player-layout">
        <div className="player-panel">
          <div className="player-topbar">
            <div className="player-brand">
              <span className="player-brand__title">Moodify</span>
              <span className="player-brand__status">Live session</span>
            </div>
            <div className="player-topbar__actions">
              <div className="player-user">
                <span className="player-user__avatar">{userInitials}</span>
                <div className="player-user__meta">
                  <span className="player-user__label">Signed in</span>
                  <span className="player-user__name">{displayName}</span>
                </div>
              </div>
              <button
                type="button"
                className="player-logout"
                onClick={handleLogoutClick}
                disabled={authLoading}
              >
                {authLoading ? "Signing out..." : "Log out"}
              </button>
              <button
                type="button"
                className={`player-theme-toggle ${themeJiggle ? "is-jiggling" : ""}`}
                onClick={handleThemeToggle}
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                <span className="player-theme-toggle__ring" />
                <span className="player-theme-toggle__core" />
                <span className="player-theme-toggle__spark" />
              </button>
            </div>
          </div>

          <h1>Pick a mood. We&apos;ll sculpt the atmosphere.</h1>
          <p className="player-subtitle">
            Choose one of the four supported moods, or let detection drive the playlist.
          </p>

          <div className="player-quickstats">
            <div className="player-quickstat">
              <span>Auto-detect</span>
              <strong>{isDetecting ? "Live" : "Paused"}</strong>
            </div>
            <div className="player-quickstat">
              <span>Active mood</span>
              <strong>{activeMoodLabel}</strong>
            </div>
            <div className="player-quickstat">
              <span>Session picks</span>
              <strong>{sessionCount}</strong>
            </div>
          </div>

          <div className="player-moods">
            {MOODS.map((mood) => (
              <motion.button
                key={mood.id}
                type="button"
                className={`player-mood ${activeMood === mood.id ? "is-active" : ""}`}
                onClick={() => handleMoodSelect(mood.id)}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <span className="player-mood__label">{mood.label}</span>
                <span className="player-mood__tone">{mood.tone}</span>
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {errorMessage ? (
              <motion.p
                className="player-error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {errorMessage}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <motion.div
            className="player-expression"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          >
            <FaceExpression
              onExpressionChange={handleExpressionChange}
              enabled={isDetecting}
              showLabel={false}
            />
            <p className="player-expression__label">
              {isDetecting ? `Detected: ${detectedExpression}` : "Detection paused"}
            </p>
            <button
              type="button"
              className="player-detect-btn"
              onClick={handleToggleDetection}
              aria-pressed={isDetecting}
            >
              {isDetecting ? "Stop detection" : "Start detection"}
            </button>
            <p className="player-expression__hint">
              Detection pauses automatically once a mood is detected and music starts.
            </p>
          </motion.div>
        </div>

        <div className="player-stack">
          <div className="player-card">
            <div className="player-card__header">
              <div className="player-card__title">
                <span className="player-tag">Now playing</span>
                <span className="player-tag player-tag--subtle">{activeMoodLabel}</span>
              </div>
              <div className="player-card__actions">
                <button
                  type="button"
                  className={`player-action-btn ${isFavorite ? "is-active" : ""}`}
                  onClick={handleToggleFavorite}
                  disabled={!song?.url}
                >
                  {isFavorite ? "Saved" : "Save"}
                </button>
                <button
                  type="button"
                  className="player-action-btn"
                  onClick={handleCopyLink}
                  disabled={!song?.url}
                >
                  Copy link
                </button>
                <button
                  type="button"
                  className="player-action-btn"
                  onClick={handleOpenLink}
                  disabled={!song?.url}
                >
                  Open
                </button>
              </div>
            </div>

            <div className="player-card__body">
              <div className="player-art">
                {song?.posterUrl ? (
                  <img src={song.posterUrl} alt={`${song.title || activeMoodLabel} cover`} />
                ) : (
                  <div className="player-art__placeholder">
                    <span>Artwork pending</span>
                  </div>
                )}
              </div>

              <div className="player-meta">
                <h2>{song?.title || "Awaiting your mood"}</h2>
                <p>{song?.mood ? `Mood: ${song.mood}` : "Select a mood to load music."}</p>
                <p className="player-meta__line">
                  Last updated: {latestTimestamp ? formatTime(latestTimestamp) : "--"}
                </p>

                <audio
                  className="player-audio"
                  controls
                  ref={audioRef}
                  src={song?.url || undefined}
                  onPlay={handleAudioPlay}
                />

                {songLoading ? <p className="player-status">Fetching your track...</p> : null}
                {autoplayBlocked ? (
                  <p className="player-status">Autoplay is blocked. Tap play to start.</p>
                ) : null}
                {copyMessage ? <p className="player-copy">{copyMessage}</p> : null}
              </div>
            </div>
          </div>

          <div className="player-insights">
            <div className="player-insights__header">
              <div>
                <p className="player-kicker">Session</p>
                <h3>Insights & controls</h3>
              </div>
              <span className={`player-status-pill ${isDetecting ? "is-live" : "is-paused"}`}>
                {isDetecting ? "Detection live" : "Detection paused"}
              </span>
            </div>

            <div className="player-metrics">
              <div className="player-metric">
                <span>Active mood</span>
                <strong>{activeMoodLabel}</strong>
              </div>
              <div className="player-metric">
                <span>Session picks</span>
                <strong>{sessionCount}</strong>
              </div>
              <div className="player-metric">
                <span>Theme</span>
                <strong>{theme === "dark" ? "Midnight" : "Daylight"}</strong>
              </div>
            </div>

            <div className="player-actions">
              <button
                type="button"
                className="player-action-btn"
                onClick={handleToggleDetection}
              >
                {isDetecting ? "Pause detection" : "Resume detection"}
              </button>
              <button
                type="button"
                className="player-action-btn"
                onClick={handleClearHistory}
                disabled={!recentTracks.length}
              >
                Clear history
              </button>
              <button
                type="button"
                className="player-action-btn"
                onClick={handleClearFavorites}
                disabled={!favorites.length}
              >
                Clear saved
              </button>
            </div>

            <div className="player-history">
              <div className="player-history__header">
                <h4>Recent picks</h4>
                <span>{recentTracks.length}</span>
              </div>
              {recentTracks.length ? (
                <div className="player-history__list">
                  {recentTracks.map((item) => (
                    <div className="player-history__item" key={item.id}>
                      <div className="player-history__meta">
                        <span className="player-history__title">{item.title}</span>
                        <span className="player-history__time">{formatTime(item.timestamp)}</span>
                      </div>
                      <span className="player-history__mood">{item.mood}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="player-empty">No picks yet. Choose a mood to begin.</p>
              )}
            </div>

            <div className="player-favorites">
              <div className="player-history__header">
                <h4>Saved tracks</h4>
                <span>{favorites.length}</span>
              </div>
              {favorites.length ? (
                <div className="player-history__list">
                  {favorites.map((item) => (
                    <div className="player-history__item" key={item.url}>
                      <div className="player-history__meta">
                        <span className="player-history__title">{item.title}</span>
                        <span className="player-history__time">{item.mood}</span>
                      </div>
                      <button
                        type="button"
                        className="player-action-btn player-action-btn--ghost"
                        onClick={() =>
                          setFavorites((previous) =>
                            previous.filter((entry) => entry.url !== item.url)
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="player-empty">Save tracks to build a personal shortlist.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Player;
