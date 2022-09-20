const express = require("express");
const jwt = require("jsonwebtoken");
const multer  = require('multer')
const { CampaignModel, UserModel, UnapprovedCampaignModel } = require("../config/database");
const verifyJWT = require("../middlewares/verifyJWT");
const campaignRouter = express.Router();
const {uploadImage} = require("./../utils/uploadImage")
var path = require('path');
const verifyAdminJWT = require("../middlewares/verifyAdminJWT");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
  }
})

var upload = multer({ storage: storage });
campaignRouter.get("/campaign/all/delete",async(req,res)=>{
await CampaignModel.deleteMany({})
await UnapprovedCampaignModel.deleteMany({})
res.send("success")
})
campaignRouter.get("/campaign/all",async(req,res)=>{
    try{const campaignsList=await CampaignModel.find({});
    return res.send({success:true,campaignsList})}
    catch(e){
    return res.status(500).send({success:false})
    
    }
    })
campaignRouter.post("/campaign",verifyAdminJWT,upload.fields([{name:"campaign-image"},{name:"brand-logo"}]),async(req,res)=>{
  const campaignImage =req.files["campaign-image"][0].filename
  const brandLogo =req.files["brand-logo"][0].filename
  const {url:campaignImageURL} = await uploadImage(path.join(__dirname,"../uploads/",campaignImage))
  const {url:brandLogoURL} = await uploadImage(path.join(__dirname,"../uploads/",brandLogo))
  const data = (req.body)
  const tasks = JSON.parse(req.body.tasks)
  const campaignData = {...data,tasks,image:campaignImageURL,brandLogo:brandLogoURL}
    try{const newCampaign=new CampaignModel(campaignData);

        const savedCampaign=await newCampaign.save();
    return res.send({success:true,savedCampaign})}
    catch(e){
        console.log(e)
    return res.status(500).send({success:false})
    
    }
    })




module.exports = campaignRouter