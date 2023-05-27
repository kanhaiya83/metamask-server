const jwt=require("jsonwebtoken")
const JWT_SECRET = process.env.MANAGER_JWT_SECRET;

//verifies the jwt and add the user
const verifyManagerJWT=(req,res,next)=>{
    const receivedToken=req.header("manager-auth-token")
    if(!receivedToken){
        return res.status(401).json({error:"Please provide a valid authToken",message:"Please provide a valid authToken",success:false,invalidAuthToken:true})
    }
    try{
        const data=jwt.verify( receivedToken,JWT_SECRET)
        req.email=data.email
        next()
    }
    catch(e){
        res.status(401).send({error:e,message:"Unauthorized Request!",success:false,invalidAuthToken:true})
    }
}

module.exports=verifyManagerJWT