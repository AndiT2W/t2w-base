import { Injectable } from "@nestjs/common";
import {
  OutlookGraphError,
  type OutlookFolder,
  type OutlookGraphClient,
  type OutlookMessage,
} from "./outlook.types.js";

@Injectable()
export class MicrosoftGraphClient implements OutlookGraphClient {
  private readonly baseUrl = "https://graph.microsoft.com/v1.0";
  private readonly messageFields =
    "id,conversationId,subject,bodyPreview,receivedDateTime,sentDateTime,from,toRecipients,hasAttachments,webLink";

  private async accessToken(): Promise<string> {
    const directToken = process.env.OUTLOOK_GRAPH_ACCESS_TOKEN;
    if (directToken) return directToken;
    const tenant = process.env.OUTLOOK_TENANT_ID;
    const clientId = process.env.OUTLOOK_CLIENT_ID;
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    if (!tenant || !clientId || !clientSecret) throw new Error("OUTLOOK_GRAPH_CREDENTIALS_MISSING");
    const response = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      },
    );
    if (!response.ok)
      throw new OutlookGraphError(
        response.status,
        "OUTLOOK_GRAPH_TOKEN_REQUEST_FAILED",
        response.headers.get("retry-after") ?? undefined,
      );
    const body = (await response.json()) as { access_token?: string };
    if (!body.access_token) throw new Error("OUTLOOK_GRAPH_TOKEN_MISSING");
    return body.access_token;
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const token = await this.accessToken();
    const response = await fetch(url.startsWith("http") ? url : `${this.baseUrl}${url}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    if (!response.ok)
      throw new OutlookGraphError(
        response.status,
        `OUTLOOK_GRAPH_${response.status}`,
        response.headers.get("retry-after") ?? undefined,
      );
    return response.json() as Promise<T>;
  }

  async listChildFolders(mailbox: string, parentId: string): Promise<OutlookFolder[]> {
    const folders: OutlookFolder[] = [];
    let next: string | undefined =
      `/users/${encodeURIComponent(mailbox)}/mailFolders/${encodeURIComponent(parentId)}/childFolders?$top=1000`;
    while (next) {
      const result: { value: OutlookFolder[]; "@odata.nextLink"?: string } = await this.request<{
        value: OutlookFolder[];
        "@odata.nextLink"?: string;
      }>(next);
      folders.push(...result.value);
      next = result["@odata.nextLink"];
    }
    return folders;
  }

  async createChildFolder(
    mailbox: string,
    parentId: string,
    displayName: string,
  ): Promise<OutlookFolder> {
    return this.request<OutlookFolder>(
      `/users/${encodeURIComponent(mailbox)}/mailFolders/${encodeURIComponent(parentId)}/childFolders`,
      { method: "POST", body: JSON.stringify({ displayName }) },
    );
  }

  async listMessages(mailbox: string, folderId: string): Promise<OutlookMessage[]> {
    const messages: OutlookMessage[] = [];
    let next: string | undefined =
      `/users/${encodeURIComponent(mailbox)}/mailFolders/${encodeURIComponent(folderId)}/messages?$select=${this.messageFields}&$top=100`;
    while (next) {
      const result: { value: OutlookMessage[]; "@odata.nextLink"?: string } =
        await this.request(next);
      messages.push(...result.value);
      next = result["@odata.nextLink"];
    }
    return messages;
  }

  async listMessagesByConversationIds(
    mailbox: string,
    folderId: string,
    conversationIds: string[],
  ): Promise<OutlookMessage[]> {
    const messages: OutlookMessage[] = [];
    for (const conversationId of [...new Set(conversationIds.filter(Boolean))]) {
      const filter = `conversationId eq '${conversationId.replaceAll("'", "''")}'`;
      let next: string | undefined =
        `/users/${encodeURIComponent(mailbox)}/mailFolders/${encodeURIComponent(folderId)}/messages?$select=${this.messageFields}&$filter=${encodeURIComponent(filter)}&$top=100`;
      while (next) {
        const result: { value: OutlookMessage[]; "@odata.nextLink"?: string } =
          await this.request(next);
        messages.push(...result.value);
        next = result["@odata.nextLink"];
      }
    }
    return messages;
  }

  async moveMessage(
    mailbox: string,
    messageId: string,
    destinationFolderId: string,
  ): Promise<OutlookMessage> {
    return this.request<OutlookMessage>(
      `/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(messageId)}/move`,
      { method: "POST", body: JSON.stringify({ destinationId: destinationFolderId }) },
    );
  }
}
