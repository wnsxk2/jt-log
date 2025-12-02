import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseDto } from '../dto/respone.dto';

/**
 * 전역 HTTP 예외 필터
 * - 모든 HTTP 예외를 ResponseDto 형식으로 변환합니다.
 * - 일관된 에러 응답 형식을 유지합니다.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 예외 응답에서 에러 정보 추출
    let errorCode: string = status.toString();
    let errorMessage: string = exception.message;

    // UnauthorizedException에서 전달된 커스텀 객체 처리
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;

      // { code: 'TOKEN_EXPIRED', message: '...' } 형식 처리
      if (responseObj.code && responseObj.message) {
        errorCode = responseObj.code;
        errorMessage = responseObj.message;
      }
      // { message: '...', error: '...' } 형식 처리 (NestJS 기본 형식)
      else if (responseObj.message) {
        errorMessage =
          typeof responseObj.message === 'string'
            ? responseObj.message
            : Array.isArray(responseObj.message)
              ? responseObj.message.join(', ')
              : exception.message;
      }
    }

    // ResponseDto 형식으로 응답
    const errorResponse = ResponseDto.fail(errorCode, errorMessage);

    response.status(status).json(errorResponse);
  }
}
