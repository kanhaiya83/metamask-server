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
  CONSUMER_SECRET,
  CALLBACK_URL,
  CLIENT_ID,
  CLIENT_SECRET,
} = process.env;

router.get("/callback", async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  
  const user = await UserModel.findOne({
    "auth.twitter.oauth_token": oauth_token,
  });
  const client = new TwitterApi({
    appKey: CONSUMER_KEY,
    appSecret: CONSUMER_SECRET,
    accessToken: oauth_token,
    accessSecret: user.auth.twitter.oauth_token_secret,
  });

  client
    .login(oauth_verifier)
    .then(async ({ client: loggedClient, accessToken, accessSecret }) => {
      const {data}= await loggedClient.currentUserV2()
      await UserModel.updateOne(
        { "auth.twitter.oauth_token":oauth_token },
        {$set:{"auth.twitter":{
          isConnected: true,
          accessToken,
          accessSecret,
          oauth_verifier,
          username:data.username
        }}}
      );
      const { data: userObject } = await loggedClient.v2.me();
        console.log(userObject);
        res.send("<script>window.close();</script >");
    })
    .catch((e) => {console.log(e);res.status(403).send("Invalid verifier or access tokens!")});
});

router.get("/auth/twitter", verifyJWT, async (req, res) => {
  const client = new TwitterApi({
    appKey: CONSUMER_KEY,
    appSecret: CONSUMER_SECRET,
  });

  const data = await client.generateAuthLink(CALLBACK_URL);
  console.log(data);
  await UserModel.updateOne(
    { address: req.address },
    {
      $set: {
        "auth.twitter": {
          oauth_token: data.oauth_token,
          oauth_token_secret: data.oauth_token_secret,
        },
      },
    }
  );

  res.send({ success: true, ...data });
});

router.get("/auth/twitter/disconnect", verifyJWT, async (req, res) => {
  const user = await UserModel.updateOne(
    { address: req.address },
    { $set : {"auth.twitter":{isConnected:false}} }
  );
  return res.send({ success: true });
});
router.get("/auth/twitter/verify", verifyJWT, async (req, res) => {
  const user = await UserModel.findOne({ address: req.address });
  const isConnected = user?.auth?.twitter?.isConnected;
  console.log(user.auth);
  if (isConnected === true) {
    return res.send({ success: true });
  } else {
    return res.send({ success: false });
  }
});

router.get("/test",verifyJWT,async(req,res)=>{
  const user=await UserModel.findOne({address:req.address})
  const {accessToken,accessSecret,oauth_verifier}=user.auth.twitter
  console.log({accessToken,accessSecret,oauth_verifier})
  const client3 = new TwitterApi({
    appKey: CONSUMER_KEY,
    appSecret: CONSUMER_SECRET,
    accessToken,
    accessSecret
  });
client3.v2.me().then(console.log)
  // client3.login(oauth_verifier)
  //   .then(async ({ client: loggedClient, accessToken, accessSecret }) => {
  //     // loggedClient is an authenticated client in behalf of some user
  //     // Store accessToken & accessSecret somewhere
  //     console.log(await loggedClient.currentUser() );
  //   })
  //   .catch((e) => res.status(403).send(e));
})

module.exports = router;
