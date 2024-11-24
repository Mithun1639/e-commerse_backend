const mongoose=require("mongoose");

const urlc=process.env.DATABASE;

mongoose.connect(urlc).then(()=>{
    console.log("database connected");
}).catch((error)=>{
    console.log(error)
})

module.exports=mongoose
