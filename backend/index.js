const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const { OAuth2Client } = require("google-auth-library");

async function getUserData(access_token) {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
  );

  //console.log('response',response);
  const data = await response.json();
  console.log("data", data);
}

app.get("/hello", (req,res)=>{
    res.send("Hey There.");
});


app.post('/request', async function(req, res, next) {
    res.header("Access-Control-Allow-Origin", 'http://localhost:5173');
    res.header("Access-Control-Allow-Credentials", 'true');
    res.header("Referrer-Policy","no-referrer-when-downgrade");
    const redirectURL = 'http://127.0.0.1:3000/oauth';
    const oAuth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
        redirectURL
      );
  
      // Generate the url that will be used for the consent dialog.
      const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile  openid ',
        prompt: 'consent'
      });
  
      res.json({url:authorizeUrl})
  
  });

app.get("/oauth", async function (req, res, next) {
  const code = req.query.code;

  try {
    const redirectURL = "http://127.0.0.1:3000/oauth";
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
    await getUserData(oAuth2Client.credentials.access_token);
  } catch (err) {
    console.log("Error logging in with OAuth2 user", err);
  }

  res.redirect(303, "http://localhost:5173");
});

app.listen(3000);
