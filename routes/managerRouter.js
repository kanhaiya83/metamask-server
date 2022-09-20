const express = require("express");
const jwt = require("jsonwebtoken");
const multer  = require('multer')
const {uploadImage} = require("./../utils/uploadImage")
var path = require('path')

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
  }
})

var upload = multer({ storage: storage });
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

const { MANAGER_JWT_SECRET } = process.env;

managerRouter.get("/manager/verify", verifyManagerJWT, (req, res) => {
  res.send({ success: true });
});
managerRouter.post("/manager/login", async (req, res) => {
  try {
    const emailReceived = req.body.email;
    const passwordReceived = req.body.password;
    const foundManager = await CampaignManagerModel.findOne({email:emailReceived})
    if(!foundManager) return res.send({success:false, message:"No user found with that email"})

    if (passwordReceived === foundManager.password) {
      const managerAuthToken = await jwt.sign({email:foundManager.email}, MANAGER_JWT_SECRET);
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
    const  managerData= await CampaignManagerModel.findOne({email:req.email},{password:0})
    // const campaignsList = await CampaignModel.find({});
    return res.send({ success: true, managerData });
  } catch (e) {
    return res.status(500).send({ success: false });
  }
});

managerRouter.post("/manager/campaign/new",verifyManagerJWT,upload.fields([{name:"campaign-image"},{name:"brand-logo"}]),async (req,res)=>{
  try{
    const campaignImage =req.files["campaign-image"][0].filename
    const brandLogo =req.files["brand-logo"][0].filename
    const {url:campaignImageURL} = await uploadImage(path.join(__dirname,"../uploads/",campaignImage))
    const {url:brandLogoURL} = await uploadImage(path.join(__dirname,"../uploads/",brandLogo))
    const data = (req.body)
    const tasks = JSON.parse(req.body.tasks)
    const campaignData = {...data,tasks,image:campaignImageURL,managerEmail:req.email,brandLogo:brandLogoURL}
    const newCamp = new UnapprovedCampaignModel(campaignData)
    const saved =await  newCamp.save()
    await CampaignManagerModel.updateOne({email:req.email},{$addToSet:{campaignsCreated:saved._id}})
    res.send({success:true,addedCampaign:saved})
  }catch (e) {
    console.log(e)
    return res.status(500).send({ success: false,error:e,message:"Some error occurred!" });
  }
})
module.exports = managerRouter;
