import { ApiProperty } from '@nestjs/swagger';

type ErrorData = {
  code: string;
  message: string;
};

type Result = 'success' | 'error';

export class ResponseDto<T> {
  @ApiProperty({ example: 'success' })
  result: Result;

  @ApiProperty({ description: '성공 시 데이터', required: false })
  data?: T;

  @ApiProperty({ description: '실패 시 에러 정보', required: false })
  error?: ErrorData;

  constructor(result: Result, data?: T, error?: ErrorData) {
    this.result = result;
    this.data = data;
    this.error = error;
  }

  static success<T>(data: T): ResponseDto<T> {
    return new ResponseDto('success', data, undefined);
  }

  static fail(errorCode: string, message: string): ResponseDto<void> {
    return new ResponseDto('error', undefined, { code: errorCode, message });
  }
}
