const express = require("express");
const jwt = require("jsonwebtoken");
const {
  CampaignModel,
  UserModel,
  TelegramModel,
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
  console.log({campaignId});
  const user = await UserModel.findOne({ address });
  const userData = JSON.parse(JSON.stringify(user));

  let foundCampaign = userData.campaignsJoined.find(
    (cmp) => (cmp.campaignId === campaignId)
  );
  if (foundCampaign) {
    console.log("Found a campaign")
    //if task id is already exists, don't push
    if(foundCampaign.tasksCompleted.indexOf(taskId) === -1) {
      foundCampaign.tasksCompleted.push(taskId);
  }
    const campaignObj = await CampaignModel.findOne({ _id: campaignId });

    if (
      foundCampaign.tasksCompleted &&
      foundCampaign.tasksCompleted.length === campaignObj.tasks.length
    ) {
      foundCampaign.allTasksCompleted = true;
      foundCampaign.completedTime = new Date().getTime().toString();
    }
    const updatedUser = await UserModel.findOneAndUpdate(
      { address },
      { $set: { "campaignsJoined.$[camp]": foundCampaign } },
      { new: true, arrayFilters: [{ "camp.campaignId": { $eq: campaignId } }] }
    );
    console.log(updatedUser.campaignsJoined);

    return updatedUser.campaignsJoined
  } else {
    console.log("Campaign Not Found")

    foundCampaign = {
      campaignId,
      allTasksCompleted: false,
      tasksCompleted: [taskId],
    };
    const campaignObj = await CampaignModel.find({ _id: campaignId });
    if (
      foundCampaign.completedTasks &&
      foundCampaign.completedTasks.length === campaignObj.tasks.length
    ) {
      foundCampaign.allTasksCompleted = true;
      foundCampaign.completedTime = new Date().getTime().toString();
    }
    const updatedUser = await UserModel.findOneAndUpdate(
      { address },
      { $push: { campaignsJoined: foundCampaign } },
      { new: true}
    );
    console.log(updatedUser.campaignsJoined.find(c=> c.campaignId === campaignId));

    return updatedUser.campaignsJoined
  }

  
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
    const campaignsJoined = await markTaskComplete(req.address, campaignId, taskId);
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
       const campaignsJoined = await markTaskComplete(req.address, campaignId, taskId);
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
      const campaignsJoined = await markTaskComplete(req.address, campaignId, taskId);
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
      const campaignsJoined = await markTaskComplete(req.address, campaignId, taskId);
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
taskRouter.get("/reset/all", async (req, res) => {
  await UserModel.updateMany({}, { completedTasks: [], campaignsJoined:[] });
  // await TelegramModel.updateMany({}, { members: [] });
  //  await CampaignModel.deleteMany({})

  res.send("success");
});

taskRouter.get("/reset/joined", async (req, res) => {
  res.send({ success: true });
});
module.exports = taskRouter;
