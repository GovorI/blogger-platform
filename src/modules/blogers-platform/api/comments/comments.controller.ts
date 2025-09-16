import { Body, Controller, Delete, Get, HttpCode, Param, Put, UseGuards } from "@nestjs/common";
import { ExtractUserFromRequest } from "../../../user-accounts/guards/decorators/extract-user-from-request";
import { UserContextDto } from "../../../user-accounts/guards/dto/user-context.dto";
import { CommentsService } from "../../application/comment-service";
import { LikesService } from "../../application/like-service";
import { JwtAuthGuard } from "../../../user-accounts/guards/bearer/jwt-auth.guard";
import { UpdateCommentDto } from "../../dto/update-comment.dto";
import { LikeStatusInputDto } from "../input-dto/like-status.input-dto";
import { JwtOptionalGuard } from "../../../user-accounts/guards/bearer/jwt-optional.guard";
import { CommentViewDto } from "../view-dto/comment.view-dto";

@Controller('comments')
export class CommentsController {
    constructor(
        private readonly commentsService: CommentsService,
        private readonly likesService: LikesService
    ) { }

    @Get(':id')
    @UseGuards(JwtOptionalGuard)
    async getCommentById(
        @Param('id') id: string,
        @ExtractUserFromRequest() user: UserContextDto | null): Promise<CommentViewDto> {
        const userId = user?.id || null;
        const comment = await this.commentsService.getCommentById(id, userId);
        return CommentViewDto.mapToView(comment, userId, (comment as any).myStatus);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    updateCommentById(
        @Param('id') id: string,
        @Body() dto: UpdateCommentDto,
        @ExtractUserFromRequest() user: UserContextDto
    ) {
        return this.commentsService.updateCommentById(id, dto, user.id);
    }

    @Put(':id/like-status')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    async updateCommentLikeStatus(
        @Param('id') commentId: string,
        @Body() likeStatusDto: LikeStatusInputDto,
        @ExtractUserFromRequest() user: UserContextDto
    ) {
        await this.likesService.setCommentLikeStatus(commentId, likeStatusDto, user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(204)
    deleteCommentById(
        @Param('id') commentId: string,
        @ExtractUserFromRequest() user: UserContextDto) {
        return this.commentsService.deleteComment(commentId, user.id);
    }
}