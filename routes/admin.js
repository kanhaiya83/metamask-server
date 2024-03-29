const express = require("express");
const { admin } = require("googleapis/build/src/apis/admin");
const jwt = require("jsonwebtoken");
const randomstring = require("randomstring");

const {
  CampaignModel,
  UserModel,
  TelegramModel,
  CampaignManagerModel,
  UnapprovedCampaignModel,
} = require("../config/database");
const verifyAdminJWT = require("../middlewares/verifyAdminJWT");
const sendMail = require("../utils/sendmail");

const adminRouter = express.Router();
require("dotenv").config();

const { ADMIN_PASSWORD, ADMIN_JWT_SECRET } = process.env;

adminRouter.get("/admin/verify", verifyAdminJWT, (req, res) => {
  res.send({ success: true });
});
adminRouter.post("/admin/login", async (req, res) => {
  try {
    const password = req.body.password;
    if (password === ADMIN_PASSWORD) {
      const adminAuthToken = await jwt.sign({}, ADMIN_JWT_SECRET);
      return res.send({ success: true, adminAuthToken });
    }
    return res.send({ success: false });
  } catch (e) {
    return res.status(500).send({ success: false });
  }
});
adminRouter.get("/admin/data", verifyAdminJWT, async (req, res) => {
  try {
    const campaignsList = await CampaignModel.find({});
    const usersList=await UserModel.find({})
    const managersList = await CampaignManagerModel.find({});
    const unapprovedCampaigns= await UnapprovedCampaignModel.find({})
    return res.send({ success: true, campaignsList,usersList ,managersList,unapprovedCampaigns});
  } catch (e) {
    return res.status(500).send({ success: false });
  }
});
adminRouter.post("/admin/manager/new", verifyAdminJWT, async (req, res) => {
  const {name,email} = req.body
  try {
    const foundManager= await CampaignManagerModel.findOne({email})
    if(foundManager) return res.send({success:false,message:"Mail address already in use"})
    const temp = {
      username: randomstring.generate({ length: 8 }),
      password: randomstring.generate({ length: 16 }),
      createdAt: new Date().getTime(),
      image: `https://avatars.dicebear.com/api/bottts/${Math.random()*100000}.svg`,
      name,
      email
    };
    const newManager = new CampaignManagerModel(temp);
    const savedManager = await newManager.save();
    const mailText=`Your Airlyft Campaign Manager password: "${savedManager.password}
    Login here : https://demo-202.netlify.app/manager/login`

    const r= await sendMail(email,"Airlyft Manager", mailText)
    return res.send({
      success: true,
      newManager: savedManager,
    });
  } catch (e) {
    return res
      .status(500)
      .send({ success: false, message: "Some error occurred!" });
  }
});
adminRouter.get(
  "/admin/manager/revoke/:id",
  verifyAdminJWT,
  async (req, res) => {
    try {
      const managerId = req.params.id;
      const updatedManager = await CampaignManagerModel.findByIdAndUpdate(
        managerId,
        { isRevoked: true }
      );
      return res.send({
        success: true,
      });
    } catch (e) {
      return res
        .status(500)
        .send({ success: false, message: "Some error occurred!" });
    }
  }
);
adminRouter.get(
  "/admin/manager/allow/:id",
  verifyAdminJWT,
  async (req, res) => {
    try {
      const managerId = req.params.id;
      const updatedManager = await CampaignManagerModel.findByIdAndUpdate(
        managerId,
        { isRevoked: false }
      );
      return res.send({
        success: true,
      });
    } catch (e) {
      return res
        .status(500)
        .send({ success: false, message: "Some error occurred!" });
    }
  }
);
adminRouter.get(
  "/admin/campaign/approve/:id",
  verifyAdminJWT,
  async (req, res) => {
    try {
      const campaignId = req.params.id;
      let foundUnapprovedCampaign = await UnapprovedCampaignModel.findOne({_id:campaignId});
      if(!foundUnapprovedCampaign) {
        return res.send({ success: false, message: "No campaign found!" });
      }
      

      foundUnapprovedCampaign= JSON.parse(JSON.stringify(foundUnapprovedCampaign))
     delete foundUnapprovedCampaign._id
      const newCampaign= new CampaignModel(foundUnapprovedCampaign)
      await UnapprovedCampaignModel.deleteOne({_id:campaignId})
      const savedCampaign= await newCampaign.save() 
      return res.send({
        success: true,
        savedCampaign,
        message:"Campaign approved!!"
      });
    } catch (e) {
      console.log(e)
      return res
        .status(500)
        .send({ success: false, message: "Some error occurred!" });
    }
  }
);
adminRouter.patch("/admin/campaign/unapproved/:campaignId",verifyAdminJWT,async (req,res)=>{
      const {campaignId}= req.params
      console.log(campaignId);
      const data= req.body.updatedCampaignData
        const updatedCampaign= await UnapprovedCampaignModel.findByIdAndUpdate(campaignId,data,{new:true})
      return res.send({success:true,message : "Success!",updatedCampaign})
})

adminRouter.patch("/admin/campaign/:campaignId",verifyAdminJWT,async (req,res)=>{
  const {campaignId}= req.params
  const data= req.body.updatedCampaignData
  const updatedCampaign= await CampaignModel.findByIdAndUpdate(campaignId,data,{new:true})
  return res.send({success:true,message : "Success!",updatedCampaign})
})
module.exports = adminRouter;
