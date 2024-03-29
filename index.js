const express = require("express");
// const admin = require("firebase-admin");
const cors = require("cors");
const { recoverPersonalSignature } = require("eth-sig-util");
const Web3 = require("web3");
const jwt = require("jsonwebtoken");
// require("./utils/twitter")
// const serviceAccount = require("./serviceAccountKey.json");
const { UserModel, CampaignModel,JoinedCampaignsModel, UnapprovedCampaignModel, CampaignManagerModel } = require("./config/database");
const verifyJWT = require("./middlewares/verifyJWT");
const twitterRouter = require("./routes/twitter");
const {router:telegramRouter} = require("./routes/telegram");
const discordRouter = require("./routes/discord");
const campaignRouter = require("./routes/campaignRouter");
const taskRouter = require("./routes/taskRouter");
const adminRouter = require("./routes/admin");
const managerRouter = require("./routes/managerRouter");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

const app = express();  

app.use(express.json());
const port =process.env.PORT ||  4000;
const corsOptions = {
  origin: '*'
}
app.use(cors(corsOptions))

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    next();
});

const isValidEthAddress = (address) => Web3.utils.isAddress(address);

const makeId = (length) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

const getMessageToSign = async (req, res) => {
  try {
    const { address } = req.query;

    if (!isValidEthAddress(address)) {
      return res.send({ error: "invalid_address" });
    }

    const randomString = makeId(20);
    let messageToSign = `Wallet address: ${address} Nonce: ${randomString}`;

    // const user = await admin.firestore().collection("users").doc(address).get();
    const user = await UserModel.findOne({address})

console.log({user});
    if (user && user.messageToSign) {

      // messageToSign already exists for that particular wallet address
      messageToSign = user.messageToSign;
    } else {
    //   admin.firestore().collection("users").doc(address).set(
    //     {
    //       messageToSign,
    //     },
    //     {
    //       merge: true,
    //     }
    //   );
    if(user){
      await UserModel.updateOne({address},{messageToSign})
    }
    else{const savedUser=await UserModel({address,messageToSign}).save()}
    }
    return res.send({ messageToSign, error: null });
  } catch (error) {
    console.log(error);
    return res.send({ error: "server_error" });
  }
};

const isValidSignature = (address, signature, messageToSign) => {
  if (!address || typeof address !== "string" || !signature || !messageToSign) {
    return false;
  }

  const signingAddress = recoverPersonalSignature({
    data: messageToSign,
    sig: signature,
  });

  if (!signingAddress || typeof signingAddress !== "string") {
    return false;
  }
console.log({signingAddress,address});
  return signingAddress.toLowerCase() === address.toLowerCase();
};

const getJWT = async (req, res) => {
  try {
    const { address, signature } = req.query;

    if (!isValidEthAddress(address) || !signature) {
      return res.send({ error: "invalid_parameters" });
    }

    // const [customToken, doc] = await Promise.all([
    //   admin.auth().createCustomToken(address),
    //   admin.firestore().collection("users").doc(address).get(),
    // ]);
    const jwtPayload = {address};
    const authToken = await jwt.sign(jwtPayload, process.env.JWT_SECRET);

    // if (!doc.exists) {
    //   return res.send({ error: "invalid_message_to_sign" });
    // }
    const user=await UserModel.findOne({address})
    if(!user){
      return res.send("User not found")
    }
    messageToSign=user.messageToSign

    // const { messageToSign } = doc.data();

    if (!messageToSign) {
      return res.send({ error: "invalid_message_to_sign" });
    }

    const validSignature = isValidSignature(address, signature, messageToSign);

    if (!validSignature) {
      return res.send({ error: "invalid_signature" });
    }
    await UserModel.updateOne({address},{messageToSign:null})

    
      const twitter= (user?.auth?.twitter?.isConnected === true) ? true :false
      const discord= (user?.auth?.discord?.isConnected === true) ? true :false
      const telegram= (user?.auth?.telegram?.isConnected === true) ? true :false
  
      const connectedProfiles={twitter,discord,telegram};
      const userData={name:user.name,bio:user.bio}
      const completedTasks=user.completedTasks || []
      const joinedCampaigns=await JoinedCampaignsModel.find({address:req.address})
      return res.send({authToken,success:true,isAuthenticated:true,connectedProfiles,userData,completedTasks,joinedCampaigns})    

  } catch (error) {
    console.log(error);
    return res.send({ error: "server_error" });
  }
};

app.get("/jwt", getJWT);
app.get("/message", getMessageToSign);
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.get("/all",async(req,res)=>{
  const managers= await CampaignManagerModel.find({})

  const data=await UserModel.find({})
  const campaigns= await CampaignModel.find({})
  const joinedCampaigns= await JoinedCampaignsModel.find({})
  const ucamp= await UnapprovedCampaignModel.find({})
res.send({ managers,data,campaigns,joinedCampaigns,ucamp})  
})
app.delete("/all",async(req,res)=>{
  const data=await UserModel.deleteMany({})
 
})
app.get("/verifyuser",verifyJWT,async(req,res)=>{
  if(req.address){
    const foundUser= await UserModel.findOne({address:req.address})
    if(!foundUser) return res.status(404).send({success:false,message:"User not found!"})
    const twitter= (foundUser?.auth?.twitter?.isConnected === true) ? true :false
    const discord= (foundUser?.auth?.discord?.isConnected === true) ? true :false
    const telegram= (foundUser?.auth?.telegram?.isConnected === true) ? true :false

    const connectedProfiles={twitter,discord,telegram};
    const userData={name:foundUser.name,bio:foundUser.bio}
    const completedTasks=foundUser.completedTasks || []
    const joinedCampaigns=await JoinedCampaignsModel.find({address:req.address})
    return res.send({success:true,isAuthenticated:true,connectedProfiles,userData,completedTasks,joinedCampaigns})
  }
  return res.send({success:false})

})
app.get("/userdata",verifyJWT,async (req,res)=>{
  if(req.address){
    const user= await UserModel.findOne({address:req.address})
    return res.send({success:true,userData:{name:user.name,bio:user.bio}})
  }
  return res.send({success:false,isAuthenticated:false})
})

app.post("/userdata",verifyJWT,async (req,res)=>{
  console.log(req.body)
  try{
  const {name,bio} = req.body;
  if(!name) return res.status(401).send({success:false})
  const user =await  UserModel.findOneAndUpdate({address:req.address},{name,bio},{new:true})
  return res.send({success:true,userData:{name:user.name, bio : user.bio}})
  }
  catch(e){
    console.log(e);
    res.status(500).send({success:false})}
  }
)

app.use(twitterRouter)
app.use(telegramRouter)
app.use(discordRouter)
app.use(campaignRouter)
app.use(taskRouter)
app.use(adminRouter)
app.use(managerRouter)
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});