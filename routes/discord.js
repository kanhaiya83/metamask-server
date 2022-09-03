const { UserModel } = require("../config/database");
const verifyJWT = require("../middlewares/verifyJWT");
const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");

app.use(cors());

app.use(express.json());
const shortid = require('shortid');const router = express.Router();
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2();

const {
  SERVER_URL,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
} = process.env;
const getAccessToken=async (refreshToken)=>{
  const refreshTokenAuth = new DiscordOauth2({
    clientId: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
  
    redirectUri: SERVER_URL+"/discord/callback",
  })
const res=await   refreshTokenAuth.tokenRequest({
    // clientId, clientSecret and redirectUri are omitted, as they were already set on the class constructor
    refreshToken:refreshToken,
    grantType: "refresh_token",
    scope: ["identify", "guilds","email"],
  });
  if(res && res.access_token){
    return {success:true,data:res}
  }
  else{
    return { success : false}
  }
}
const getServerList=async (address)=>{
  const user= await UserModel.findOne({address})
  if(!user) throw new Error("No user found")
  const res=await getAccessToken(user.auth.discord.refreshToken)
  if(!res.success)  throw new Error("Some error occurred!")
  await UserModel.updateOne({address},{"auth.discord.refreshToken":res.data.refresh_token})
  const guildsData=await oauth.getUserGuilds(res.data.access_token)
  return (guildsData.map(g=>{return {id:g.id}}));
}
router.get("/discord/server/:id",verifyJWT,async(req,res)=>{
try{
  const guilds=await getServerList(req.address)
  console.log({guilds,id:req.params.id})
  const foundGuild=guilds.findIndex(g=> {
    console.log(g.id ,req.params.id);
    return g.id === req.params.id
  })
  console.log({foundGuild})
  if(foundGuild === -1){
    return res.send({success:false})
  }
  return res.send({success:true})
  
}
catch(e){
  return res.status(500).send({success:false})
}
})

router.get("/auth/discord", verifyJWT, async (req, res) => {
const state=shortid.generate() 
  await UserModel.updateOne(
    { address: req.address },
    {
      $set: {
        "auth.discord": {
          state
        },
      },
    }
  );
const authURL=process.env.DISCORD_AUTH_URL +"&state="+state
  res.send({ success: true,url:authURL
});
});
router.get("/discord/callback", async (req, res) => {
    const {code,state}= req.query
oauth.tokenRequest({
	clientId: DISCORD_CLIENT_ID,
	clientSecret: DISCORD_CLIENT_SECRET,

	code: code,
	scope: "identify guilds",
	grantType: "authorization_code",

	redirectUri: SERVER_URL+"/discord/callback",
}).then(async (accessData)=>{
  const {access_token,refresh_token}=accessData
  try{
    await UserModel.updateOne(
      { "auth.discord.state":state },
      {$set : {"auth.discord":
        {
            isConnected: true,
            accessToken:access_token,
            refreshToken:refresh_token,
            state:""
          },
        }
      }
    );
res.send("<script>window.close();</script >")

  }
  catch(e){
res.send("<script>window.close();</script >")
  }
})

});



router.get("/auth/discord/disconnect",verifyJWT,async(req,res)=>{
    try{const user=await UserModel.updateOne({address:req.address},{$set : {"auth.discord":{isConnected:false}}})
    return res.send({success:true})}
    catch(e){
      res.status(500).send({success:false,message:"Some error occurred!"})
    }
})
router.get("/auth/discord/verify",verifyJWT,async(req,res)=>{
    const user=await UserModel.findOne({address:req.address})
    const isConnected=user?.auth?.discord?.isConnected
    if(isConnected === true){
        return res.send({success:true})
    }
    else{
        return res.send({success:false})

    }
})

module.exports = router;
