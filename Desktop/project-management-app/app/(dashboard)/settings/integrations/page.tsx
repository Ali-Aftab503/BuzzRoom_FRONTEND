"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";

export default function IntegrationsPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    async function fetchIntegrations() {
      try {
        const response = await fetch("/api/integrations");
        if (response.ok) {
          const data = await response.json();
          setIntegrations(data);
        }
      } catch (error) {
        console.error("Error fetching integrations:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchIntegrations();
  }, [userId, isLoaded, router]);

  const handleConnect = async (type: string) => {
    if (type === "slack") {
      const webhookUrl = prompt(
        "Enter your Slack Webhook URL:\n\n" +
        "To get one:\n" +
        "1. Go to https://api.slack.com/apps\n" +
        "2. Create/select your app\n" +
        "3. Go to 'Incoming Webhooks'\n" +
        "4. Copy the webhook URL"
      );

      if (webhookUrl && webhookUrl.startsWith("https://hooks.slack.com")) {
        try {
          const response = await fetch("/api/integrations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "slack",
              accessToken: webhookUrl,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setIntegrations([...integrations, data]);
            alert("Slack connected successfully! You'll now receive notifications.");
          } else {
            throw new Error("Failed to connect");
          }
        } catch (error) {
          alert("Failed to connect Slack");
        }
      } else if (webhookUrl) {
        alert("Invalid Slack webhook URL");
      }
    } else if (type === "google_drive") {
      alert(
        "Google Drive Integration:\n\n" +
        "This requires OAuth setup in Google Cloud Console.\n\n" +
        "For now, you can upload files directly using the 'Attachments' feature in cards."
      );
    } else if (type === "jira") {
      alert(
        "Jira Integration:\n\n" +
        "This requires API tokens from Atlassian.\n\n" +
        "Coming in a future update!"
      );
    }
  };

  const handleDisconnect = async (type: string) => {
    if (!confirm(`Disconnect ${type}?`)) return;
    
    try {
      const integration = integrations.find((i) => i.type === type);
      if (integration) {
        await fetch(`/api/integrations/${integration.id}`, {
          method: "DELETE",
        });
        setIntegrations(integrations.filter((i) => i.type !== type));
        alert(`${type} disconnected successfully!`);
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      alert("Failed to disconnect");
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const googleDrive = integrations.find((i) => i.type === "google_drive");
  const slack = integrations.find((i) => i.type === "slack");
  const jira = integrations.find((i) => i.type === "jira");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect TaskFlow with your favorite tools
        </p>
      </div>

      <div className="space-y-6">
        <IntegrationCard
          title="Google Drive"
          description="Attach files from Google Drive to your cards"
          icon="drive"
          connected={!!googleDrive}
          onConnect={() => handleConnect("google_drive")}
          onDisconnect={() => handleDisconnect("google_drive")}
        />

        <IntegrationCard
          title="Slack"
          description="Send notifications to Slack channels"
          icon="slack"
          connected={!!slack}
          onConnect={() => handleConnect("slack")}
          onDisconnect={() => handleDisconnect("slack")}
        />

        <IntegrationCard
          title="Jira"
          description="Sync issues between TaskFlow and Jira"
          icon="jira"
          connected={!!jira}
          onConnect={() => handleConnect("jira")}
          onDisconnect={() => handleDisconnect("jira")}
        />
      </div>
    </div>
  );
}