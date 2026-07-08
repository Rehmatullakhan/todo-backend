import express from "express";
import { collectionName, connection } from "./dbconfig.js";
import cors from "cors";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json());
app.use(cors({
origin:['https://todo-frontend-eight-mu.vercel.app','https://localhost:5173'],
credentials:true
}));
app.use(cookieParser());


// function verifyJWTToken(req,resp,next){
// const token= req.cookies('token',token,{
// httpOnly:true,
// sameSite:'none',
// secure:true,
// maxAge:7*24*60*60*1000
// });
// if(!token){
//   return resp.status(401).send({message:"No token",success:false})
// }
// jwt.verify(token,'Google', (error, decoded)=>{
//   if(error){
//     resp.send({
//       message: 'invalid token',
//       success:false
//     })
//   }
//   console.log("decoded" ,decoded);
//   req.userData=decoded;
//   next();
// })
// }

const verifyJWTToken=(req,resp,next)=>{
  console.log(req);
  const token = req.cookies.token;
  if(!token){
    return resp.status(401).send({message:"Unauthorized"})
  }
  try {
    const decoded= jwt.verify(token,process.env.JWT_SECRET);
    req.user=decoded;
    next();
  } catch (error) {
    return resp.status(401).send({message:"Invalid Token"})
  }
}
export default verifyJWTToken;

app.post("/add",verifyJWTToken, async (req, resp) => {
  const db = await connection();
  const collection = await db.collection(collectionName);
  const result = await collection.insertOne(req.body);
  if (result) {
    resp.send({ message: "new task added", success: true, result });
  } else {
    resp.send({ message: "no task added", success: false });
  }
});

app.get("/tasks",verifyJWTToken, async (req, resp) => {
  const db = await connection();
 // console.log("cookies test", req.cookies['token']);
  const collection = await db.collection(collectionName);
  const result = await collection.find().toArray();
  if (result) {
    resp.send({ message: "task fetch successfully", success: true, result });
  } else {
    resp.send({ message: "task not fetched", success: false });
  } 
});



app.delete("/delete/:id",verifyJWTToken, async (req, resp) => {
  const db = await connection();
  const id = req.params.id;
  const collection = await db.collection(collectionName);
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  if (result) {
    resp.send({ message: "task deleted successfully", success: true, result });
  } else {
    resp.send({ message: "task not deleted", success: false });
  }
});

app.delete("/delete-all",verifyJWTToken, async (req, resp) => {
  console.log("body recieved", req.body);
  console.log("ids recieved", req.body.ids);
  const db = await connection();
  const { ids } = req.body;
  const collection = await db.collection(collectionName);
  const objectIds = ids.map((id) => new ObjectId(id));
  const result = await collection.deleteMany({ _id: { $in: objectIds } });
  if (result) {
    resp.send({ message: "task deleted successfully", success: true, result });
  } else {
    resp.send({ message: "task not deleted", success: false });
  }
});

app.get("/task/:id",verifyJWTToken, async (req, resp) => {
  const db = await connection();
  const id = req.params.id;
  const collection = await db.collection(collectionName);
  const result = await collection.findOne({ _id: new ObjectId(id) });
  console.log("searching id", id);
  console.log("result is", result);
  if (result) {
    resp.send({ message: "task fetch successfully", success: true, result });
  } else {
    resp.send({ message: "task not fetched", success: false });
  }
});

app.put("/update-task",verifyJWTToken, async (req, resp) => {
  const db = await connection();
  const collection = await db.collection(collectionName);
  const { _id, ...fields } = req.body;
  const update = { $set: fields };
  console.log(fields);

  const result = await collection.updateOne({ _id: new ObjectId(_id) }, update);
  if (result) {
    resp.send({ message: "task updated successfully", success: true, result });
  } else {
    resp.send({ message: "task not updated", success: false });
  }
});

app.post("/signup", async (req, resp) => {
  const userData = req.body;
  if (userData.email && userData.password) {
    const db = await connection();
    const collection = await db.collection("users");
    const result = await collection.insertOne(userData);
    if (result) {
      jwt.sign(userData, "Google", { expiresIn: "5d" }, (error, token) => {
        resp.send({
          success: true,
          message: "signup done",
          token,
        });
      });
    } 
  }else {
      resp.send({
        success: false,
        message: "signup error",
      });
    }

  console.log(userData);
});

// app.post("/login", async (req, resp) => {
//   const userData = req.body;
//   console.log(userData);
//   if (userData.email && userData.password) {
//     const db = await connection();
//     const collection = await db.collection("users");
//     const result = await collection.findOne({email:userData.email,password:userData.password});
//     if (result) {
//       jwt.sign(userData, "Google", { expiresIn: "5d" }, (error, token) => {
//         resp.send({
//           success: true,
//           message: "login done",
//           token,
//         });
//       });
//     } else {
//       resp.send({
//         success: false,
//         message: "user not found",
//       });
//     }
//   }else{
//      resp.send({
//         success: false,
//         message: "login not done",
//       });
//   }


// });

app.post("/login", async (req, resp) => {
    const userData = req.body;
    console.log(userData);
    if (userData.email && userData.password) {
        const db = await connection();
        const collection = await db.collection("users");
        const result = await collection.findOne({email:userData.email,password:userData.password});
        
        if (result) {
            jwt.sign({id: result._id}, "Google", { expiresIn: "5d" }, (error, token) => { // <-- yahan result._id bhejo, pura userData nahi
                if(error){
                    return resp.send({success: false, message: "Token error"})
                }

                // YE 4 LINE YAHAN ADD KARO - resp.send se pehle
                resp.cookie('token', token, {
                    httpOnly: true,
                    sameSite: 'none', // Vercel -> Railway ke liye
                    secure: true, // https hai
                    maxAge: 5*24*60*60*1000 // 5 din = expiresIn se match
                });

                resp.send({
                    success: true,
                    message: "login done",
                    // token yahan se hata do, cookie me ja raha hai
                });
            });
        } else {
            resp.send({
                success: false,
                message: "user not found",
            });
        }
    }else{
        resp.send({
            success: false,
            message: "login not done",
        });
    }
});


app.listen(3200);
