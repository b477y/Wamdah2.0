import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import UserModel from '../../db/models/User.model';

passport.use(
  new GoogleStrategy(
    {
      clientID: "146654726525-69kq31dpk5ihb67hcvf87cjmne0d6p13.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: 'http://localhost:3000/api/auth/google/callback',
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube',
      ],
      accessType: 'offline',
      prompt: 'consent',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        const user = await UserModel.findOne({ email });

        if (!user) {
          return done(null, false, { message: 'User not found. Please register first.' });
        }

        user.googleTokens = {
          access_token: accessToken,
          refresh_token: refreshToken ?? user.googleTokens?.refresh_token,
        };
        await user.save();

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
