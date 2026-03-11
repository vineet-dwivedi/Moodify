import useFaceExpressionDetection from "../hooks/useFaceExpressionDetection";

export default function FaceExpression({
  onExpressionChange,
  enabled = true,
  showLabel = true,
}) {
  const { videoRef, expression } = useFaceExpressionDetection(
    onExpressionChange,
    enabled
  );

  return (
    <div>
      <video ref={videoRef} autoPlay muted playsInline width="500" />
      {showLabel ? <h2>{expression}</h2> : null}
    </div>
  );
}
