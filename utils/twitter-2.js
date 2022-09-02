const { TwitterApi } = require("twitter-api-v2");
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const {
  CONSUMER_KEY,
  CONSUMER_SECRET,
  CALLBACK_URL,
  CLIENT_ID,
  CLIENT_SECRET,
} = process.env;
console.log(process.env)
// const client = new TwitterApi({
//   clientId: CLIENT_ID,
//   clientSecret: CLIENT_SECRET,
// });
console.log({CONSUMER_KEY,CONSUMER_SECRET})
const client = new TwitterApi({
  appKey: CONSUMER_KEY, appSecret: CONSUMER_SECRET
});

  (async ()=>{const authLink = await client.generateAuthLink("http://localhost:4000/callback");
  console.log(authLink)})()


