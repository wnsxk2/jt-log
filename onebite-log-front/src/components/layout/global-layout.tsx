import { Link, Outlet } from "react-router";
import logo from "@/assets/logo.png";
import defaultAvatar from "@/assets/default-avatar.jpg";
import { SunIcon } from "lucide-react";
import ProfileButton from "@/components/layout/header/profile-button";
import ThemeButton from "@/components/layout/header/theme-button";

export default function GlobalLayout() {
  return (
    <div className="flex min-h-[100vh] flex-col">
      <header className="h-15 border-b">
        <div className="m-auto flex h-full w-full max-w-175 justify-between px-4">
          <Link to={"/"} className="flex items-center gap-2">
            <img className="h-5" src={logo} alt="JT 로그의 로고" />
            <div className="font-bold">JT 로그</div>
          </Link>
          <div className="flex items-center gap-5">
            <ThemeButton />
            <ProfileButton />
          </div>
        </div>
      </header>
      <main className="m-auto w-full max-w-175 flex-1 border-x px-4 py-6">
        <Outlet />
      </main>
      <footer className="text-muted-foreground border-t py-10 text-center">
        @wnsxk2
      </footer>
    </div>
  );
}
