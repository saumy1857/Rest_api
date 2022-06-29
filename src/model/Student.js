const mongoose=require("mongoose");
const StudentSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        minlength:4
        },
        email:{
            type:String,
            reuired:true
        }
    
});
const Student=new mongoose.model('Student',StudentSchema);
module.exports=Student;