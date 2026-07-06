import { MongoClient } from "mongodb";

const url1 ="mongodb+srv://rehmatullahkhan37_db_user:guruguru@cluster0.mhdz7ht.mongodb.net/?appName=Cluster0"
const url="mongodb+srv://rehmatullahkhan37_db_user:<db_password>@cluster0.mhdz7ht.mongodb.net/?appName=Cluster0";
const dbName="nodejs";
export const collectionName="todo";
const client = new MongoClient(url1)
export const connection=async ()=>{
    const connect =await client.connect();
    return await connect.db(dbName)
}
