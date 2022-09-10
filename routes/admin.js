const express = require("express");
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

const adminRouter = express.Router();
require("dotenv").config();

const { ADMIN_PASSWORD, JWT_SECRET } = process.env;

adminRouter.get("/admin/verify", verifyAdminJWT, (req, res) => {
  res.send({ success: true });
});
adminRouter.post("/admin/login", async (req, res) => {
  try {
    const password = req.body.password;
    if (password === ADMIN_PASSWORD) {
      const adminAuthToken = await jwt.sign({}, JWT_SECRET);
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
    const managersList = await CampaignManagerModel.find({});
    const unapprovedCampaigns= await UnapprovedCampaignModel.find({})
    return res.send({ success: true, campaignsList ,managersList,unapprovedCampaigns});
  } catch (e) {
    return res.status(500).send({ success: false });
  }
});
adminRouter.post("/admin/manager/new", verifyAdminJWT, async (req, res) => {
  const {name,email} = req.body
  try {
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
adminRouter.post(
  "/admin/campaign/approve/:id",
  verifyAdminJWT,
  async (req, res) => {
    try {
      console.log(req.body)
      const {platformPoints}= req.body
      const campaignId = req.params.id;
      let UnapprovedCamp = await UnapprovedCampaignModel.findOneAndDelete({_id:campaignId},{new:true});
      

      UnapprovedCamp= JSON.parse(JSON.stringify(UnapprovedCamp))
      let totalPoints=UnapprovedCamp.totalPoints;
      platformPoints.forEach(p=>{
        totalPoints+=parseInt(p.platformPoints)
      })
      UnapprovedCamp.totalPoints = totalPoints
      const updatedTasks= UnapprovedCamp.tasks.map(t=>{
        platPts= parseInt(platformPoints.find(p=>(p.taskId === t._id)).platformPoints) ;
        return {
          ...t,points:parseInt(t.points)+platPts,platformPoints:platPts
        }}
)
UnapprovedCamp.tasks = updatedTasks
      const newCampaign= new CampaignModel(UnapprovedCamp)
      const savedCampaign= await newCampaign.save() 
      return res.send({
        success: true,
        savedCampaign
      });
    } catch (e) {
      console.log(e)
      return res
        .status(500)
        .send({ success: false, message: "Some error occurred!" });
    }
  }
);
module.exports = adminRouter;
