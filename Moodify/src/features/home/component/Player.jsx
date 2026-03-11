import { useEffect, useMemo, useRef, useState } from "react";
import FaceExpression from "../../Expressions/components/FaceExpression";
import useSong from "../hooks/useSong";
import "./Player.scss";

const MOODS = [
  { id: "happy", label: "Happy", tone: "Bright / radiant" },
  { id: "sad", label: "Sad", tone: "Soft / reflective" },
  { id: "neutral", label: "Neutral", tone: "Balanced / focus" },
  { id: "suprised", label: "Suprised", tone: "Spark / energetic" },
];

const initialMood = "neutral";

const Player = () => {
  const { loading, song, handleGetSong } = useSong();
  const [activeMood, setActiveMood] = useState(initialMood);
  const [errorMessage, setErrorMessage] = useState("");
  const [detectedExpression, setDetectedExpression] = useState("Detecting...");
  const [isDetecting, setIsDetecting] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("moodify-theme") || "dark";
  });
  const [themeJiggle, setThemeJiggle] = useState(false);
  const audioRef = useRef(null);
  const lastAutoMoodRef = useRef(null);
  const shouldStopAfterPlayRef = useRef(false);

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

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mood = activeMood;
    return () => {
      if (root.dataset.mood === activeMood) {
        delete root.dataset.mood;
      }
    };
  }, [activeMood]);

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

  return (
    <section className={`player-shell ${moodClass} theme-${theme}`}>
      <div className="player-glow player-glow--left" />
      <div className="player-glow player-glow--right" />

      <div className="player-layout">
        <div className="player-panel">
          <div className="player-topbar">
            <div className="player-brand">
              <span className="player-brand__kicker">Moodify Player</span>
            </div>
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
          <h1>Pick a mood. We&apos;ll find the vibe.</h1>
          <p className="player-subtitle">
            Choose one of the four supported moods to fetch a track from the backend.
          </p>

          <div className="player-moods">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                type="button"
                className={`player-mood ${activeMood === mood.id ? "is-active" : ""}`}
                onClick={() => handleMoodSelect(mood.id)}
              >
                <span className="player-mood__label">{mood.label}</span>
                <span className="player-mood__tone">{mood.tone}</span>
              </button>
            ))}
          </div>

          {errorMessage ? <p className="player-error">{errorMessage}</p> : null}

          <div className="player-expression">
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
            >
              {isDetecting ? "Stop detection" : "Start detection"}
            </button>
            <p className="player-expression__hint">
              Detection pauses automatically once a mood is detected and music starts.
            </p>
          </div>
        </div>

        <div className="player-card">
          <div className="player-card__header">
            <span className="player-tag">Now playing</span>
            <span className="player-tag player-tag--subtle">{activeMoodLabel}</span>
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

              <audio
                className="player-audio"
                controls
                ref={audioRef}
                src={song?.url || undefined}
                onPlay={handleAudioPlay}
              />

              {loading ? <p className="player-status">Fetching your track...</p> : null}
              {autoplayBlocked ? (
                <p className="player-status">
                  Autoplay is blocked by the browser. Tap play to start.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Player;
