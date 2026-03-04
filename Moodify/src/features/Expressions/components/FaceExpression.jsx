import useFaceExpressionDetection from "../hooks/useFaceExpressionDetection";

export default function FaceExpression({ onExpressionChange }) {
  const { videoRef, expression } = useFaceExpressionDetection(onExpressionChange);

  return (
    <div>
      <video ref={videoRef} autoPlay muted playsInline width="500" />
      <h2>{expression}</h2>
    </div>
  );
}
