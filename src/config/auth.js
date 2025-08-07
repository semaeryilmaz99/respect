import { betterAuth } from "better-auth";
import config from './environment';

export const auth = betterAuth({
  socialProviders: {
    spotify: {
      clientId: config.SPOTIFY_CLIENT_ID,
      clientSecret: config.SPOTIFY_CLIENT_SECRET,
    },
  },
});