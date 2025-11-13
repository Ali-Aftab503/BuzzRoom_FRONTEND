import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";

export default async function IntegrationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const integrations = await prisma.integration.findMany({
    where: { userId },
  });

  const googleDrive = integrations.find((i) => i.type === "google_drive");
  const slack = integrations.find((i) => i.type === "slack");
  const jira = integrations.find((i) => i.type === "jira");

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Integrations</h1>

      <div className="space-y-6">
        <IntegrationCard
          title="Google Drive"
          description="Attach files from Google Drive to your cards"
          icon="drive"
          connected={!!googleDrive}
          onConnect={() => {
            // Handle connection
          }}
          onDisconnect={() => {
            // Handle disconnection
          }}
        />

        <IntegrationCard
          title="Slack"
          description="Send notifications to Slack channels"
          icon="slack"
          connected={!!slack}
          onConnect={() => {
            // Handle connection
          }}
          onDisconnect={() => {
            // Handle disconnection
          }}
        />

        <IntegrationCard
          title="Jira"
          description="Sync issues between TaskFlow and Jira"
          icon="jira"
          connected={!!jira}
          onConnect={() => {
            // Handle connection
          }}
          onDisconnect={() => {
            // Handle disconnection
          }}
        />
      </div>
    </div>
  );
}