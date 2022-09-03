const { TwitterApi } = require("twitter-api-v2");

require("dotenv").config();
const {
  CONSUMER_KEY,
  CONSUMER_SECRET,
  CALLBACK_URL,
  CLIENT_ID,
  CLIENT_SECRET,
} = process.env;
const userClient = new TwitterApi({
  appKey: CONSUMER_KEY,
  appSecret: CONSUMER_SECRET,
  // Following access tokens are not required if you are
  // at part 1 of user-auth process (ask for a request token)
  // or if you want a app-only client (see below)
  accessToken: "1563138570919227392-F6nrfeKuURgctrKV3PcuvVaitGQrxt",
  accessSecret: "lGMz8iyaRTdxA0JXDUeWNKsymGfEM3Y1eKxTINFRDTbTR",
});

const getTwitterUserId = async () => {
  const { data } = await userClient.v2.user("iamsrk");
  return data.id;
};
const checkIsFollowing = async (username) => {
  const result = await userClient.v1.get("/friendships/lookup.json", {
    screen_name: username,
  });
  console.log(result);
  if (result && result[0] && result[0].connections.includes("following")) {
    return true;
  } else {
    return false;
  }
};

const checkRetweet=async (userClient,tweetId,username)=>{
	const result = await userClient.v2.tweetRetweetedBy(tweetId)
	console.log(result)
	if(result && result.data){
		const foundRetweet=result.data.find(rt=>(rt.username === username))
		if(foundRetweet){
			return true;
		}
		else{
			return false;
		}
		}
	else{
		return false;
	}


}
(async () => {
//   checkIsFollowing("srk");
// checkTweet()
userClient.currentUserV2().then(console.log)
})();
