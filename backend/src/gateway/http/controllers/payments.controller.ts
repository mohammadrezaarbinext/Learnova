import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { AuthUser } from '../../../common/types/auth-user.type';
import { PaymentsService } from '../../../modules/payments/service/payments.service';
import { ErrorResponse } from '../response/error.response';
import { PaymentRequestResponse, PurchaseCourseResponse } from '../response/payment.response';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('courses/:courseId/purchase')
  @ApiOperation({ summary: 'Purchase a course with mock payment' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiOkResponse({ type: PurchaseCourseResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires payments.purchase permission.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('payments.purchase')
  purchaseCourse(@Param('courseId', ParseUUIDPipe) courseId: string, @CurrentUser() user: AuthUser) {
    return this.paymentsService.purchaseCourse(courseId, user);
  }

  @Get('payments/me')
  @ApiOperation({ summary: 'List current user payment requests' })
  @ApiOkResponse({ type: [PaymentRequestResponse] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires payments.read permission.', type: ErrorResponse })
  @Permissions('payments.read')
  findMine(@CurrentUser() user: AuthUser) {
    return this.paymentsService.findMine(user);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get a payment request by uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PaymentRequestResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Users can view own payments. ADMIN and SUPPORT can view any payment.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('payments.read')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.paymentsService.findOne(id, user);
  }
}
