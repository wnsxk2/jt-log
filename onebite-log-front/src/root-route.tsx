import GlobalLayout from "@/components/layout/global-layout";
import GuestOnlyLayout from "@/components/layout/guest-only-layout";
import MemberOnlyLayout from "@/components/layout/member-only-layout";
import IndexPage from "@/pages";
import ForgetPasswordPage from "@/pages/forget-password";
import PostDetailPage from "@/pages/post-detail";
import ProfileDetailPage from "@/pages/profile-detail";
import ResetPasswordPage from "@/pages/reset-password";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import { Navigate, Route, Routes } from "react-router";

export default function RootRoute() {
  return (
    <Routes>
      <Route element={<GlobalLayout />}>
        <Route element={<GuestOnlyLayout />}>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/forget-password" element={<ForgetPasswordPage />} />
        </Route>

        <Route element={<MemberOnlyLayout />}>
          <Route path="/" element={<IndexPage />} />
          <Route path="/post/:postId" element={<PostDetailPage />} />
          <Route path="/profile/:userId" element={<ProfileDetailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}
