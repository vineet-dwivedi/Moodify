import { useCallback, useContext } from "react";
import { getSong } from "../service/song.api";
import { SongContext } from "../song.context";

const useSong = () => {
  const context = useContext(SongContext);

  if (!context) {
    throw new Error("useSong must be used within SongContextProvider.");
  }

  const { loading, setLoading, song, setSong } = context;

  const handleGetSong = useCallback(
    async ({ mood }) => {
      if (!mood) return null;

      setLoading(true);
      setSong(null);

      try {
        const data = await getSong({ mood });
        const nextSong = data?.song ?? null;
        setSong(nextSong);
        return nextSong;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setSong]
  );

  return { loading, song, handleGetSong };
};

export default useSong;
