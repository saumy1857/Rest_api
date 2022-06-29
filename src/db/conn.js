const mongoose=require("mongoose");
mongoose.connect("mongodb://localhost:27017/students_api").then(()=>{
    console.log("conn is secured")
}).catch((e)=>{
    console.log(e);
});
