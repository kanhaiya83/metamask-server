const jwt=require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET;

//verifies the jwt and add the user
const verifyJWT=(req,res,next)=>{
    const receivedToken=req.header("auth-token")
    console.log({receivedToken})
    if(!receivedToken){
        return res.status(401).json({error:"Please provide a valid authToken",message:"Please provide a valid authToken",success:false,invalidAuthToken:true})
    }
    try{
        const data=jwt.verify( receivedToken,JWT_SECRET)
        console.log({data});
         req.address=data.address
         next()
    }
    catch(e){
        res.status(500).send({error:e,message:"Some error occurred!!",success:false,invalidAuthToken:true})
    }
}

module.exports=verifyJWT