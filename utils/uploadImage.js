const cloudinary=require("cloudinary")

cloudinary.config({ 
    cloud_name: 'dbgfrdoan', 
    api_key: '655391926822345', 
    api_secret: 'SRgSkUFcCFoyTW07kAl6x2LoLuk' 
  });


  const uploadImage=(url,public_id)=>{

  return cloudinary.v2.uploader.upload(url,
  { public_id: Math.floor(Math.random()*99999).toString() });
  
  }

  module.exports = {uploadImage}