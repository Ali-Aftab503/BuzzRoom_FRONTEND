import Pusher from "pusher";

let pusherServer: Pusher;

try {
  pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
  });
} catch (error) {
  console.error("Failed to initialize Pusher:", error);
  // Create a dummy pusher that won't crash
  pusherServer = {
    trigger: async () => {
      console.warn("Pusher not configured, skipping real-time updates");
      return { channels: {} } as any;
    },
    authorizeChannel: () => {
      return { auth: "" };
    },
  } as any;
}

export { pusherServer };