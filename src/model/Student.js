const mongoose=require("mongoose");
const StudentSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        },
        email:{
            type:String,
            reuired:true
        }
    
});
const Student=new mongoose.model('Student',StudentSchema);
module.exports=Student;
