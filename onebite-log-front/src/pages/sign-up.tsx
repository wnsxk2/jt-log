import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignUp } from "@/hooks/mutations/auth/use-sign-up";
import { generateErrorMessage } from "@/lib/error";
import { getRandomNickname } from "@/lib/utils";
import { useOpenAlertModal } from "@/store/alert-modal";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const openAlertModal = useOpenAlertModal();
  const navigate = useNavigate();

  const { mutate: signUp, isPending: isSignUpPending } = useSignUp({
    onSuccess: () => {
      openAlertModal({
        title: "회원가입 완료",
        descrption: "회원가입이 완료되었습니다.",
        onPositive: () => {
          navigate("/sign-in");
        },
      });
    },
    onError: (error) => {
      const message = generateErrorMessage(error);
      toast.error(message, { position: "top-center" });
    },
  });

  const handleSignUpClick = () => {
    if (email.trim() === "") return;
    if (password.trim() === "") return;

    signUp({
      email,
      password,
      nickname: getRandomNickname(),
    });
  };
  return (
    <div className="flex flex-col gap-8">
      <div className="text-xl font-bold">회원가입</div>
      <div className="flex flex-col gap-2">
        <Input
          disabled={isSignUpPending}
          className="py-6"
          type="email"
          placeholder="example@abc.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          disabled={isSignUpPending}
          className="py-6"
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <Button
          disabled={isSignUpPending}
          className="w-full"
          onClick={handleSignUpClick}
        >
          회원가입
        </Button>
      </div>
      <div className="text-center">
        <Link className="text-muted-foreground hover:underline" to={"/sign-in"}>
          이미 계정이 있다면? 로그인
        </Link>
      </div>
    </div>
  );
}
