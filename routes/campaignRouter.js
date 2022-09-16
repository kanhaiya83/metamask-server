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
campaignRouter.post("/campaign",verifyAdminJWT,upload.single("campaign-image"),async(req,res)=>{
    const imageName =req.file.filename
    const result = await uploadImage(path.join(__dirname,"../uploads/",imageName))
    console.log(result.url);
    const data = (req.body)
    const tasks = JSON.parse(req.body.tasks)
    const campaignData = {...data,tasks,image:result.url}
    try{const newCampaign=new CampaignModel(campaignData);

        const savedCampaign=await newCampaign.save();
    return res.send({success:true,savedCampaign})}
    catch(e){
        console.log(e)
    return res.status(500).send({success:false})
    
    }
    })




module.exports = campaignRouter