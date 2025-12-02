import AlertModal from "@/components/modal/alert-modal";
import PostEditModal from "@/components/modal/post-edit-modal";
import ProfileEditorModal from "@/components/modal/profile-editor-modal";
import { type ReactNode } from "react";
import { createPortal } from "react-dom";

export default function ModalProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {createPortal(
        <>
          <PostEditModal />
          <AlertModal />
          <ProfileEditorModal />
        </>,
        document.getElementById("modal-root")!,
      )}
      {children}
    </>
  );
}
