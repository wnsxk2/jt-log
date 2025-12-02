import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LikePostButton from '../like-post-button';
import type { Session } from '@supabase/supabase-js';

// 모킹 설정
jest.mock('@/lib/supabase', () => ({
  __esModule: true,
  default: {
    from: jest.fn(),
    auth: {},
    rpc: jest.fn(),
  },
}));
jest.mock('@/hooks/mutations/post/use-toggle-post-like');
jest.mock('@/store/session');
jest.mock('sonner');

import useTogglePostLike from '@/hooks/mutations/post/use-toggle-post-like';
import { useSession } from '@/store/session';
import { toast } from 'sonner';

describe('LikePostButton 컴포넌트 테스트', () => {
  // 테스트용 모킹 데이터
  const mockSession: Session = {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: {
      id: 'user-123',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
    },
  };

  const defaultProps = {
    id: 1,
    likeCount: 5,
    isLiked: false,
  };

  beforeEach(() => {
    // 기본 모킹 설정
    (useSession as jest.Mock).mockReturnValue(mockSession);
    (useTogglePostLike as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 테스트 그룹: 기본 렌더링
   */
  describe('기본 렌더링', () => {
    /**
     * Given: LikePostButton에 props가 전달되었을 때
     * When: 렌더링하면
     * Then: 좋아요 수가 표시되어야 함
     */
    it('Should_DisplayLikeCount_When_Rendered', () => {
      render(<LikePostButton {...defaultProps} />);

      const likeCount = screen.getByText('5');
      expect(likeCount).toBeInTheDocument();
    });

    /**
     * Given: LikePostButton이 렌더링되었을 때
     * When: DOM을 확인하면
     * Then: Heart 아이콘이 존재해야 함
     */
    it('Should_RenderHeartIcon_When_Mounted', () => {
      const { container } = render(<LikePostButton {...defaultProps} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    /**
     * Given: likeCount가 0일 때
     * When: 렌더링하면
     * Then: "0"이 표시되어야 함
     */
    it('Should_DisplayZero_When_NoLikes', () => {
      render(<LikePostButton {...defaultProps} likeCount={0} />);

      const likeCount = screen.getByText('0');
      expect(likeCount).toBeInTheDocument();
    });

    /**
     * Given: likeCount가 큰 숫자일 때
     * When: 렌더링하면
     * Then: 해당 숫자가 표시되어야 함
     */
    it('Should_DisplayLargeNumber_When_ManyLikes', () => {
      render(<LikePostButton {...defaultProps} likeCount={999} />);

      const likeCount = screen.getByText('999');
      expect(likeCount).toBeInTheDocument();
    });
  });

  /**
   * 테스트 그룹: isLiked 상태 표시
   */
  describe('isLiked 상태 표시', () => {
    /**
     * Given: isLiked가 false일 때
     * When: 렌더링하면
     * Then: Heart 아이콘이 채워지지 않아야 함
     */
    it('Should_ShowUnfilledHeart_When_NotLiked', () => {
      const { container } = render(<LikePostButton {...defaultProps} isLiked={false} />);

      const svg = container.querySelector('svg');
      expect(svg).not.toHaveClass('fill-foreground');
    });

    /**
     * Given: isLiked가 true일 때
     * When: 렌더링하면
     * Then: Heart 아이콘이 채워져야 함
     */
    it('Should_ShowFilledHeart_When_Liked', () => {
      const { container } = render(<LikePostButton {...defaultProps} isLiked={true} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('fill-foreground');
      expect(svg).toHaveClass('border-foreground');
    });
  });

  /**
   * 테스트 그룹: 클릭 이벤트 처리
   */
  describe('클릭 이벤트 처리', () => {
    /**
     * Given: LikePostButton을 클릭했을 때
     * When: 클릭 이벤트가 발생하면
     * Then: togglePostLike mutation이 호출되어야 함
     */
    it('Should_CallToggleLike_When_Clicked', async () => {
      const mockMutate = jest.fn();
      (useTogglePostLike as jest.Mock).mockReturnValue({
        mutate: mockMutate,
      });

      const user = userEvent.setup();
      const { container } = render(<LikePostButton {...defaultProps} />);

      const button = container.querySelector('[class*="cursor-pointer"]');
      await user.click(button!);

      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalledWith({
        postId: 1,
        userId: 'user-123',
      });
    });

    /**
     * Given: 좋아요를 여러 번 클릭했을 때
     * When: 3번 클릭하면
     * Then: togglePostLike가 3번 호출되어야 함
     */
    it('Should_CallToggleLikeMultipleTimes_When_ClickedMultipleTimes', async () => {
      const mockMutate = jest.fn();
      (useTogglePostLike as jest.Mock).mockReturnValue({
        mutate: mockMutate,
      });

      const user = userEvent.setup();
      const { container } = render(<LikePostButton {...defaultProps} />);

      const button = container.querySelector('[class*="cursor-pointer"]');

      await user.click(button!);
      await user.click(button!);
      await user.click(button!);

      expect(mockMutate).toHaveBeenCalledTimes(3);
    });

    /**
     * Given: 다른 게시물 ID로 렌더링되었을 때
     * When: 클릭하면
     * Then: 올바른 postId가 전달되어야 함
     */
    it('Should_PassCorrectPostId_When_DifferentPostClicked', async () => {
      const mockMutate = jest.fn();
      (useTogglePostLike as jest.Mock).mockReturnValue({
        mutate: mockMutate,
      });

      const user = userEvent.setup();
      const { container } = render(<LikePostButton id={42} likeCount={10} isLiked={false} />);

      const button = container.querySelector('[class*="cursor-pointer"]');
      await user.click(button!);

      expect(mockMutate).toHaveBeenCalledWith({
        postId: 42,
        userId: 'user-123',
      });
    });
  });

  /**
   * 테스트 그룹: 에러 처리
   */
  describe('에러 처리', () => {
    /**
     * Given: togglePostLike mutation이 실패했을 때
     * When: onError 콜백이 호출되면
     * Then: 에러 토스트가 표시되어야 함
     */
    it('Should_ShowErrorToast_When_MutationFails', () => {
      const mockOnError = jest.fn();
      (useTogglePostLike as jest.Mock).mockImplementation(({ onError }: any) => {
        // onError 콜백을 저장하여 나중에 호출할 수 있도록 함
        mockOnError.mockImplementation(onError);
        return { mutate: jest.fn() };
      });

      render(<LikePostButton {...defaultProps} />);

      // onError 콜백 시뮬레이션
      const error = new Error('Network error');
      mockOnError(error);

      expect(toast.error).toHaveBeenCalledWith('좋아요 요청에 실패했습니다.', {
        position: 'top-center',
      });
    });

    /**
     * Given: useTogglePostLike hook 설정 시
     * When: 컴포넌트가 마운트되면
     * Then: onError 콜백이 정의되어야 함
     */
    it('Should_DefineOnError_When_ComponentMounts', () => {
      render(<LikePostButton {...defaultProps} />);

      expect(useTogglePostLike).toHaveBeenCalledWith(
        expect.objectContaining({
          onError: expect.any(Function),
        })
      );
    });
  });

  /**
   * 테스트 그룹: Session 통합
   */
  describe('Session 통합', () => {
    /**
     * Given: 세션이 존재할 때
     * When: 좋아요 버튼을 클릭하면
     * Then: 세션의 userId가 mutation에 전달되어야 함
     */
    it('Should_UseSessionUserId_When_LikeButtonClicked', async () => {
      const mockMutate = jest.fn();
      (useTogglePostLike as jest.Mock).mockReturnValue({
        mutate: mockMutate,
      });

      const user = userEvent.setup();
      const { container } = render(<LikePostButton {...defaultProps} />);

      const button = container.querySelector('[class*="cursor-pointer"]');
      await user.click(button!);

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
        })
      );
    });

    /**
     * Given: useSession hook이 호출될 때
     * When: 컴포넌트가 마운트되면
     * Then: 세션 정보를 가져와야 함
     */
    it('Should_GetSession_When_ComponentMounts', () => {
      render(<LikePostButton {...defaultProps} />);

      expect(useSession).toHaveBeenCalled();
    });
  });

  /**
   * 테스트 그룹: 스타일링
   */
  describe('스타일링', () => {
    /**
     * Given: LikePostButton이 렌더링되었을 때
     * When: 컨테이너를 확인하면
     * Then: 적절한 스타일 클래스를 가져야 함
     */
    it('Should_HaveCorrectStyling_When_Rendered', () => {
      const { container } = render(<LikePostButton {...defaultProps} />);
      const button = container.firstChild;

      expect(button).toHaveClass('cursor-pointer');
      expect(button).toHaveClass('rounded-xl');
      expect(button).toHaveClass('border-1');
    });

    /**
     * Given: LikePostButton이 호버 상태일 때
     * When: 스타일을 확인하면
     * Then: hover:bg-muted 클래스를 가져야 함
     */
    it('Should_HaveHoverEffect_When_MouseOver', () => {
      const { container } = render(<LikePostButton {...defaultProps} />);
      const button = container.firstChild;

      expect(button).toHaveClass('hover:bg-muted');
    });

    /**
     * Given: Heart 아이콘이 렌더링되었을 때
     * When: 크기를 확인하면
     * Then: h-4 w-4 클래스를 가져야 함
     */
    it('Should_HaveCorrectIconSize_When_Rendered', () => {
      const { container } = render(<LikePostButton {...defaultProps} />);
      const svg = container.querySelector('svg');

      expect(svg).toHaveClass('h-4');
      expect(svg).toHaveClass('w-4');
    });
  });

  /**
   * 테스트 그룹: Edge Cases
   */
  describe('Edge Cases', () => {
    /**
     * Given: likeCount가 음수일 때 (비정상 데이터)
     * When: 렌더링하면
     * Then: 음수가 그대로 표시되어야 함 (서버 데이터 신뢰)
     */
    it('Should_DisplayNegativeNumber_When_NegativeLikeCount', () => {
      render(<LikePostButton {...defaultProps} likeCount={-5} />);

      const likeCount = screen.getByText('-5');
      expect(likeCount).toBeInTheDocument();
    });

    /**
     * Given: 컴포넌트가 언마운트 후 재마운트되었을 때
     * When: 다시 클릭하면
     * Then: 정상적으로 동작해야 함
     */
    it('Should_WorkCorrectly_When_RemountedAfterUnmount', async () => {
      const mockMutate = jest.fn();
      (useTogglePostLike as jest.Mock).mockReturnValue({
        mutate: mockMutate,
      });

      const user = userEvent.setup();
      const { unmount } = render(<LikePostButton {...defaultProps} />);

      unmount();

      // 새로운 인스턴스로 다시 렌더링
      const { container } = render(<LikePostButton {...defaultProps} />);

      const button = container.querySelector('[class*="cursor-pointer"]');
      await user.click(button!);

      expect(mockMutate).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * 테스트 그룹: 통합 시나리오
   */
  describe('통합 시나리오', () => {
    /**
     * Given: 좋아요 토글 플로우를 시뮬레이션할 때
     * When: 좋아요 추가 → 제거 → 재추가하면
     * Then: 각 상태가 올바르게 표시되어야 함
     */
    it('Should_UpdateLikeState_When_TogglingLike', () => {
      const mockMutate = jest.fn();
      (useTogglePostLike as jest.Mock).mockReturnValue({
        mutate: mockMutate,
      });

      // 좋아요 없는 상태
      const { rerender, container } = render(<LikePostButton id={1} likeCount={5} isLiked={false} />);

      let svg = container.querySelector('svg');
      expect(svg).not.toHaveClass('fill-foreground');
      expect(screen.getByText('5')).toBeInTheDocument();

      // 좋아요 추가 시뮬레이션 (isLiked: true, likeCount: 6)
      rerender(<LikePostButton id={1} likeCount={6} isLiked={true} />);

      svg = container.querySelector('svg');
      expect(svg).toHaveClass('fill-foreground');
      expect(screen.getByText('6')).toBeInTheDocument();

      // 좋아요 제거 시뮬레이션 (isLiked: false, likeCount: 5)
      rerender(<LikePostButton id={1} likeCount={5} isLiked={false} />);

      svg = container.querySelector('svg');
      expect(svg).not.toHaveClass('fill-foreground');
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    /**
     * Given: 여러 게시물의 좋아요 버튼이 있을 때
     * When: 각각 다른 좋아요 수를 가지면
     * Then: 각 버튼이 독립적으로 동작해야 함
     */
    it('Should_WorkIndependently_When_MultipleLikeButtons', () => {
      const { container } = render(
        <div>
          <LikePostButton id={1} likeCount={5} isLiked={false} />
          <LikePostButton id={2} likeCount={10} isLiked={true} />
          <LikePostButton id={3} likeCount={0} isLiked={false} />
        </div>
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();

      // 각 버튼의 아이콘 상태 확인
      const svgs = container.querySelectorAll('svg');
      expect(svgs).toHaveLength(3);
    });
  });
});
