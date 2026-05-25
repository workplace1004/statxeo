import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStateTransition {
  stage: string;
  status: string;
  transitionedAt: Date;
  errorMessage?: string;
}

export interface ISnapshot {
  version: number;
  createdAt: Date;
  createdBy: string;
  payload: Record<string, any>;
}

export interface IAuditLog {
  timestamp: Date;
  actor: "system" | "user" | "ai";
  action: string;
  description: string;
  meta?: Record<string, any>;
}

export interface IWorkflowExecution extends Document {
  projectId?: string; // Optional UUID from Supabase projects
  campaignId?: string; // Optional MongoDB Campaign reference
  whiteLabelerId: string; // UUID from Supabase WL
  workflowType: "ad_campaign" | "seo_generation" | "site_generation" | "social_schedule";
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  stage: string;
  history: IStateTransition[];
  snapshots: ISnapshot[];
  auditLogs: IAuditLog[];
  createdAt: Date;
  updatedAt: Date;
}

const StateTransitionSchema = new Schema<IStateTransition>({
  stage: { type: String, required: true },
  status: { type: String, required: true },
  transitionedAt: { type: Date, default: Date.now },
  errorMessage: { type: String },
});

const SnapshotSchema = new Schema<ISnapshot>({
  version: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, default: {} },
});

const AuditLogSchema = new Schema<IAuditLog>({
  timestamp: { type: Date, default: Date.now },
  actor: { type: String, enum: ["system", "user", "ai"], required: true },
  action: { type: String, required: true },
  description: { type: String, required: true },
  meta: { type: Schema.Types.Mixed },
});

const WorkflowExecutionSchema = new Schema<IWorkflowExecution>(
  {
    projectId: { type: String, index: true },
    campaignId: { type: String, index: true },
    whiteLabelerId: { type: String, required: true, index: true },
    workflowType: {
      type: String,
      enum: ["ad_campaign", "seo_generation", "site_generation", "social_schedule"],
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "cancelled"],
      default: "queued",
    },
    stage: { type: String, required: true },
    history: [StateTransitionSchema],
    snapshots: [SnapshotSchema],
    auditLogs: [AuditLogSchema],
  },
  {
    timestamps: true,
  }
);

// Prevent compiling model multiple times during Next.js Hot Reloads
const WorkflowExecution: Model<IWorkflowExecution> =
  mongoose.models.WorkflowExecution ||
  mongoose.model<IWorkflowExecution>("WorkflowExecution", WorkflowExecutionSchema);

export default WorkflowExecution;
