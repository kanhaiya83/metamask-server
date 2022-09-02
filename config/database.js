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
    name:{type:String,default:""},
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
        oauth_verifier:{type:String}
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
    }

  });
  

const UserModel = mongoose.model('User', userSchema);





module.exports = {UserModel};
