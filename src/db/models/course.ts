import mongoose from "mongoose";
import { Document, Model, model, Schema } from "mongoose";

type Course = {
  name: string;
  description: string;
  teacher: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate: Date;
};

const courseSchema = new Schema<Course & Document>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const CourseModel: Model<Course & Document> =
  mongoose.models.Course || model("Course", courseSchema);

export default CourseModel;
export { courseSchema };
export type { Course };
