import mongoose from "mongoose";
import { Document, Model, model, Schema } from "mongoose";

type User = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  subRole: "teacher" | "student";
};

const userSchema = new Schema<User & Document>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    subRole: {
      type: String,
      enum: ["teacher", "student"],
      default: "student",
      validate: {
        validator: function (value: string) {
          if (this.role === "admin" && value !== undefined) {
            return false;
          }
          if (this.role === "user" && !["teacher", "student"].includes(value)) {
            return false;
          }
          return true;
        },
        message: "Invalid subRole for the given role",
      },
    },
  },
  { timestamps: true }
);

const UserModel: Model<User & Document> =
  mongoose.models.User || model("User", userSchema);

export default UserModel;
export { userSchema };
export type { User };
