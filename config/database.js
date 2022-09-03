const mongoose = require('mongoose');


const { Schema } = mongoose;
require('dotenv').config(); 

let connUri=process.env.DEV_DB_URI || process.env.DB_URI
mongoose
  .connect(connUri, {
    useNewUrlParser: true,
    useUnifiedTopology:true
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
    messageToSign: { type: String},
    name:{type:String,default:"John doe"},
    bio:{type:String,default:"Please edit you bio."},
    auth:{
      twitter:{
        isConnected:{type:Boolean,default:false},
        codeVerifier:{ type: String},
        accessToken:{ type: String},
        refreshToken:{ type: String},
        expiresIn:{ type: String},
        state:{ type: String},
        oauth_token:{type:String},
        oauth_token_secret:{type:String},
        accessSecret:{type:String},
        oauth_verifier:{type:String},
        username:{type:String}
      },
      telegram:{
        isConnected:{type:Boolean,default:false},
        code:{ type: String},
        chatId:{ type: String}
      },
      discord:{
        isConnected:{type:Boolean,default:false},
        accessToken:{ type: String},
        refreshToken:{ type: String},
        state:{ type: String}
      },
    },
    completedTasks:[{type:String}]

  });
  const campaignSchema=new Schema({
    name:{type:String,required:true},
    description:{type:String},
    image:{type:String},
    startTime:{type:String},
    endTime:{type:String},
    tasks:[
      {
        taskType:{type:String,required:true},
        discordServerId:{type:String},
        discordInviteLink:{type:String},
        discordServerName:{type:String},
        telegramGroupName:{type:String},
        telegramChatId:{type:String},
        telegramGroupLink:{type:String},
        twitterAccountName:{type:String},
        telegramGroup:{type:String},
        twitterAccountUsername:{type:String},
        isCompleted:{type : Boolean, default:false},
        tweetId:{type:String} 


      }
    ]
    
  })
const TelegramSchema=new Schema({
  chatId:{type:String},
  members:[{type:String}]
})
const UserModel = mongoose.model('User', userSchema);
const CampaignModel = mongoose.model('Campaign', campaignSchema);
const TelegramModel = mongoose.model('Telegram', TelegramSchema);





module.exports = {UserModel,CampaignModel,TelegramModel};
