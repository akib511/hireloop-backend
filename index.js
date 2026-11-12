import express from "express";
import "dotenv/config";
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb';


const app = express();
const PORT = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());


const client = new MongoClient(`mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@ac-xbq99wb-shard-00-00.exnfvgb.mongodb.net:27017,ac-xbq99wb-shard-00-01.exnfvgb.mongodb.net:27017,ac-xbq99wb-shard-00-02.exnfvgb.mongodb.net:27017/?ssl=true&replicaSet=atlas-p0qrbv-shard-0&authSource=admin`);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const connectedClient = await connectToMongoDB();

const database = connectedClient.db("hireloop");
const users = database.collection("user") // user er collection

const jobs = database.collection("jobs")//jobs er collection 


app.get("/", (req, res) => {
  res.send("Hello hireloop");
});


app.get('/users', async (req , res)=>{
  const cursor = users.find({});
  const result = await cursor.toArray();
  res.send(result);
})


//jobs related API 

app.get('/jobs', async (req, res) => {
  const query = {};

  if (req.query.type) {
    query.type = req.query.type;
  }

  if (req.query.isRemote) {
    query.isRemote = req.query.isRemote === 'true';
  }

  if (req.query.category){
    query.category = req.query.category;
  }

  if (req.query.company){
     query.company = req.query.company;
  }

  if (req.query.location){
     query.location = req.query.location;
  }

  if (req.query.search) {
    query.$or ={
      type: { $regex: req.query.search, $options: 'i' },
      category: { $regex: req.query.search, $options: 'i' },
      company: { $regex: req.query.search, $options: 'i' },
      location: { $regex: req.query.search, $options: 'i' },
      isRemote: { $regex: req.query.search, $options: 'i'}
    }
  }

  console.log('query', req.query);

  const cursor = jobs.find(query);
  const result = await cursor.toArray();

  res.send(result);
});

app.post('/jobs', async (req , res)=>{
  const job = req.body;
  const result = await jobs.insertOne(job);
  res.send (result)
})

//job delete korar jonno 

app.delete('/jobs/:id', async (req , res )=>{
  const id = req.params.id ;
  const query = {_id: new ObjectId(id)};
  const result = await jobs.deleteOne(query);
  res.send(result)
})

app.listen(PORT, () => {
  console.log(`hireloop is looping on ${PORT}`);
});
