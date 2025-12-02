import { Button } from "@/components/ui/button";
import { useOpenEditPostModal } from "@/store/post-editor-modal";
import type { PostEntity } from "@/types";

export default function EditPostButton(props: PostEntity) {
  const openPostEditorModal = useOpenEditPostModal();

  const handleButtonClick = () => {
    openPostEditorModal({
      postId: props.id,
      content: props.content,
      imageUrls: props.imageUrls ?? [],
    });
  };

  return (
    <Button
      onClick={handleButtonClick}
      className="cursor-pointer"
      variant={"ghost"}
    >
      수정
    </Button>
  );
}
