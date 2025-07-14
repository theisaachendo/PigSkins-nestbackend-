import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { 
  CreateMatchDto, 
  UpdateMatchDto, 
  MatchDto, 
  MatchListResponseDto,
  JoinMatchDto,
  LeaveMatchDto,
  JoinByCodeDto,
  MatchStatus 
} from './dto/match.dto';
import { RecordScoreDto, MatchScoresDto } from './dto/score.dto';
import { CreateMatchWithCourseDto } from './dto/golf.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('Matches')
@Controller('matches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new match' })
  @ApiResponse({
    status: 201,
    description: 'Match created successfully',
    type: MatchDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createMatch(
    @Request() req: ExpressRequest & { user: any },
    @Body() createMatchDto: CreateMatchDto,
  ): Promise<MatchDto> {
    return this.matchesService.createMatch(req.user.id, createMatchDto);
  }

  @Post('with-course')
  @ApiOperation({ summary: 'Create a new match with real course data' })
  @ApiResponse({
    status: 201,
    description: 'Match created successfully with course data',
    type: MatchDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createMatchWithCourse(
    @Request() req: ExpressRequest & { user: any },
    @Body() createMatchDto: CreateMatchWithCourseDto,
  ): Promise<MatchDto> {
    return this.matchesService.createMatchWithCourse(req.user.id, createMatchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all matches' })
  @ApiResponse({
    status: 200,
    description: 'Matches retrieved successfully',
    type: MatchListResponseDto,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: MatchStatus })
  @ApiQuery({ name: 'date', required: false, type: String, example: '2025-07-20' })
  async getMatches(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: MatchStatus,
    @Query('date') date?: string,
  ): Promise<MatchListResponseDto> {
    return this.matchesService.getMatches(page, limit, status, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by ID' })
  @ApiResponse({
    status: 200,
    description: 'Match retrieved successfully',
    type: MatchDto,
  })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async getMatchById(@Param('id') id: string): Promise<MatchDto> {
    return this.matchesService.getMatchById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update match' })
  @ApiResponse({
    status: 200,
    description: 'Match updated successfully',
    type: MatchDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async updateMatch(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') id: string,
    @Body() updateMatchDto: UpdateMatchDto,
  ): Promise<MatchDto> {
    return this.matchesService.updateMatch(req.user.id, id, updateMatchDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete match' })
  @ApiResponse({ status: 204, description: 'Match deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async deleteMatch(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.matchesService.deleteMatch(req.user.id, id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a match' })
  @ApiResponse({
    status: 200,
    description: 'Joined match successfully',
    type: MatchDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async joinMatch(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') id: string,
  ): Promise<MatchDto> {
    return this.matchesService.joinMatch(req.user.id, id);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a match' })
  @ApiResponse({
    status: 200,
    description: 'Left match successfully',
    type: MatchDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async leaveMatch(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') id: string,
  ): Promise<MatchDto> {
    return this.matchesService.leaveMatch(req.user.id, id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a match' })
  @ApiResponse({ status: 200, description: 'Match started successfully', type: MatchDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async startMatch(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') id: string,
  ): Promise<MatchDto> {
    return this.matchesService.startMatch(req.user.id, id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a match' })
  @ApiResponse({ status: 200, description: 'Match completed successfully', type: MatchDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async completeMatch(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') id: string,
  ): Promise<MatchDto> {
    return this.matchesService.completeMatch(req.user.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a match' })
  @ApiResponse({ status: 200, description: 'Match cancelled successfully', type: MatchDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async cancelMatch(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') id: string,
  ): Promise<MatchDto> {
    return this.matchesService.cancelMatch(req.user.id, id);
  }

  @Post(':id/score')
  @ApiOperation({ summary: 'Record a score for a hole' })
  @ApiResponse({
    status: 200,
    description: 'Score recorded successfully',
    type: MatchScoresDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async recordScore(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') id: string,
    @Body() recordScoreDto: RecordScoreDto,
  ): Promise<MatchScoresDto> {
    return this.matchesService.recordScore(req.user.id, id, recordScoreDto);
  }

  @Get(':id/scores')
  @ApiOperation({ summary: 'Get match scores' })
  @ApiResponse({
    status: 200,
    description: 'Match scores retrieved successfully',
    type: MatchScoresDto,
  })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async getMatchScores(@Param('id') id: string): Promise<MatchScoresDto> {
    return this.matchesService.getMatchScores(id);
  }

  @Get(':matchID/scorecard')
  @ApiOperation({ summary: 'Get match scorecard' })
  @ApiResponse({ status: 200, description: 'Match scorecard' })
  async getMatchScorecard(@Param('matchID') matchID: string) {
    return this.matchesService.getMatchScorecard(matchID);
  }

  @Post('join-by-code')
  @ApiOperation({ summary: 'Join a match using join code' })
  @ApiResponse({
    status: 200,
    description: 'Joined match successfully',
    type: MatchDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  async joinByCode(
    @Request() req: ExpressRequest & { user: any },
    @Body() joinByCodeDto: JoinByCodeDto,
  ): Promise<MatchDto> {
    return this.matchesService.joinByCode(req.user.id, joinByCodeDto.join_code);
  }

  @Get('courses/search')
  @ApiOperation({ summary: 'Search for golf courses' })
  @ApiResponse({
    status: 200,
    description: 'Course search results',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchCourses(
    @Query('q') query: string,
    @Query('state') state?: string,
    @Query('city') city?: string,
  ) {
    return this.matchesService.searchCourses(query, state, city);
  }

  @Get('courses/:courseID')
  @ApiOperation({ summary: 'Get course details' })
  @ApiResponse({
    status: 200,
    description: 'Course details',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCourseDetails(@Param('courseID') courseID: string) {
    return this.matchesService.getCourseDetails(courseID);
  }

  @Get('courses/:courseID/tees')
  @ApiOperation({ summary: 'List all tees for a course' })
  @ApiResponse({ status: 200, description: 'List of tees' })
  async listTees(@Param('courseID') courseID: string) {
    return this.matchesService.listTees(courseID);
  }

  @Get('courses/:courseID/tees/:teeID')
  @ApiOperation({ summary: 'Get details for a specific tee' })
  @ApiResponse({ status: 200, description: 'Tee details' })
  async getTeeDetails(@Param('courseID') courseID: string, @Param('teeID') teeID: string) {
    return this.matchesService.getTeeDetails(courseID, teeID);
  }

  @Get('clubs/search')
  @ApiOperation({ summary: 'Search for golf clubs' })
  @ApiResponse({ status: 200, description: 'Club search results' })
  async searchClubs(@Query('q') query: string, @Query('city') city?: string, @Query('state') state?: string) {
    return this.matchesService.searchClubs(query, city, state);
  }

  @Get('clubs/:clubID')
  @ApiOperation({ summary: 'Get club details' })
  @ApiResponse({ status: 200, description: 'Club details' })
  async getClubDetails(@Param('clubID') clubID: string) {
    return this.matchesService.getClubDetails(clubID);
  }
} 