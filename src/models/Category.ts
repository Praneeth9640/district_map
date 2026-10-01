import { Schema, models, model, type Model, type Types } from "mongoose";
import { ENTITY_STATUSES, type EntityStatus } from "@/models/District";

export interface CategoryDocument {
  _id: Types.ObjectId;
  name: string;
  description: string | null;
  status: EntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ENTITY_STATUSES,
      default: "ACTIVE",
    },
  },
  { timestamps: true },
);

CategorySchema.index({ status: 1 });

export const Category: Model<CategoryDocument> =
  (models.Category as Model<CategoryDocument>) ||
  model<CategoryDocument>("Category", CategorySchema);
