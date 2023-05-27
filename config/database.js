const mongoose = require("mongoose");

const { Schema } = mongoose;
require("dotenv").config();

let connUri = process.env.DEV_DB_URI || process.env.DB_URI;
mongoose
  .connect(connUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to Mongoose");
  })
  .catch((err) => {
    console.log("Could not connect to mongoose;Error: ", err);
  });

// Creates simple schema for a User.  The hash and salt are derived from the user's given password when they register

userSchema = new Schema({
  address: { type: String, required: true },
  name: { type: String },
  messageToSign: { type: String },
  name: { type: String, default: "John doe" },
  bio: { type: String, default: "Please edit you bio." },
  referralToken:{type:String},
  referredBy:{type:String},
  referrals:[{type:String}],
  auth: {
    twitter: {
      isConnected: { type: Boolean, default: false },
      codeVerifier: { type: String },
      accessToken: { type: String },
      refreshToken: { type: String },
      expiresIn: { type: String },
      state: { type: String },
      oauth_token: { type: String },
      oauth_token_secret: { type: String },
      accessSecret: { type: String },
      oauth_verifier: { type: String },
      username: { type: String },
    },
    telegram: {
      isConnected: { type: Boolean, default: false },
      code: { type: String },
      chatId: { type: String },
    },
    discord: {
      isConnected: { type: Boolean, default: false },
      accessToken: { type: String },
      refreshToken: { type: String },
      state: { type: String },
    },
  },
  completedTasks: [],
  campaignsJoined: [
    {
      campaignId: { type: String },
      allTasksCompleted: { type: Boolean, default: false },
      tasksCompleted: [{ type: String }],
      completedTime: { type: String },
      hasClaimed: { type: Boolean, default: false },
      totalPoints: { type: Number },
    },
  ],
});
// const referralTaskSchema=new Schema({
//   address:{type:String},
//   :{type:String},
//   address:{type:String},
//   address:{type:String},
//   address:{type:String},
// })
const joinedCampaignsSchema = new Schema({
  campaignId: { type: String },
  address:{type : String},
  allTasksCompleted: { type: Boolean, default: false },
  tasksCompleted: [{ type: String }],
  referralTasks:[{
    taskId:{type:String},
    generatedCodes:[{
      code:{type:String},
      isUsed:{type:Boolean,default:false}
    }]
  }],
  completedTime: { type: String },
  hasClaimed: { type: Boolean, default: false },
  totalPoints: { type: Number },
  tasksCount:{type:Number}
});
const campaignSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  totalPoints: { type: Number },
  brandName:{type:String},
  brandURL:{type:String},
  brandLogo:{type:String},
  isFeatured:{type:Boolean,default:false},
  entries:[{
    userId:{type:String}
  }],


  tasks: [
    {
      taskType: { type: String, required: true },
      discordServerId: { type: String },
      discordInviteLink: { type: String },
      discordServerName: { type: String },
      telegramGroupName: { type: String },
      telegramChatId: { type: String },
      telegramGroupLink: { type: String },
      twitterAccountName: { type: String },
      telegramGroup: { type: String },
      twitterAccountUsername: { type: String },
      isCompleted: { type: Boolean, default: false },
      tweetId: { type: String },
      points: { type: Number },
      platformPoints:{type:Number,default:0},
      referralCount:{type:Number,default:1}
      

    },
  ],
});
const unapprovedCampaignSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  totalPoints: { type: Number },
  managerEmail:{type:String},
  platformPoints:{type:Number,default:0},
  brandName:{type:String},
  brandURL:{type:String},
  brandLogo:{type:String},
  contractAddress:{type:String},
  tasks: [
    {
      taskType: { type: String, required: true },
      discordServerId: { type: String },
      discordInviteLink: { type: String },
      discordServerName: { type: String },
      telegramGroupName: { type: String },
      telegramChatId: { type: String },
      telegramGroupLink: { type: String },
      twitterAccountName: { type: String },
      telegramGroup: { type: String },
      twitterAccountUsername: { type: String },
      isCompleted: { type: Boolean, default: false },
      tweetId: { type: String },
      points: { type: Number },
      platformPoints:{type:Number},
      referralCount:{type:Number,default:1}

    },
  ],
});
const TelegramSchema = new Schema({
  chatId: { type: String },
  members: [{ type: String }],
});
const CampaignManagerSchema = new Schema({
  username: { type: String },
  password: { type: String },
  createdAt:{type:Number},
  isRevoked:{type:Boolean,default:false},
  campaignsCreated:[{campaignId:{type:String}}],
  image:{type:String},
  name:{type:String},
  email:{type:String},
  brandName:{type:String,default:""},
  brandURL:{type:String,default:""},
  brandLogo:{type:String,default:""},
  contractAddress:{type:String}
});
const UserModel = mongoose.model("User", userSchema);
const CampaignModel = mongoose.model("Campaign", campaignSchema);
const UnapprovedCampaignModel = mongoose.model("Unapproved Campaign", unapprovedCampaignSchema);
const TelegramModel = mongoose.model("Telegram", TelegramSchema);
const JoinedCampaignsModel = mongoose.model("joinedCampaign", joinedCampaignsSchema);
const CampaignManagerModel = mongoose.model("CampaignsManager", CampaignManagerSchema);

module.exports = { UserModel, CampaignModel, TelegramModel,JoinedCampaignsModel,CampaignManagerModel , UnapprovedCampaignModel};
