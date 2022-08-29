const { TwitterApi } = require("twitter-api-v2");
const express= require("express")
require("dotenv").config();
const {CONSUMER_KEY,CONSUMER_KEY_SECRET,CALLBACK_URL,CLIENT_ID,CLIENT_SECRET}=process.env
const app=express()
const client = new TwitterApi({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
});
let codeVerifier="";




    app.get('/callback', (req, res) => {
      // Extract state and code from query string
      const { state, code } = req.query;
      console.log({code});
      // Get the saved codeVerifier from session
      // const { codeVerifier, state: sessionState } = req.session;
    
      // if (!codeVerifier || !state || !sessionState || !code) {
      //   return res.status(400).send('You denied the app or your session expired!');
      // }
      // if (state !== sessionState) {
      //   return res.status(400).send('Stored tokens didnt match!');
      // }
    
      // Obtain access token
      const client2 = new TwitterApi({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });
    
      client2.loginWithOAuth2({ code, codeVerifier, redirectUri: CALLBACK_URL })
        .then(async ({ client: loggedClient, accessToken, refreshToken, expiresIn }) => {
          // {loggedClient} is an authenticated client in behalf of some user
          // Store {accessToken} somewhere, it will be valid until {expiresIn} is hit.
          // If you want to refresh your token later, store {refreshToken} (it is present if 'offline.access' has been given as scope)
    
          // Example request
          const { data: userObject } = await loggedClient.v2.me();
          console.log(userObject)
          res.send("<script>window.close();</script >")
        })
        .catch();
    });

    app.get("/auth/twitter",(req,res)=>{
      
const data = client.generateOAuth2AuthLink(CALLBACK_URL, { scope: ['tweet.read', 'users.read', 'offline.access'] });
console.log(data);
codeVerifier=data.codeVerifier

res.send({success:true,...data})

    })