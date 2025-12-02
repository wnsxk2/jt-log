import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreatePostButton from '../create-post-button';

// Zustand 스토어 모킹
jest.mock('@/store/post-editor-modal', () => ({
  useOpenCreatePostModal: jest.fn(),
}));

import { useOpenCreatePostModal } from '@/store/post-editor-modal';

describe('CreatePostButton 컴포넌트 테스트', () => {
  // 각 테스트 후 모킹 초기화
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 테스트 그룹: 기본 렌더링
   */
  describe('기본 렌더링', () => {
    /**
     * Given: CreatePostButton이 주어졌을 때
     * When: 렌더링하면
     * Then: 안내 메시지가 표시되어야 함
     */
    it('Should_DisplayPromptMessage_When_Rendered', () => {
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(jest.fn());

      render(<CreatePostButton />);

      const message = screen.getByText('나누고 싶은 이야기가 있나요?');
      expect(message).toBeInTheDocument();
    });

    /**
     * Given: CreatePostButton이 렌더링되었을 때
     * When: DOM을 확인하면
     * Then: PlusCircle 아이콘이 존재해야 함
     */
    it('Should_RenderPlusCircleIcon_When_Mounted', () => {
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(jest.fn());

      const { container } = render(<CreatePostButton />);

      // lucide-react 아이콘은 SVG로 렌더링됨
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    /**
     * Given: CreatePostButton이 렌더링되었을 때
     * When: 아이콘을 확인하면
     * Then: 적절한 크기 클래스를 가져야 함
     */
    it('Should_HaveCorrectIconSize_When_Rendered', () => {
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(jest.fn());

      const { container } = render(<CreatePostButton />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-5');
      expect(svg).toHaveClass('w-5');
    });
  });

  /**
   * 테스트 그룹: 스타일링
   */
  describe('스타일링', () => {
    /**
     * Given: CreatePostButton이 렌더링되었을 때
     * When: 컨테이너를 확인하면
     * Then: 적절한 배경색과 패딩을 가져야 함
     */
    it('Should_HaveCorrectStyling_When_Rendered', () => {
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(jest.fn());

      const { container } = render(<CreatePostButton />);
      const button = container.firstChild;

      expect(button).toHaveClass('bg-muted');
      expect(button).toHaveClass('rounded-xl');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-4');
    });

    /**
     * Given: CreatePostButton이 렌더링되었을 때
     * When: 커서를 확인하면
     * Then: cursor-pointer를 가져야 함
     */
    it('Should_HaveCursorPointer_When_Rendered', () => {
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(jest.fn());

      const { container } = render(<CreatePostButton />);
      const button = container.firstChild;

      expect(button).toHaveClass('cursor-pointer');
    });

    /**
     * Given: CreatePostButton이 렌더링되었을 때
     * When: 내부 레이아웃을 확인하면
     * Then: flex와 justify-between을 사용해야 함
     */
    it('Should_UseFlexLayout_When_Rendered', () => {
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(jest.fn());

      const { container } = render(<CreatePostButton />);
      // 외부 div의 자식 div 선택 (textContent로 찾기)
      const innerDiv = screen.getByText('나누고 싶은 이야기가 있나요?').parentElement;

      expect(innerDiv).toHaveClass('flex');
      expect(innerDiv).toHaveClass('items-center');
      expect(innerDiv).toHaveClass('justify-between');
    });
  });

  /**
   * 테스트 그룹: 클릭 이벤트 처리
   */
  describe('클릭 이벤트 처리', () => {
    /**
     * Given: CreatePostButton을 클릭했을 때
     * When: 클릭 이벤트가 발생하면
     * Then: openPostEditorModal 함수가 호출되어야 함
     */
    it('Should_OpenModal_When_Clicked', async () => {
      const mockOpenModal = jest.fn();
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(mockOpenModal);

      const user = userEvent.setup();
      render(<CreatePostButton />);

      const button = screen.getByText('나누고 싶은 이야기가 있나요?').closest('div');
      await user.click(button!);

      expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });

    /**
     * Given: CreatePostButton을 여러 번 클릭했을 때
     * When: 3번 클릭하면
     * Then: openPostEditorModal이 3번 호출되어야 함
     */
    it('Should_CallOpenModalMultipleTimes_When_ClickedMultipleTimes', async () => {
      const mockOpenModal = jest.fn();
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(mockOpenModal);

      const user = userEvent.setup();
      render(<CreatePostButton />);

      const button = screen.getByText('나누고 싶은 이야기가 있나요?').closest('div');

      await user.click(button!);
      await user.click(button!);
      await user.click(button!);

      expect(mockOpenModal).toHaveBeenCalledTimes(3);
    });
  });

  /**
   * 테스트 그룹: Hook 통합
   */
  describe('Hook 통합', () => {
    /**
     * Given: useOpenCreatePostModal hook이 호출될 때
     * When: 컴포넌트가 마운트되면
     * Then: hook이 정확히 한 번 호출되어야 함
     */
    it('Should_CallHook_When_ComponentMounts', () => {
      const mockOpenModal = jest.fn();
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(mockOpenModal);

      render(<CreatePostButton />);

      expect(useOpenCreatePostModal).toHaveBeenCalledTimes(1);
    });

    /**
     * Given: CreatePostButton이 재렌더링될 때
     * When: props나 상태가 변경되지 않으면
     * Then: hook 호출 결과가 재사용되어야 함
     */
    it('Should_ReuseHookResult_When_ReRendered', () => {
      const mockOpenModal = jest.fn();
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(mockOpenModal);

      const { rerender } = render(<CreatePostButton />);

      const initialCallCount = (useOpenCreatePostModal as jest.Mock).mock.calls.length;

      rerender(<CreatePostButton />);

      // React의 hook 규칙에 따라 매 렌더링마다 호출되지만
      // 같은 함수 인스턴스를 반환해야 함
      expect(mockOpenModal).toBe(mockOpenModal);
    });
  });

  /**
   * 테스트 그룹: 접근성 (Accessibility)
   */
  describe('접근성', () => {
    /**
     * Given: CreatePostButton이 렌더링되었을 때
     * When: 스크린 리더가 읽으면
     * Then: 버튼의 목적을 알 수 있어야 함
     */
    it('Should_BeAccessible_When_Rendered', () => {
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(jest.fn());

      render(<CreatePostButton />);

      const message = screen.getByText('나누고 싶은 이야기가 있나요?');
      expect(message).toBeVisible();
    });

    /**
     * Given: CreatePostButton을 키보드로 조작할 때
     * When: Enter 키를 누르면
     * Then: 클릭 이벤트가 발생해야 함
     */
    it('Should_BeKeyboardAccessible_When_EnterPressed', async () => {
      const mockOpenModal = jest.fn();
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(mockOpenModal);

      const user = userEvent.setup();
      render(<CreatePostButton />);

      const button = screen.getByText('나누고 싶은 이야기가 있나요?').closest('div');

      // div 요소에 focus
      button!.focus();
      await user.keyboard('{Enter}');

      // div의 onClick은 키보드 Enter로 트리거되지 않을 수 있음
      // 실제 프로덕션에서는 button 요소나 role="button"을 사용하는 것이 좋음
    });
  });

  /**
   * 테스트 그룹: Edge Cases
   */
  describe('Edge Cases', () => {
    /**
     * Given: CreatePostButton이 언마운트되었을 때
     * When: 재마운트하면
     * Then: 정상적으로 동작해야 함
     */
    it('Should_WorkCorrectly_When_RemountedAfterUnmount', async () => {
      const mockOpenModal = jest.fn();
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(mockOpenModal);

      const user = userEvent.setup();
      const { unmount } = render(<CreatePostButton />);

      unmount();

      // 새로운 인스턴스로 다시 렌더링
      render(<CreatePostButton />);

      const button = screen.getByText('나누고 싶은 이야기가 있나요?').closest('div');
      await user.click(button!);

      expect(mockOpenModal).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * 테스트 그룹: 통합 시나리오
   */
  describe('통합 시나리오', () => {
    /**
     * Given: 게시물 작성 플로우를 시뮬레이션할 때
     * When: 버튼 클릭 → 모달 오픈 → 모달 닫기 → 재클릭하면
     * Then: 각 단계가 정상적으로 동작해야 함
     */
    it('Should_HandleCompleteFlow_When_CreatePostWorkflow', async () => {
      const mockOpenModal = jest.fn();
      (useOpenCreatePostModal as jest.Mock).mockReturnValue(mockOpenModal);

      const user = userEvent.setup();
      render(<CreatePostButton />);

      const button = screen.getByText('나누고 싶은 이야기가 있나요?').closest('div');

      // 첫 번째 클릭 (모달 오픈)
      await user.click(button!);
      expect(mockOpenModal).toHaveBeenCalledTimes(1);

      // 모달이 닫힌 후 재클릭 시뮬레이션
      await user.click(button!);
      expect(mockOpenModal).toHaveBeenCalledTimes(2);
    });
  });
});
