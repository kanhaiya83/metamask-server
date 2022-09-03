const { UserModel, TelegramModel } = require("../config/database");
const verifyJWT = require("../middlewares/verifyJWT");
const TelegramBot = require('node-telegram-bot-api');
var debug = require('debug')('telegram-router') 
const  randomstring = require("randomstring");

const express = require("express");
require("dotenv").config();
const app = express();
app.use(express.json());

// const cors = require("cors");

// app.use(cors());
const router = express.Router();



const {TELEGRAM_SECRET_TOKEN} = process.env;

 const bot = new TelegramBot(TELEGRAM_SECRET_TOKEN, {polling: true});

bot.on('message', async(msg) => {
    if(msg.text==="/getcode"){
        bot.sendMessage(msg.chat.id,msg.chat.id)
    }
    console.log(msg);
    if(msg.chat.type==="group" || msg.chat.type==="supergroup"){
        if(msg.new_chat_member && !(msg.new_chat_member.is_bot)){
        const chatGroup= await TelegramModel.findOneAndUpdate({chatId:(msg.chat.id).toString()},{$push:{members:msg.new_chat_member.id.toString()}},{upsert:true,new:true})
        }
    }
    if(msg.chat.type === "private" && msg.text.split(" ")[0]==="verify"){
        
            const verificationCode=msg.text.split(" ")[1]
            debug("Verification code received:",verificationCode)
            const foundUser=await UserModel.findOneAndUpdate({"auth.telegram.code":verificationCode},{auth:{telegram:{chatId:msg.from.id,isConnected:true,code:null}}})
            if(!foundUser){
              return bot.sendMessage(msg.chat.id,"Invalid Code! Please try again!")  
        }
        return bot.sendMessage(msg.chat.id,"Account verified successfully!")  
        

    }
  });

  router.get("/telegram/all",async (req,res)=>{
    const data=await TelegramModel.find({})
    res.send(data)
  })
  router.get("/telegram/all/delete",async (req,res)=>{
    const data=await TelegramModel.deleteMany({})
    res.send(data)
  })
router.get("/auth/telegram",verifyJWT,async (req,res)=>{
   try{ const address=req.address
    debug({address})
        const randomCode=randomstring.generate({length:10,capitalization:"uppercase"});
        const user=await UserModel.findOneAndUpdate({address},{$set : {"auth.telegram":{code:randomCode}}})
        const formattedCode="verify "+randomCode
        return res.send({success:true,code:formattedCode})  }      
        catch(e){
            return res.status(500).send({success:false,error:e,message:"Some error occurred!"})
        }

})
router.get("/auth/telegram/verify",verifyJWT,async (req,res)=>{
    try{const {address}=req
    const user=await UserModel.findOne({address})
    const isConnected=user?.auth?.telegram?.isConnected
    debug(user.auth)
    if(isConnected === true){
        return res.send({success:true})
    }
    return res.send({success:false})}
    catch(e){
        console.log(e);
        return res.status(500).send({success:false,error:e,message:"Some error occurred!"})
    }
})
router.get("/auth/telegram/disconnect",verifyJWT,async (req,res)=>{
    try{const {address}=req
    const update=await UserModel.updateOne({address},{$set:{"auth.telegram":{isConnected:false,code:null,chatId:null}}})
    return res.send({success:true})}
    catch(e){
        return res.status(500).send({success:false,error:e,message:"Some error occurred!"})
    }
})

module.exports = {bot,router}