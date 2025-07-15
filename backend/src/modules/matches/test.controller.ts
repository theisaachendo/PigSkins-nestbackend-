import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MatchesService } from './matches.service';

@ApiTags('Test')
@Controller('test')
export class TestController {
  constructor(private matchesService: MatchesService) {}

  @Get('golf-api')
  @ApiOperation({ summary: 'Test golf API connection' })
  @ApiResponse({ status: 200, description: 'Golf API test result' })
  async testGolfApi() {
    try {
      // Test with a known course ID (Pebble Beach)
      const course = await this.matchesService.getCourseDetails('012141520658891108829');
      return {
        success: true,
        message: 'Golf API is working correctly',
        course: {
          courseID: course.course.courseID,
          courseName: course.course.courseName,
          clubName: course.course.clubName,
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Golf API test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 