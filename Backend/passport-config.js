const bcrypt = require("bcrypt");
const User = require("./models/user_model.js");
const Restaurant = require("./models/restaurant_model.js")
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy





passport.use('local',
  new LocalStrategy({ usernameField: "email"}, (email, password, done) => {
    console.log("Yo")
    User.findOne({ 'email': email }).then(user => {
      if (!user) {
        return done(null, false, { message: 'No user with that email' })
      }
      console.log(user)
      try {
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;

          if (isMatch) {
              return done(null, user);
          } else {
              return done(null, false, { message: "Wrong password" });
          }
        });
      } catch (e) {
        return done(e)
      }
    }).catch(err => {
      return done(null, false, { message: err });
    })
  })
)


passport.use('restaurant_local',
  new LocalStrategy({ usernameField: "email"}, (email, password, done) => {
    console.log("Yo")
    Restaurant.findOne({ 'email': email }).then(user => {
      if (!user) {
        return done(null, false, { message: 'No user with that email' })
      }
      console.log(user)
      try {
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;

          if (isMatch) {
              return done(null, user);
          } else {
              return done(null, false, { message: "Wrong password" });
          }
        });
      } catch (e) {
        return done(e)
      }
    }).catch(err => {
      return done(null, false, { message: err });
    })
  })
)



passport.use('google',
  new GoogleStrategy(
      {
        clientID: "895855768391-42421cog1j30a4ptb6o69f9oda16co8p.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: 'http://localhost:8000/google/callback',
      },
      (accessToken, refreshToken, profile, done) => {

          try {
              User.findOne({ 'email': profile.emails[0].value}).then(user => {
                console.log(typeof(profile.id))
                if (user) done(null, user)
                else {
                  // var hashedPassword = bcrypt.hash(profile.id, 10);
                  const user = new User();
                  user.email = profile.emails[0].value;
                  user.password = profile.id
                  user.save()

                  console.log("Good")

                  done(null, user)
                }
              })
          } catch (err) {
              console.error(err)
          }
      }
  )
)




passport.serializeUser((user, done) => {
  var key = {
    id: user.id,
    type: user.usertype
  }

  done(null, key);
});

passport.deserializeUser((key, done) => {
  var Model = key.type === 'restaurant' ? Restaurant : User;
  Model.findOne({_id: key.id}, '-salt -password', function(err, user) {
    done(err, user)
  })
});



module.exports = passport;