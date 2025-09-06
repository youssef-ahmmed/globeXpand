import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "research_documents", timestamps: true })
export class ResearchDocument extends Document {
  @Prop({ required: true, type: Number })
  projectId: number;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ResearchDocumentSchema =
  SchemaFactory.createForClass(ResearchDocument);

// Text index for full-text search
ResearchDocumentSchema.index(
  {
    title: "text",
    content: "text",
    tags: "text",
  },
  {
    name: "text_search_index",
  },
);

// Compound index for project-based queries
ResearchDocumentSchema.index(
  {
    projectId: 1,
    createdAt: -1,
  },
  {
    name: "project_date_index",
  },
);

// Index for tag-based filtering
ResearchDocumentSchema.index(
  {
    tags: 1,
  },
  {
    name: "tags_index",
  },
);
