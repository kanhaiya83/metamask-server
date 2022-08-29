const express = require("express");
// const admin = require("firebase-admin");
const cors = require("cors");
const { recoverPersonalSignature } = require("eth-sig-util");
const Web3 = require("web3");
const { TwitterApi } = require("twitter-api-v2");
const jwt = require("jsonwebtoken");
// require("./utils/twitter")
// const serviceAccount = require("./serviceAccountKey.json");
const { UserModel } = require("./config/database");
const verifyJWT = require("./middlewares/verifyJWT");
const router = require("./routes/twitter");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

const app = express();
const port =process.env.PORT ||  4000;

app.use(cors());

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

    // Delete messageToSign as it is for 1 time use only
    // admin.firestore().collection("users").doc(address).set(
    //   {
    //     messageToSign: null,
    //   },
    //   {
    //     merge: true,
    //   }
    // );

    return res.send({ authToken, error: null });
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
  const data=await UserModel.find({})
  res.send(JSON.parse(JSON.stringify(data)).map(d=>{
    return{address: d.address}
  }
    ))
})
app.get("/alll",async(req,res)=>{
  const data=await UserModel.find({})
res.send(data)  
})
app.delete("/all",async(req,res)=>{
  const data=await UserModel.deleteMany({})
 
})
app.get("/verifyuser",verifyJWT,(req,res)=>{
  if(req.address){
    return res.send({success:true,isAuthenticated:true})
  }
  return res.send({success:true,isAuthenticated:false})

})


app.use(router)
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});