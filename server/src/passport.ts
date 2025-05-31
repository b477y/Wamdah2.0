import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(
  new GoogleStrategy(
    {
      clientID: "146654726525-69kq31dpk5ihb67hcvf87cjmne0d6p13.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:3000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {

      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;

      return done(null, profile);
    }
  )
);
