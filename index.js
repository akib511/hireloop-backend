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
const applications = database.collection("applications")//applications er collection


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
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { type: { $regex: req.query.search, $options: 'i' } },
      { category: { $regex: req.query.search, $options: 'i' } },
      { company: { $regex: req.query.search, $options: 'i' } },
      { location: { $regex: req.query.search, $options: 'i' } },
    ]
  }

  console.log('query', req.query);

  const cursor = jobs.find(query);
  const result = await cursor.toArray();

  res.send(result);
});



app.get('/jobs/:id', async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(404).send({
      message: "Job not found"
    });
  }

  const result = await jobs.findOne({
    _id: new ObjectId(id)
  });

  if (!result) {
    return res.status(404).send({
      message: "Job not found"
    });
  }

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


//applications related API

// All applications (optionally filtered: ?userId= for a seeker, ?jobId= for a job post)
app.get('/applications', async (req, res) => {
  const query = {};

  if (req.query.userId) {
    query.userId = req.query.userId;
  }

  if (req.query.jobId) {
    query.jobId = req.query.jobId;
  }

  const cursor = applications.find(query).sort({ appliedAt: -1 });
  const result = await cursor.toArray();
  res.send(result);
});

app.post('/applications', async (req , res)=>{
  const application = req.body;

  if (!application?.jobId || !application?.userId) {
    return res.status(400).send({ message: "jobId and userId are required" });
  }

  // One application per seeker per job
  const existing = await applications.findOne({
    jobId: application.jobId,
    userId: application.userId,
  });

  if (existing) {
    return res.status(409).send({ message: "You have already applied to this job" });
  }

  const doc = {
    ...application,
    status: application.status || "Applied",
    appliedAt: application.appliedAt || new Date().toISOString(),
  };

  const result = await applications.insertOne(doc);
  res.send(result);
})



app.listen(PORT, () => {
  console.log(`hireloop is looping on ${PORT}`);
});
