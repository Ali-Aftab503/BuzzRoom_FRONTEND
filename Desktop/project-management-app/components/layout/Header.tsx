import { UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

export default async function Header() {
  const { userId } = await auth();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href={userId ? "/dashboard" : "/"}
          className="flex items-center space-x-2 hover:opacity-80 transition"
        >
          <LayoutDashboard className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold">TaskFlow</span>
        </Link>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {userId ? (
            <>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />
              {userId && (
  <>
    <Link href="/settings/integrations">
      <Button variant="ghost" size="sm">
        Integrations
      </Button>
    </Link>
    <UserButton 
      afterSignOutUrl="/"
      appearance={{
        elements: {
          avatarBox: "h-9 w-9",
        },
      }}
    />
  </>
)}
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Sign Up</Button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}