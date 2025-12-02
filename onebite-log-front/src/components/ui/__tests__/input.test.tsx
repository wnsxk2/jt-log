import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input 컴포넌트 테스트', () => {
  /**
   * 테스트 그룹: 기본 렌더링
   */
  describe('기본 렌더링', () => {
    /**
     * Given: Input 컴포넌트가 주어졌을 때
     * When: 렌더링하면
     * Then: input 요소가 DOM에 존재해야 함
     */
    it('Should_RenderInput_When_Mounted', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    /**
     * Given: data-slot 속성이 있을 때
     * When: 렌더링하면
     * Then: data-slot="input" 속성이 있어야 함
     */
    it('Should_HaveDataSlotAttribute_When_Rendered', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-slot', 'input');
    });
  });

  /**
   * 테스트 그룹: Type Props
   */
  describe('Type Props', () => {
    /**
     * Given: type="text"가 주어졌을 때
     * When: 렌더링하면
     * Then: type="text" 속성을 가져야 함
     */
    it('Should_HaveTextType_When_TypeText', () => {
      render(<Input type="text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    /**
     * Given: type="email"이 주어졌을 때
     * When: 렌더링하면
     * Then: type="email" 속성을 가져야 함
     */
    it('Should_HaveEmailType_When_TypeEmail', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    /**
     * Given: type="password"가 주어졌을 때
     * When: 렌더링하면
     * Then: type="password" 속성을 가져야 함
     */
    it('Should_HavePasswordType_When_TypePassword', () => {
      render(<Input type="password" />);
      // password input은 role이 없으므로 testId 사용
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    /**
     * Given: type="number"가 주어졌을 때
     * When: 렌더링하면
     * Then: type="number" 속성을 가져야 함
     */
    it('Should_HaveNumberType_When_TypeNumber', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  /**
   * 테스트 그룹: 사용자 입력 처리
   */
  describe('사용자 입력 처리', () => {
    /**
     * Given: Input 컴포넌트가 렌더링되었을 때
     * When: 사용자가 텍스트를 입력하면
     * Then: 입력된 값이 표시되어야 함
     */
    it('Should_DisplayUserInput_When_UserTyping', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'Hello World');

      expect(input).toHaveValue('Hello World');
    });

    /**
     * Given: onChange 핸들러가 전달되었을 때
     * When: 사용자가 입력하면
     * Then: onChange가 호출되어야 함
     */
    it('Should_CallOnChange_When_UserTyping', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'Test');

      // 'Test' 입력 시 4번 호출 (각 문자마다)
      expect(handleChange).toHaveBeenCalledTimes(4);
    });

    /**
     * Given: 제어 컴포넌트 (value prop)가 주어졌을 때
     * When: 렌더링하면
     * Then: value prop의 값이 표시되어야 함
     */
    it('Should_DisplayValue_When_ValuePropProvided', () => {
      render(<Input value="Controlled Value" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Controlled Value');
    });

    /**
     * Given: defaultValue가 주어졌을 때
     * When: 렌더링하면
     * Then: 초기값이 표시되어야 함
     */
    it('Should_DisplayDefaultValue_When_DefaultValueProvided', () => {
      render(<Input defaultValue="Initial Value" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Initial Value');
    });
  });

  /**
   * 테스트 그룹: Placeholder
   */
  describe('Placeholder', () => {
    /**
     * Given: placeholder prop이 주어졌을 때
     * When: 렌더링하면
     * Then: placeholder 텍스트가 표시되어야 함
     */
    it('Should_DisplayPlaceholder_When_PlaceholderProvided', () => {
      render(<Input placeholder="이메일을 입력하세요" />);
      const input = screen.getByPlaceholderText('이메일을 입력하세요');
      expect(input).toBeInTheDocument();
    });

    /**
     * Given: placeholder가 있는 input에 텍스트를 입력했을 때
     * When: 사용자가 입력하면
     * Then: placeholder가 사라지고 입력값이 표시되어야 함
     */
    it('Should_HidePlaceholder_When_UserTyping', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="입력하세요" />);
      const input = screen.getByPlaceholderText('입력하세요');

      await user.type(input, 'Test');

      expect(input).toHaveValue('Test');
      // placeholder는 여전히 속성으로 존재하지만 UI에서는 숨겨짐
      expect(input).toHaveAttribute('placeholder', '입력하세요');
    });
  });

  /**
   * 테스트 그룹: Disabled 상태
   */
  describe('Disabled 상태', () => {
    /**
     * Given: disabled prop이 true일 때
     * When: 렌더링하면
     * Then: input이 disabled 상태여야 함
     */
    it('Should_BeDisabled_When_DisabledPropTrue', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    /**
     * Given: disabled input일 때
     * When: 사용자가 입력하려 하면
     * Then: 입력이 되지 않아야 함
     */
    it('Should_PreventInput_When_Disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'Test');

      expect(input).toHaveValue('');
    });

    /**
     * Given: disabled input일 때
     * When: 렌더링하면
     * Then: opacity-50 클래스를 가져야 함
     */
    it('Should_HaveOpacityClass_When_Disabled', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:opacity-50');
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
      render(<Input className="custom-input-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input-class');
    });

    /**
     * Given: 커스텀 className과 기본 클래스가 함께 있을 때
     * When: 렌더링하면
     * Then: 두 클래스가 모두 적용되어야 함
     */
    it('Should_MergeClasses_When_CustomClassNameProvided', () => {
      render(<Input className="my-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('my-class');
      expect(input).toHaveClass('rounded-md'); // 기본 클래스
    });
  });

  /**
   * 테스트 그룹: 접근성 (Accessibility)
   */
  describe('접근성', () => {
    /**
     * Given: aria-label이 제공되었을 때
     * When: 렌더링하면
     * Then: 해당 aria-label을 가져야 함
     */
    it('Should_HaveAriaLabel_When_AriaLabelProvided', () => {
      render(<Input aria-label="사용자 이름" />);
      const input = screen.getByLabelText('사용자 이름');
      expect(input).toBeInTheDocument();
    });

    /**
     * Given: aria-invalid가 true일 때
     * When: 렌더링하면
     * Then: aria-invalid 속성을 가져야 함
     */
    it('Should_HaveAriaInvalid_When_AriaInvalidTrue', () => {
      render(<Input aria-invalid />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid');
    });

    /**
     * Given: required 속성이 있을 때
     * When: 렌더링하면
     * Then: required 속성을 가져야 함
     */
    it('Should_BeRequired_When_RequiredPropProvided', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });
  });

  /**
   * 테스트 그룹: Focus 상태
   */
  describe('Focus 상태', () => {
    /**
     * Given: Input이 렌더링되었을 때
     * When: input에 focus하면
     * Then: focus 상태가 되어야 함
     */
    it('Should_BeFocused_When_FocusCalled', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');

      await user.click(input);

      expect(input).toHaveFocus();
    });

    /**
     * Given: autoFocus prop이 true일 때
     * When: 렌더링하면
     * Then: 자동으로 focus되어야 함
     */
    it('Should_AutoFocus_When_AutoFocusPropTrue', () => {
      render(<Input autoFocus />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });
  });

  /**
   * 테스트 그룹: Edge Cases
   */
  describe('Edge Cases', () => {
    /**
     * Given: readOnly prop이 true일 때
     * When: 사용자가 입력하려 하면
     * Then: 입력이 되지 않아야 함
     */
    it('Should_PreventInput_When_ReadOnly', async () => {
      const user = userEvent.setup();
      render(<Input readOnly value="Read Only Value" />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'New Text');

      expect(input).toHaveValue('Read Only Value');
    });

    /**
     * Given: maxLength 속성이 있을 때
     * When: 최대 길이를 초과하여 입력하면
     * Then: 최대 길이까지만 입력되어야 함
     */
    it('Should_LimitInput_When_MaxLengthProvided', async () => {
      const user = userEvent.setup();
      render(<Input maxLength={5} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'HelloWorld');

      expect(input).toHaveValue('Hello');
    });

    /**
     * Given: name 속성이 제공되었을 때
     * When: 렌더링하면
     * Then: 해당 name 속성을 가져야 함 (폼 제출용)
     */
    it('Should_HaveName_When_NameProvided', () => {
      render(<Input name="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'email');
    });
  });
});
