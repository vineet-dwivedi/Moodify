import { useMemo, useState } from "react";
import FaceExpression from "./features/Expressions/components/FaceExpression";

function App() {
  const [currentMood, setCurrentMood] = useState("Unknown");

  const recommendedVibe = useMemo(() => {
    switch (currentMood) {
      case "Happy":
        return "Upbeat pop / dance";
      case "Sad":
        return "Soft acoustic / lo-fi";
      case "Angry":
        return "Calm piano / ambient";
      case "Surprised":
        return "Energetic indie / electronic";
      case "Neutral":
        return "Chill focus beats";
      default:
        return "Waiting for mood detection...";
    }
  }, [currentMood]);

  return (
    <main style={{ padding: "1.5rem", maxWidth: "920px", margin: "0 auto" }}>
      <h1>Moodify</h1>
      <p>Current mood: {currentMood}</p>
      <p>Suggested vibe: {recommendedVibe}</p>
      <div style={{ marginTop: "1rem" }}>
        <FaceExpression onExpressionChange={setCurrentMood} />
      </div>
    </main>
  );
}

export default App;
