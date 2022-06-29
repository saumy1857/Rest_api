const express= require("express");
const app= express();
require("./db/conn");
const Student=require("./model/Student");
app.use(express.json());

app.post("/user",(req,res)=>{
    const user=new Student(req.body);
    user.save().then(()=>{
        res.status(201);
        res.send(user);
    }).catch((e)=>{
        res.status(400);
        res.send(e); 
    })
});
app.get("/user/:id",async(req,res) => {
    try{
        const _id =req.params.id;
        const studentData= await Student.findById(_id);
        res.send(studentData);
    }catch(e){
        res.send(e);
    }
})
app.get("/user",async(req,res) => {
    try{
        const studentsData= await Student.find();
        res.send(studentsData);
    }catch(e){
        res.send(e);
    }
})

app.listen(9000,()=>{
 console.log("welcome");
}); 