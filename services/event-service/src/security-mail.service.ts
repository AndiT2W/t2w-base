import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

type SecurityMessage = {
  userId?: string;
  recipient: string;
  kind: string;
  subject: string;
  body: string;
};

@Injectable()
export class SecurityMailService {
  constructor(private readonly prisma: PrismaService) {}

  async send(message: SecurityMessage) {
    const notification = await this.prisma.securityNotification.create({
      data: { ...message, deliveryStatus: "PENDING" },
    });
    const sender = process.env.SECURITY_MAIL_SENDER ?? process.env.OUTLOOK_MAILBOX;
    if (!sender) {
      return this.prisma.securityNotification.update({
        where: { id: notification.id },
        data: { deliveryStatus: "SKIPPED", lastError: "SECURITY_MAIL_SENDER_MISSING" },
      });
    }
    try {
      const token = await this.accessToken();
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: {
              subject: message.subject,
              body: { contentType: "Text", content: message.body },
              toRecipients: [{ emailAddress: { address: message.recipient } }],
            },
            saveToSentItems: true,
          }),
        },
      );
      if (!response.ok) throw new Error(`OUTLOOK_GRAPH_${response.status}`);
      return this.prisma.securityNotification.update({
        where: { id: notification.id },
        data: { deliveryStatus: "DELIVERED", deliveredAt: new Date() },
      });
    } catch (error) {
      return this.prisma.securityNotification.update({
        where: { id: notification.id },
        data: {
          deliveryStatus: "FAILED",
          lastError: error instanceof Error ? error.message : "SECURITY_MAIL_FAILED",
        },
      });
    }
  }

  private async accessToken() {
    if (process.env.OUTLOOK_GRAPH_ACCESS_TOKEN) return process.env.OUTLOOK_GRAPH_ACCESS_TOKEN;
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
    if (!response.ok) throw new Error("OUTLOOK_GRAPH_TOKEN_REQUEST_FAILED");
    const body = (await response.json()) as { access_token?: string };
    if (!body.access_token) throw new Error("OUTLOOK_GRAPH_TOKEN_MISSING");
    return body.access_token;
  }
}
