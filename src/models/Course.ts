// models/Course.ts
import client from "@/lib/mongo";
import { ObjectId, Collection } from "mongodb";

// ———————————————
// Types & Interfaces
// ———————————————

export interface ICourse {
  _id?: ObjectId;
  name: string;
  description: string;
  teacher: ObjectId;
  students: ObjectId[];
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// Public view (same as ICourse)
export type Course = ICourse;

// ———————————————
// Module-scope flags for one-time setup
// ———————————————
let isConnected = false;
let isIndexed = false;

/**
 * Connects once and creates indexes once, then returns the `courses` collection.
 */
async function getCoursesCollection(): Promise<Collection<ICourse>> {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  const coll = client.db().collection<ICourse>("courses");
  if (!isIndexed) {
    // index teacher for fast lookup
    await coll.createIndex({ teacher: 1 });
    // index students array for membership queries
    await coll.createIndex({ students: 1 });
    isIndexed = true;
  }
  return coll;
}

// ———————————————
// Validation Helpers
// ———————————————

function validateName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

function validateDescription(desc: string): boolean {
  const trimmed = desc.trim();
  return trimmed.length >= 1 && trimmed.length <= 500;
}

function validateDates(start: Date, end: Date): boolean {
  return end.getTime() > start.getTime();
}

function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ObjectId: ${id}`);
  }
  return new ObjectId(id);
}

// ———————————————
// CourseModel
// ———————————————

class CourseModel {
  /**
   * Create a new course.
   */
  async createCourse(data: {
    name: string;
    description: string;
    teacher: string; // string id
    students?: string[]; // optional array of string ids
    startDate: Date;
    endDate: Date;
  }): Promise<Course> {
    const {
      name,
      description,
      teacher: teacherId,
      students = [],
      startDate,
      endDate,
    } = data;

    if (!validateName(name)) {
      throw new Error("Name must be 1–100 characters");
    }
    if (!validateDescription(description)) {
      throw new Error("Description must be 1–500 characters");
    }
    if (!validateDates(startDate, endDate)) {
      throw new Error("endDate must be after startDate");
    }

    const teacher = toObjectId(teacherId);
    const studentIds = students.map(toObjectId);

    const now = new Date();
    const course: Omit<ICourse, "_id"> = {
      name: name.trim(),
      description: description.trim(),
      teacher,
      students: studentIds,
      startDate,
      endDate,
      createdAt: now,
    };

    const coll = await getCoursesCollection();
    const { insertedId } = await coll.insertOne(course);
    return { ...course, _id: insertedId };
  }

  /**
   * Fetch a course by its ID.
   */
  async getCourseById(id: string): Promise<Course | null> {
    const coll = await getCoursesCollection();
    const course = await coll.findOne({ _id: toObjectId(id) });
    return course;
  }

  /**
   * Update one or more fields on a course.
   */
  async updateCourse(
    id: string,
    update: Partial<
      Pick<ICourse, "name" | "description" | "startDate" | "endDate">
    >
  ): Promise<Course> {
    if (update.name !== undefined && !validateName(update.name)) {
      throw new Error("Name must be 1–100 characters");
    }
    if (
      update.description !== undefined &&
      !validateDescription(update.description)
    ) {
      throw new Error("Description must be 1–500 characters");
    }
    if (
      update.startDate !== undefined &&
      update.endDate !== undefined &&
      !validateDates(update.startDate, update.endDate)
    ) {
      throw new Error("endDate must be after startDate");
    }

    const coll = await getCoursesCollection();
    const result = await coll.updateOne(
      { _id: toObjectId(id) },
      {
        $set: {
          ...update,
          updatedAt: new Date(),
        },
      }
    );
    if (result.matchedCount === 0) {
      throw new Error("Course not found");
    }
    const updated = await this.getCourseById(id);
    if (!updated) throw new Error("Failed to fetch updated course");
    return updated;
  }

  /**
   * Add a student to a course (idempotent).
   */
  async addStudent(courseId: string, studentId: string): Promise<Course> {
    const coll = await getCoursesCollection();
    const result = await coll.updateOne(
      { _id: toObjectId(courseId) },
      { $addToSet: { students: toObjectId(studentId) } }
    );
    if (result.matchedCount === 0) {
      throw new Error("Course not found");
    }
    const updated = await this.getCourseById(courseId);
    if (!updated) throw new Error("Failed to fetch updated course");
    return updated;
  }

  /**
   * Remove a student from a course.
   */
  async removeStudent(courseId: string, studentId: string): Promise<Course> {
    const coll = await getCoursesCollection();
    const result = await coll.updateOne(
      { _id: toObjectId(courseId) },
      { $pull: { students: toObjectId(studentId) } }
    );
    if (result.matchedCount === 0) {
      throw new Error("Course not found");
    }
    const updated = await this.getCourseById(courseId);
    if (!updated) throw new Error("Failed to fetch updated course");
    return updated;
  }
}

const courseModel = new CourseModel();
export default courseModel;
