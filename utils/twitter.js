const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config();

const client = new TwitterApi({
  appKey: process.env.ACCESS_TOKEN,
  appSecret: process.env.ACCESS_TOKEN_SECRET,
});
(async () => {
  const authLink = await client.generateAuthLink(
    "http:localhost:4000/callback"
  );
  console.log(authLink);
})();
