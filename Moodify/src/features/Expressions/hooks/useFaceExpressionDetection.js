import { useEffect, useRef, useState } from "react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import {
  DEFAULT_EXPRESSION,
  FACE_HISTORY_SIZE,
  FACE_LANDMARKER_MODEL_URL,
  NO_FACE_EXPRESSION,
  WASM_BASE_URL,
} from "../constants/mediapipe";
import {
  getMostFrequentLabel,
  inferExpression,
} from "../utils/expressionInference";

export default function useFaceExpressionDetection(onExpressionChange) {
  const videoRef = useRef(null);
  const historyRef = useRef([]);
  const lastSentRef = useRef("");
  const [expression, setExpression] = useState(DEFAULT_EXPRESSION);

  useEffect(() => {
    let faceLandmarker;
    let stream;
    let rafId;
    let cancelled = false;
    let lastVideoTime = -1;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
      const baseLandmarkerOptions = {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL_URL,
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1,
      };

      try {
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          ...baseLandmarkerOptions,
          baseOptions: {
            ...baseLandmarkerOptions.baseOptions,
            delegate: "GPU",
          },
        });
      } catch {
        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          ...baseLandmarkerOptions,
          baseOptions: {
            ...baseLandmarkerOptions.baseOptions,
            delegate: "CPU",
          },
        });
      }

      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const detect = () => {
        if (cancelled || !videoRef.current || !faceLandmarker) return;

        if (
          videoRef.current.readyState >= 2 &&
          videoRef.current.currentTime !== lastVideoTime
        ) {
          lastVideoTime = videoRef.current.currentTime;
          const result = faceLandmarker.detectForVideo(
            videoRef.current,
            performance.now()
          );

          const categories = result.faceBlendshapes?.[0]?.categories;
          if (!categories?.length) {
            historyRef.current = [];
            setExpression(NO_FACE_EXPRESSION);
          } else {
            const shape = Object.fromEntries(
              categories.map((category) => [category.categoryName, category.score])
            );
            const rawExpression = inferExpression(shape);

            historyRef.current.push(rawExpression);
            if (historyRef.current.length > FACE_HISTORY_SIZE) {
              historyRef.current.shift();
            }

            const stableExpression = getMostFrequentLabel(historyRef.current);
            setExpression(stableExpression);

            if (
              onExpressionChange &&
              stableExpression !== lastSentRef.current &&
              stableExpression !== NO_FACE_EXPRESSION &&
              stableExpression !== DEFAULT_EXPRESSION
            ) {
              lastSentRef.current = stableExpression;
              onExpressionChange(stableExpression);
            }
          }
        }

        rafId = requestAnimationFrame(detect);
      };

      detect();
    };

    init().catch((error) => setExpression(`Error: ${error.message}`));

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (faceLandmarker) faceLandmarker.close();
    };
  }, [onExpressionChange]);

  return { videoRef, expression };
}

