import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GolfCourseDto, GolfClubDto, GolfTeeDto } from './dto/golf.dto';

@Injectable()
export class GolfService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.golfapi.io/api/v2.3';

  constructor(private configService: ConfigService) {
    this.apiKey = 'ec0b1d81-c28f-4274-b645-ba4d701507cb'; // TODO: Move to environment variables
  }

  async getCourse(courseID: string): Promise<GolfCourseDto> {
    try {
      const response = await fetch(`${this.baseUrl}/courses/${courseID}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new HttpException(`Failed to fetch course: ${response.statusText}`, HttpStatus.BAD_REQUEST);
      }

      const data = await response.json();
      
      if (data.message === 'Invalid API key') {
        throw new HttpException('Invalid Golf API key', HttpStatus.UNAUTHORIZED);
      }

      return data as GolfCourseDto;
    } catch (error) {
      console.error('Golf API error:', error);
      throw new HttpException('Failed to fetch course data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getClub(clubID: string): Promise<GolfClubDto> {
    try {
      const response = await fetch(`${this.baseUrl}/clubs/${clubID}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new HttpException(`Failed to fetch club: ${response.statusText}`, HttpStatus.BAD_REQUEST);
      }

      const data = await response.json();
      
      if (data.message === 'Invalid API key') {
        throw new HttpException('Invalid Golf API key', HttpStatus.UNAUTHORIZED);
      }

      return data as GolfClubDto;
    } catch (error) {
      console.error('Golf API error:', error);
      throw new HttpException('Failed to fetch club data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  getTeeByID(course: GolfCourseDto, teeID: string): GolfTeeDto | null {
    return course.tees.find(tee => tee.teeID === teeID) || null;
  }

  getParForHole(course: GolfCourseDto, holeNumber: number, useWomen: boolean = false): number {
    const pars = useWomen ? course.parsWomen : course.parsMen;
    return pars[holeNumber - 1] || 4; // Default to par 4 if not found
  }

  getHandicapForHole(course: GolfCourseDto, holeNumber: number, useWomen: boolean = false): number {
    const indexes = useWomen ? course.indexesWomen : course.indexesMen;
    return indexes[holeNumber - 1] || 1; // Default to 1 if not found
  }

  getDistanceForHole(tee: GolfTeeDto, holeNumber: number): number {
    const lengthKey = `length${holeNumber}` as keyof GolfTeeDto;
    return (tee[lengthKey] as number) || 0;
  }

  // Helper method to create course summary for match creation
  createCourseSummary(course: GolfCourseDto, tee: GolfTeeDto): {
    courseName: string;
    clubName: string;
    location: string;
    teeName: string;
    courseRating: number;
    slope: number;
  } {
    return {
      courseName: course.courseName,
      clubName: course.clubName,
      location: `${course.city}, ${course.state}`,
      teeName: tee.teeName,
      courseRating: tee.courseRatingMen,
      slope: tee.slopeMen,
    };
  }
} 