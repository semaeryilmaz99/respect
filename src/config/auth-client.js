import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient();

export const signInWithSpotify = async () => {
  try {
    const data = await authClient.signIn.social({
      provider: "spotify"
    });
    return { data, error: null };
  } catch (error) {
    console.error("Spotify login error:", error);
    return { data: null, error };
  }
};