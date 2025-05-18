import mongoose from "mongoose";

const connect2db = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log(`Database connection established successfully`);
  } catch (error) {
    console.log(error);
  }
};

export default connect2db;
