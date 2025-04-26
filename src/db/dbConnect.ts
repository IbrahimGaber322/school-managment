import mongoose from "mongoose";

async function dbConnect() {
  const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb+srv://School:khT2ZNRVBSi0MeVq@ibrahimdb.pzy8ygi.mongodb.net/";
  console.log("MONGO_URI", MONGO_URI);
  try {
    if (!MONGO_URI) {
      throw new Error("Please define the MONGODB_URI environment variable");
    }
    await mongoose.connect(MONGO_URI, { dbName: "school" });
    console.log("successfully connected to MongoDB");
  } catch (error) {
    console.log(error);
  }
}

export default dbConnect;
