const express = require("express");
const jwt = require("jsonwebtoken");

const { CampaignModel, UserModel } = require("../config/database");
const verifyJWT = require("../middlewares/verifyJWT");
const campaignRouter = express.Router();

// const cors = require("cors");

// app.use(cors());
campaignRouter.get("/campaign/all/delete",async(req,res)=>{
await CampaignModel.deleteMany({})

res.send("success")
})
campaignRouter.get("/campaign/all",async(req,res)=>{
    try{const campaignsList=await CampaignModel.find({});
    return res.send({success:true,campaignsList})}
    catch(e){
    return res.status(500).send({success:false})
    
    }
    })
    campaignRouter.post("/campaign",async(req,res)=>{
    try{const newCampaign=new CampaignModel(req.body);
        const savedCampaign=await newCampaign.save();
    return res.send({success:true,savedCampaign})}
    catch(e){
    return res.status(500).send({success:false})
    
    }
    })


module.exports = campaignRouter