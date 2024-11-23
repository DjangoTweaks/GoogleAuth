const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const jwt = require('jsonwebtoken'); // For decoding and verifying JWT
const app = express();
const { OAuth2Client } = require("google-auth-library");


app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true, // Allow cookies and Authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
}));

app.use((req, res, next) => {
  // res.header("Access-Control-Allow-Origin", req.headers.origin); // Dynamically allow the origin
  res.header("Access-Control-Allow-Credentials", 'true'); // Allow cookies
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(cookieParser());


function authenticateUser(req, res, next) {
  const idToken = req.cookies.id_token;

  if (!idToken) {
    return res.status(401).json({ error: 'No ID token provided' });
  }

  try {
    // Decode the ID token
    const decoded = jwt.decode(idToken);
    console.log("decoded", decoded);
    if (!decoded) {
      throw new Error('Failed to decode ID token');
    }

    // Attach user info to the request
    req.user = {
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
    };

    next(); // Proceed to the next middleware/route handler
  } catch (err) {
    console.error('Error decoding ID token:', err);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

app.get('/protected-route', authenticateUser, (req, res) => {
  res.json({
    message: 'Access granted!',
    user: req.user, // Contains user info (id, name, email, picture)
  });
});



async function getUserData(access_token) {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
  );

  //console.log('response',response);
  const data = await response.json();
  console.log("data", data);
    return data;
}

app.get("/hello", (req,res)=>{
    res.send("Hey There.");
});


app.post('/request', async function(req, res, next) {
    const redirectURL = process.env.REDIRECT_URL;

    const oAuth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
        redirectURL
      );
  
      // Generate the url that will be used for the consent dialog.
      const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile  openid  email',
        prompt: 'consent'
      });
  
      res.json({url:authorizeUrl})
  
  });

app.get("/oauth", async function (req, res, next) {
  const code = req.query.code;

  try {
    const redirectURL = process.env.REDIRECT_URL;
    const oAuth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      redirectURL
    );
    const r = await oAuth2Client.getToken(code);
    // Make sure to set the credentials on the OAuth2 client.
    await oAuth2Client.setCredentials(r.tokens);
    const user = oAuth2Client.credentials;
    console.log("credentials", user);
    const userData = await getUserData(oAuth2Client.credentials.access_token);


    // res.cookie('access_token', r.tokens.access_token, {
    //   httpOnly: true,
    //   secure: false,   // Only send over HTTPS
    //   sameSite: 'Lax', // Required for cross-origin cookies
    //   maxAge: r.tokens.expiry_date - Date.now(), // Set expiry to token's lifespan
    // });

    res.cookie('id_token', r.tokens.id_token, {
      httpOnly: false, // for accessing the cookie via frontend
      secure: true,
      sameSite: 'None',
      // domain: 'localhost', // Explicitly set the domain to match frontend
      maxAge: r.tokens.expiry_date - Date.now(),
    });

    // res.cookie('refresh_token', r.tokens.refresh_token, {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: 'Lax',
    //   maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (adjust as needed)
    // });

    // res.cookie('user_name', userData.name, {
    //   httpOnly: false,  // Accessible by the frontend
    //   secure: false,    // Set to true in production with HTTPS
    //   sameSite: 'Lax',  // Prevent CSRF during local testing
    //   maxAge: 24 * 60 * 60 * 1000, // 1 day
    // });
    
    // res.cookie('user_picture', userData.picture, {
    //   httpOnly: false,  // Accessible by the frontend
    //   secure: false,
    //   sameSite: 'Lax',
    //   maxAge: 24 * 60 * 60 * 1000,
    // });

    res.redirect(303, process.env.CLIENT_URL);

    
  } catch (err) {
    console.log("Error logging in with OAuth2 user", err);
    res.status(500).send("Authentication failed");
  }

  // res.redirect(303, process.env.CLIENT_URL);
});


app.post('/logout', (req, res) => {
  // Clear cookies
  res.clearCookie('id_token', { path: '/' });
  // res.clearCookie('access_token', { path: '/' });
  // res.clearCookie('refresh_token', { path: '/' });
  console.log("logged out"); 
  res.status(200).json({ message: 'Logged out successfully' });
});



app.listen(3000);
