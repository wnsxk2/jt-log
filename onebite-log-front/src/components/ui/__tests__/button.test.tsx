import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button 컴포넌트 테스트', () => {
  /**
   * 테스트 그룹: 기본 렌더링
   */
  describe('기본 렌더링', () => {
    /**
     * Given: Button 컴포넌트가 주어졌을 때
     * When: 렌더링하면
     * Then: 버튼 요소가 DOM에 존재해야 함
     */
    it('Should_RenderButton_When_Mounted', () => {
      render(<Button>클릭</Button>);
      const button = screen.getByRole('button', { name: '클릭' });
      expect(button).toBeInTheDocument();
    });

    /**
     * Given: children prop이 전달되었을 때
     * When: 렌더링하면
     * Then: children 내용이 버튼에 표시되어야 함
     */
    it('Should_DisplayChildren_When_ChildrenProvided', () => {
      render(<Button>버튼 텍스트</Button>);
      expect(screen.getByText('버튼 텍스트')).toBeInTheDocument();
    });

    /**
     * Given: data-slot 속성이 있을 때
     * When: 렌더링하면
     * Then: data-slot="button" 속성이 있어야 함
     */
    it('Should_HaveDataSlotAttribute_When_Rendered', () => {
      render(<Button>테스트</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-slot', 'button');
    });
  });

  /**
   * 테스트 그룹: Variant Props
   */
  describe('Variant Props', () => {
    /**
     * Given: variant="default"가 주어졌을 때
     * When: 렌더링하면
     * Then: primary 배경색 클래스를 가져야 함
     */
    it('Should_ApplyDefaultVariant_When_VariantDefault', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
    });

    /**
     * Given: variant="destructive"가 주어졌을 때
     * When: 렌더링하면
     * Then: destructive 배경색 클래스를 가져야 함
     */
    it('Should_ApplyDestructiveVariant_When_VariantDestructive', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });

    /**
     * Given: variant="outline"이 주어졌을 때
     * When: 렌더링하면
     * Then: border 클래스를 가져야 함
     */
    it('Should_ApplyOutlineVariant_When_VariantOutline', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });

    /**
     * Given: variant="ghost"가 주어졌을 때
     * When: 렌더링하면
     * Then: hover:bg-accent 클래스를 가져야 함
     */
    it('Should_ApplyGhostVariant_When_VariantGhost', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    /**
     * Given: variant="link"가 주어졌을 때
     * When: 렌더링하면
     * Then: underline 클래스를 가져야 함
     */
    it('Should_ApplyLinkVariant_When_VariantLink', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:underline');
    });
  });

  /**
   * 테스트 그룹: Size Props
   */
  describe('Size Props', () => {
    /**
     * Given: size="default"가 주어졌을 때
     * When: 렌더링하면
     * Then: h-9 클래스를 가져야 함
     */
    it('Should_ApplyDefaultSize_When_SizeDefault', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
    });

    /**
     * Given: size="sm"이 주어졌을 때
     * When: 렌더링하면
     * Then: h-8 클래스를 가져야 함
     */
    it('Should_ApplySmallSize_When_SizeSm', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');
    });

    /**
     * Given: size="lg"가 주어졌을 때
     * When: 렌더링하면
     * Then: h-10 클래스를 가져야 함
     */
    it('Should_ApplyLargeSize_When_SizeLg', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    /**
     * Given: size="icon"이 주어졌을 때
     * When: 렌더링하면
     * Then: size-9 클래스를 가져야 함
     */
    it('Should_ApplyIconSize_When_SizeIcon', () => {
      render(<Button size="icon">🔍</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-9');
    });
  });

  /**
   * 테스트 그룹: 이벤트 핸들링
   */
  describe('이벤트 핸들링', () => {
    /**
     * Given: onClick 핸들러가 전달되었을 때
     * When: 버튼을 클릭하면
     * Then: onClick 핸들러가 호출되어야 함
     */
    it('Should_CallOnClick_When_ButtonClicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button');

      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    /**
     * Given: disabled 버튼에 onClick 핸들러가 있을 때
     * When: 버튼을 클릭하면
     * Then: onClick이 호출되지 않아야 함 (브라우저 기본 동작)
     */
    it('Should_NotCallOnClick_When_ButtonDisabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );
      const button = screen.getByRole('button');

      await user.click(button);

      // disabled 버튼은 클릭 이벤트가 발생하지 않음
      expect(handleClick).not.toHaveBeenCalled();
    });

    /**
     * Given: 버튼을 여러 번 클릭했을 때
     * When: 3번 클릭하면
     * Then: onClick이 3번 호출되어야 함
     */
    it('Should_CallOnClickMultipleTimes_When_ClickedMultipleTimes', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Multi Click</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  /**
   * 테스트 그룹: Disabled 상태
   */
  describe('Disabled 상태', () => {
    /**
     * Given: disabled prop이 true일 때
     * When: 렌더링하면
     * Then: 버튼이 disabled 속성을 가져야 함
     */
    it('Should_BeDisabled_When_DisabledPropTrue', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    /**
     * Given: disabled 버튼일 때
     * When: 렌더링하면
     * Then: opacity-50 클래스를 가져야 함
     */
    it('Should_HaveOpacityClass_When_Disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    /**
     * Given: disabled prop이 없을 때
     * When: 렌더링하면
     * Then: 버튼이 활성화 상태여야 함
     */
    it('Should_BeEnabled_When_DisabledPropNotProvided', () => {
      render(<Button>Enabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  /**
   * 테스트 그룹: Custom ClassName
   */
  describe('Custom ClassName', () => {
    /**
     * Given: 커스텀 className이 전달되었을 때
     * When: 렌더링하면
     * Then: 커스텀 클래스가 적용되어야 함
     */
    it('Should_ApplyCustomClassName_When_ClassNameProvided', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    /**
     * Given: 커스텀 className과 variant가 함께 전달되었을 때
     * When: 렌더링하면
     * Then: 두 클래스가 모두 적용되어야 함
     */
    it('Should_MergeClasses_When_ClassNameAndVariantProvided', () => {
      render(
        <Button variant="destructive" className="my-custom-class">
          Merged
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('my-custom-class');
    });
  });

  /**
   * 테스트 그룹: 접근성 (Accessibility)
   */
  describe('접근성', () => {
    /**
     * Given: Button 컴포넌트가 렌더링되었을 때
     * When: role을 확인하면
     * Then: button role을 가져야 함
     */
    it('Should_HaveButtonRole_When_Rendered', () => {
      render(<Button>Accessible</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    /**
     * Given: type prop이 전달되었을 때
     * When: 렌더링하면
     * Then: 해당 type 속성을 가져야 함
     */
    it('Should_HaveCorrectType_When_TypeProvided', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    /**
     * Given: aria-label이 전달되었을 때
     * When: 렌더링하면
     * Then: 해당 aria-label을 가져야 함
     */
    it('Should_HaveAriaLabel_When_AriaLabelProvided', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      const button = screen.getByRole('button', { name: 'Close dialog' });
      expect(button).toBeInTheDocument();
    });
  });

  /**
   * 테스트 그룹: Edge Cases
   */
  describe('Edge Cases', () => {
    /**
     * Given: children이 없을 때
     * When: 렌더링하면
     * Then: 빈 버튼이 렌더링되어야 함
     */
    it('Should_RenderEmptyButton_When_NoChildren', () => {
      render(<Button />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('');
    });

    /**
     * Given: 복잡한 children (아이콘 + 텍스트)이 주어졌을 때
     * When: 렌더링하면
     * Then: 모든 children이 렌더링되어야 함
     */
    it('Should_RenderComplexChildren_When_IconAndTextProvided', () => {
      render(
        <Button>
          <span>🔍</span>
          <span>검색</span>
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('🔍검색');
    });
  });
});
