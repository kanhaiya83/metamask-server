const { UserModel } = require("../config/database");
const verifyJWT = require("../middlewares/verifyJWT");
const express = require("express");
require("dotenv").config();
const app = express();
app.use(express.json());

const router = express.Router();
const { TwitterApi } = require("twitter-api-v2");

const {
  CONSUMER_KEY,
  CONSUMER_KEY_SECRET,
  CALLBACK_URL,
  CLIENT_ID,
  CLIENT_SECRET,
} = process.env;

router.get("/callback", async (req, res) => {
  // Extract state and code from query string
  const { state, code } = req.query;
  console.log({ code });
  // Get the saved codeVerifier from session
  // const { codeVerifier, state: sessionState } = req.session;

  // if (!codeVerifier || !state || !sessionState || !code) {
  //   return res.status(400).send('You denied the app or your session expired!');
  // }
  // if (state !== sessionState) {
  //   return res.status(400).send('Stored tokens didnt match!');
  // }

  // Obtain access token
  const client2 = new TwitterApi({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  });
  const user = await UserModel.findOne({ "auth.twitter.state": state });
  const { codeVerifier } = user.auth.twitter;
  client2
    .loginWithOAuth2({ code, codeVerifier, redirectUri: CALLBACK_URL })
    .then(
      async ({
        client: loggedClient,
        accessToken,
        refreshToken,
        expiresIn,
      }) => {
        // {loggedClient} is an authenticated client in behalf of some user
        // Store {accessToken} somewhere, it will be valid until {expiresIn} is hit.
        // If you want to refresh your token later, store {refreshToken} (it is present if 'offline.access' has been given as scope)

        // Example request
        await UserModel.updateOne(
          { "auth.twitter.state": state },
          {
            auth: {
              twitter: {
                isConnected: true,
                codeVerifier: "",
                accessToken,
                refreshToken,
                expiresIn,
              },
            },
          }
        );
        const { data: userObject } = await loggedClient.v2.me();
        console.log(userObject);
        res.send("<script>window.close();</script >");
      }
    )
    .catch();
});

router.get("/auth/twitter", verifyJWT, async (req, res) => {
  const client = new TwitterApi({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  });

  const data = client.generateOAuth2AuthLink(CALLBACK_URL, {
    scope: ["tweet.read", "users.read", "offline.access"],
  });
  console.log(data);
  await UserModel.updateOne(
    { address: req.address },
    {
      auth: { twitter: { codeVerifier: data.codeVerifier, state: data.state } },
    }
  );

  res.send({ success: true, ...data });
});

router.get("/auth/twitter/disconnect",verifyJWT,async(req,res)=>{
    const user=await UserModel.updateOne({address:req.address},{auth:{twitter:{}}})
    return res.send({success:true})
})
router.get("/auth/twitter/verify",verifyJWT,async(req,res)=>{
    const user=await UserModel.findOne({address:req.address})
    const isConnected=user?.auth?.twitter?.isConnected
console.log(user.auth)
    if(isConnected === true){
        return res.send({success:true})
    }
    else{
        return res.send({success:false})

    }
})

module.exports = router;
