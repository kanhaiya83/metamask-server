const express = require("express");
const randomstring = require("randomstring");
const jwt = require("jsonwebtoken");
const {
  CampaignModel,
  UserModel,
  TelegramModel,
  JoinedCampaignsModel,
  CampaignManagerModel,
} = require("../config/database");
const { TwitterApi } = require("twitter-api-v2");
const verifyJWT = require("../middlewares/verifyJWT");

const taskRouter = express.Router();
require("dotenv").config();
// const cors = require("cors");

// app.use(cors());
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2();

const {
  SERVER_URL,
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  CONSUMER_KEY,
  CONSUMER_SECRET,
} = process.env;
const getAccessToken = async (refreshToken) => {
  const refreshTokenAuth = new DiscordOauth2({
    clientId: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,

    redirectUri: SERVER_URL + "/discord/callback",
  });
  const res = await refreshTokenAuth.tokenRequest({
    // clientId, clientSecret and redirectUri are omitted, as they were already set on the class constructor
    refreshToken: refreshToken,
    grantType: "refresh_token",
    scope: ["identify", "guilds", "email"],
  });
  if (res && res.access_token) {
    return { success: true, data: res };
  } else {
    return { success: false };
  }
};
const getServerList = async (address) => {
  const user = await UserModel.findOne({ address });
  if (!user) throw new Error("No user found");
  const res = await getAccessToken(user.auth.discord.refreshToken);
  if (!res.success) throw new Error("Some error occurred!");
  await UserModel.updateOne(
    { address },
    { "auth.discord.refreshToken": res.data.refresh_token }
  );
  const guildsData = await oauth.getUserGuilds(res.data.access_token);
  return guildsData.map((g) => {
    return { id: g.id };
  });
};
const checkIsFollowing = async (userClient, username) => {
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
const checkRetweet = async (userClient, tweetId, username) => {
  console.log({ tweetId, username });
  const result = await userClient.v2.tweetRetweetedBy(tweetId);
  console.log(result);
  if (result && result.data) {
    const foundRetweet = result.data.find((rt) => rt.username === username);
    if (foundRetweet) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};
const markTaskComplete = async (address, campaignId, taskId) => {
  // console.log({ campaignId,address });

  const foundJoinedCampaign = await JoinedCampaignsModel.findOne({
    address,
    campaignId,
  });
  const foundCampaign = await CampaignModel.findOne({ _id: campaignId });

  if (foundJoinedCampaign) {
    console.log(foundJoinedCampaign.tasksCount,(parseInt(foundJoinedCampaign.tasksCompleted.length) +1))
    const allTasksCompleted =foundJoinedCampaign.tasksCount === (parseInt(foundJoinedCampaign.tasksCompleted.length) +1)
     const updatedJoinedCampaign=await JoinedCampaignsModel.findOneAndUpdate({address,campaignId},{allTasksCompleted,$addToSet:{tasksCompleted:taskId}})

  }
  else{
    const tasksCount=parseInt(foundCampaign.tasks.length)
    const tasksCompleted=[taskId]
    const allTasksCompleted=tasksCount ===tasksCompleted.length

    const newJoinedCampaign = new JoinedCampaignsModel({
      address,
      campaignId,
      totalPoints: foundCampaign.totalPoints,
      tasksCompleted,
      tasksCount,
      allTasksCompleted,
      completedTime:new Date().getTime().toString()

    });
    const savedJoinedCampaign= await newJoinedCampaign.save()
    await CampaignModel.updateOne({_id:campaignId},{$push:{
      entries:{userId:address}
    }})
  }


return await JoinedCampaignsModel.find({address})


};
taskRouter.get("/task/discord", verifyJWT, async (req, res) => {
  const { campaignId, taskId, serverId } = req.query;
  console.log({ campaignId, taskId, serverId });
  try {
    const guilds = await getServerList(req.address);
    const foundGuild = guilds.findIndex((g) => {
      return g.id === serverId;
    });
    console.log({ foundGuild });
    if (foundGuild === -1) {
      return res.send({ success: false });
    }
    const campaignsJoined = await markTaskComplete(
      req.address,
      campaignId,
      taskId
    );
    return res.send({
      success: true,
      campaignsJoined,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ success: false });
  }
});
taskRouter.get("/task/twitterfollow", verifyJWT, async (req, res) => {
  try {
    const { campaignId, taskId, usernametofollow } = req.query;
    const user = await UserModel.findOne({ address: req.address });
    if (user.auth.twitter.isConnected === false) {
      return res.status(403).send({ success: false });
    }
    const userClient = new TwitterApi({
      appKey: CONSUMER_KEY,
      appSecret: CONSUMER_SECRET,
      accessToken: user.auth.twitter.accessToken,
      accessSecret: user.auth.twitter.accessSecret,
    });
    const isFollowing = await checkIsFollowing(userClient, usernametofollow);
    if (isFollowing) {
      const campaignsJoined = await markTaskComplete(
        req.address,
        campaignId,
        taskId
      );
      return res.send({
        success: true,
        campaignsJoined,
      });
    }
    return res.send({ success: false });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ success: false });
  }
});
taskRouter.get("/claim/:campaignId", verifyJWT, async (req, res) => {
  try {
    await JoinedCampaignsModel.updateOne({ address: req.address ,campaignId:req.params.campaignId},{hasClaimed:true});
    const joinedCampaigns=await JoinedCampaignsModel.find({address:req.address})
    res.send({ success: true, joinedCampaigns });
  } catch (e) {
    console.log(e);
  }
});

taskRouter.get("/task/twitterretweet", verifyJWT, async (req, res) => {
  try {
    const { campaignId, taskId, tweetId } = req.query;
    const user = await UserModel.findOne({ address: req.address });
    if (user.auth.twitter.isConnected === false) {
      return res.status(403).send({ success: false });
    }
    const userClient = new TwitterApi({
      appKey: CONSUMER_KEY,
      appSecret: CONSUMER_SECRET,
      accessToken: user.auth.twitter.accessToken,
      accessSecret: user.auth.twitter.accessSecret,
    });
    const hasRetweeted = await checkRetweet(
      userClient,
      tweetId,
      user.auth.twitter.username
    );
    if (hasRetweeted) {
      const campaignsJoined = await markTaskComplete(
        req.address,
        campaignId,
        taskId
      );
      return res.send({
        success: true,
        campaignsJoined,
      });
    }
    return res.send({ success: false });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ success: false });
  }
});
taskRouter.get("/task/telegram", verifyJWT, async (req, res) => {
  try {
    const { campaignId, chatId, taskId } = req.query;
    const user = await UserModel.findOne({ address: req.address });
    if (user.auth.telegram.isConnected === false) {
      return res.status(403).send({ success: false });
    }
    const userTelegramId = user.auth.telegram.chatId;
    const foundGroupChat = await TelegramModel.findOne({ chatId });
    if (foundGroupChat && foundGroupChat.members.includes(userTelegramId)) {
      const campaignsJoined = await markTaskComplete(
        req.address,
        campaignId,
        taskId
      );
      return res.send({
        success: true,
        campaignsJoined,
      });
    }
    return res.send({ success: false });
  } catch (e) {
    console.log(e);
    return res.status(500).send({ success: false });
  }
});
taskRouter.get("/task/referral/generate",verifyJWT,async(req,res)=>{
  try{
    let {taskId,campaignId}=req.query
    const camp = await CampaignModel.findOne({_id:campaignId})
    const tasks = JSON.parse(JSON.stringify(camp.tasks))
    const foundTask = tasks.find(t=>t._id === taskId)
    const count = foundTask.referralCount
    let generatedCodes = []
    for (let i = 0; i < count; i++) {
      const code = randomstring.generate(10);
      generatedCodes.push({
        code,
        isUsed:false
      })
      
    }
    const updatedJoinedCampaign= await JoinedCampaignsModel.findOneAndUpdate({address:req.address,campaignId},{$push:{referralTasks:{taskId,generatedCodes}}},{new:true,upsert:true})
    return res.send({success:true, updatedJoinedCampaign})
  }
  catch(e){
    console.log(e);
    res.status(500).send({success:false})
  }
})
taskRouter.get("/task/referral/refer",verifyJWT,async(req,res)=>{
        const {code} = req.query
        const joinedCampaign = await JoinedCampaignsModel.findOne({"referralTasks.$.generatedCodes.$.code":code})
        if(!joinedCampaign){
          return res.send({
            success:false,
            message:"Invalid Code"
          })
        }
        let referralTasks = JSON.parse(JSON.stringify(joinedCampaign.referralTasks))
        referralTasks= referralTasks.map(t=>{
          temp= t.generatedCodes.map(c=>{
            if(c.code===code){
              c.isUsed= true;
            }
            return c

          })
          t.generatedCodes= temp
          return t
        })
        console.log(referralTasks)
        const updatedCampaign = await JoinedCampaignsModel.findOneAndUpdate({"referralTasks.$.generatedCodes.$.code":code},{referralTasks},{new:true})
        res.send({success:true,updatedCampaign})
})
taskRouter.get("/task/referral/verify",verifyJWT,async(req,res)=>{
  const {campaignId,taskId} = req.query
      const joinedCampaign = await JoinedCampaignsModel.findOne({campaignId,address:req.address})
      if(!joinedCampaign){
        return res.send({success:false})
      }
      const referralTasks = JSON.parse(JSON.stringify(joinedCampaign.referralTasks))
      const task= referralTasks.find(t=>t.taskId === taskId)
      console.log(task)
      if(!task){
        return res.send({success:false,message:"No task found!"})
      }
      let taskCompleted =true;
      task.generatedCodes.forEach(c=>{
        if(!c.isUsed){
          taskCompleted=false;
        }

      })

      if(taskCompleted){

        if(joinedCampaign.tasksCount === joinedCampaign.tasksCompleted.length+1){
         await JoinedCampaignsModel.updateOne({address:req.address,campaignId},{$push:{tasksCompleted:taskId},allTasksCompleted:true})
          

        }
        else{
         await JoinedCampaignsModel.updateOne({address:req.address,campaignId},{$push:{tasksCompleted:taskId}})

        }
        const joinedCampaigns = await JoinedCampaignsModel.find({address:req.address})
        res.send({success:true,joinedCampaigns})
      }
      else{
        return res.send({success:false})
      }
})

taskRouter.get("/temp",async (req,res)=>{
//   const camp =  await CampaignModel.findOneAndUpdate({_id:"6328eaeec74bf341e4cb1849"})
//   let tasks  = JSON.parse(JSON.stringify(camp.tasks)) 
//   tasks = tasks.filter(t=>t.taskType!=="referral")
//   await CampaignModel.findOneAndUpdate({_id:"6328eaeec74bf341e4cb1849"},{
// tasks
//   })
//   return 
  await CampaignModel.findOneAndUpdate({_id:"6328eaeec74bf341e4cb1849"},
    {$push:{tasks:{taskType: "referral",points:10,platformPoints:4,referralCount:1}}
  })
  res.send("success")
  // await JoinedCampaignsModel.update({},{referralTasks:[]})
  // res.send({success:true})
})
taskRouter.get("/reset/all", async (req, res) => {
  await UserModel.updateMany({}, { completedTasks: [], campaignsJoined: [] });
  await JoinedCampaignsModel.deleteMany({});
  await CampaignModel.updateMany({},{entries:[]})
  await  CampaignManagerModel.deleteMany({})
  // await TelegramModel.updateMany({}, { members: [] });
  //  await CampaignModel.deleteMany({})

  res.send("success");
});

taskRouter.get("/reset/joined", async (req, res) => {
  res.send({ success: true });
});
module.exports = taskRouter;
