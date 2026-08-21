import { Injectable } from "@nestjs/common";
import type { OutlookFolder, OutlookGraphClient } from "./outlook.types.js";

@Injectable()
export class MicrosoftGraphClient implements OutlookGraphClient {
  private readonly baseUrl = "https://graph.microsoft.com/v1.0";

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const token = process.env.OUTLOOK_GRAPH_ACCESS_TOKEN;
    if (!token) throw new Error("OUTLOOK_GRAPH_ACCESS_TOKEN is not configured");
    const response = await fetch(`${this.baseUrl}${url}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers } });
    if (!response.ok) throw new Error(`OUTLOOK_GRAPH_${response.status}`);
    return response.json() as Promise<T>;
  }

  async listChildFolders(mailbox: string, parentId: string): Promise<OutlookFolder[]> {
    const result = await this.request<{ value: OutlookFolder[] }>(`/users/${encodeURIComponent(mailbox)}/mailFolders/${encodeURIComponent(parentId)}/childFolders`);
    return result.value;
  }

  async createChildFolder(mailbox: string, parentId: string, displayName: string): Promise<OutlookFolder> {
    return this.request<OutlookFolder>(`/users/${encodeURIComponent(mailbox)}/mailFolders/${encodeURIComponent(parentId)}/childFolders`, { method: "POST", body: JSON.stringify({ displayName }) });
  }
}
