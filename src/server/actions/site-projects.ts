"use server";

import {revalidatePath} from "next/cache";

import {resolveSessionContext} from "../site-projects/auth";
import {createRequestId} from "../site-projects/http";
import * as service from "../site-projects/service";

import type {ActionResult} from "./customers";

export async function submitIntake(
  projectId: string,
  data: Record<string, unknown>,
): Promise<ActionResult<{status: string; intakeVersion: number}>> {
  try {
    const ctx = await resolveSessionContext(createRequestId());
    const result = await service.saveIntake(ctx, projectId, data);
    revalidatePath("/customer/website");
    revalidatePath("/customer/website/setup");
    return {ok: true, data: {status: result.project.status, intakeVersion: result.project.intakeVersion}};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save intake";
    return {ok: false, error: message};
  }
}

export async function triggerGeneration(
  projectId: string,
): Promise<ActionResult<{jobId: string}>> {
  try {
    const ctx = await resolveSessionContext(createRequestId());
    const result = await service.triggerGeneration(ctx, projectId);
    revalidatePath("/customer/website");
    revalidatePath("/customer/website/assets");
    return {ok: true, data: {jobId: result.job.id}};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to trigger generation";
    return {ok: false, error: message};
  }
}

export async function approvePreview(
  projectId: string,
): Promise<ActionResult<{jobId: string}>> {
  try {
    const ctx = await resolveSessionContext(createRequestId());
    const result = await service.approvePreview(ctx, projectId);
    revalidatePath("/customer/website");
    revalidatePath("/customer/website/preview");
    return {ok: true, data: {jobId: result.job.id}};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to approve preview";
    return {ok: false, error: message};
  }
}

export async function submitChangeRequest(
  projectId: string,
  data: {scopeType: string; pageKey?: string; sectionKey?: string; description: string},
): Promise<ActionResult<{id: string}>> {
  try {
    const ctx = await resolveSessionContext(createRequestId());
    const result = await service.createChangeRequest(ctx, projectId, data);
    revalidatePath("/customer/website");
    revalidatePath("/customer/website/preview");
    return {ok: true, data: {id: result.changeRequest.id}};
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit change request";
    return {ok: false, error: message};
  }
}
