const express = require("express");
const jwt = require("jsonwebtoken");

const {
  CampaignModel,
  UserModel,
  TelegramModel,
  CampaignManagerModel,
  UnapprovedCampaignModel,
} = require("../config/database");
const verifyAdminJWT = require("../middlewares/verifyAdminJWT");
const verifyManagerJWT = require("../middlewares/verifyManagerJWT");

const managerRouter = express.Router();
require("dotenv").config();

const { JWT_SECRET } = process.env;

managerRouter.get("/manager/verify", verifyManagerJWT, (req, res) => {
  res.send({ success: true });
});
managerRouter.post("/manager/login", async (req, res) => {
  try {
    const usernameReceived = req.body.username;
    const passwordReceived = req.body.password;
    const foundManager = await CampaignManagerModel.findOne({username:usernameReceived})
    if(!foundManager) return res.send({success:false, message:"No user found with that username"})

    if (passwordReceived === foundManager.password) {
      const managerAuthToken = await jwt.sign({username:foundManager.username}, JWT_SECRET);
      return res.send({ success: true, managerAuthToken });
    }
    else{
      return res.send({success:false, message:"Incorrect password!!"})
    }
  } catch (e) {
    return res.status(500).send({ success: false, message:"Some error occurred!" });
  }
});
managerRouter.get("/manager/data", verifyManagerJWT, async (req, res) => {
  try {
    const campaignsList = await CampaignModel.find({});
    return res.send({ success: true, campaignsList });
  } catch (e) {
    return res.status(500).send({ success: false });
  }
});

managerRouter.post("/manager/campaign/new",verifyManagerJWT,async (req,res)=>{
  try{
    const newCamp = new UnapprovedCampaignModel({...req.body,managerUsername:req.username})
    const saved =await  newCamp.save()
    await CampaignManagerModel.updateOne({username:req.username},{$addToSet:{campaignsCreated:saved._id}})
    res.send({success:true,addedCampaign:saved})
  }catch (e) {
    return res.status(500).send({ success: false });
  }
})
module.exports = managerRouter;
