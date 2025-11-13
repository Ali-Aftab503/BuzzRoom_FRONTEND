"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession, signIn } from "next-auth/react";
import { FolderOpen } from "lucide-react";

interface GoogleDrivePickerProps {
  cardId: string;
  onFileSelected: (file: any) => void;
}

export function GoogleDrivePicker({
  cardId,
  onFileSelected,
}: GoogleDrivePickerProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    await signIn("google");
  };

  const openPicker = () => {
    if (!session?.accessToken) {
      handleConnect();
      return;
    }

    setIsLoading(true);

    // Load Google Picker API
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
      // @ts-ignore
      gapi.load("picker", () => {
        // @ts-ignore
        const picker = new google.picker.PickerBuilder()
          .addView(
            // @ts-ignore
            new google.picker.DocsView(google.picker.ViewId.DOCS)
          )
          .setOAuthToken(session.accessToken)
          .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY!)
          .setCallback((data: any) => {
            if (data.action === "picked") {
              const file = data.docs[0];
              onFileSelected(file);
            }
            setIsLoading(false);
          })
          .build();
        picker.setVisible(true);
      });
    };
    document.body.appendChild(script);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={openPicker}
      disabled={isLoading}
      className="w-full"
    >
      <FolderOpen className="h-4 w-4 mr-2" />
      {session ? "Attach from Google Drive" : "Connect Google Drive"}
    </Button>
  );
}