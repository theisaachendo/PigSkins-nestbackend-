import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../shared/services/supabase.service';
import { 
  CreateMatchDto, 
  UpdateMatchDto, 
  MatchDto, 
  MatchPlayerDto, 
  MatchStatus, 
  PlayerStatus,
  MatchListResponseDto 
} from './dto/match.dto';
import { RecordScoreDto, MatchScoresDto, HoleDto, HoleScoreDto } from './dto/score.dto';
import { CreateMatchWithCourseDto } from './dto/golf.dto';
import { GolfService } from './golf.service';

@Injectable()
export class MatchesService {
  constructor(
    private supabaseService: SupabaseService,
    private golfService: GolfService,
  ) {}

  async createMatchWithCourse(userId: string, createMatchDto: CreateMatchWithCourseDto): Promise<MatchDto> {
    const { data: user, error: userError } = await this.supabaseService.getUserById(userId);
    if (userError || !user) {
      throw new UnauthorizedException('User not found');
    }

    // Fetch course data from Golf API
    const course = await this.golfService.getCourse(createMatchDto.courseID);
    const tee = this.golfService.getTeeByID(course, createMatchDto.teeID);
    
    if (!tee) {
      throw new BadRequestException('Invalid tee selection');
    }

    // Create course summary
    const courseSummary = this.golfService.createCourseSummary(course, tee);

    // Generate unique 6-digit join code
    const joinCode = this.generateJoinCode();

    const matchData = {
      host_id: userId,
      course_name: `${courseSummary.courseName} - ${courseSummary.teeName}`,
      date: createMatchDto.date,
      time: createMatchDto.time,
      max_players: createMatchDto.max_players,
      entry_fee: createMatchDto.entry_fee,
      game_type: createMatchDto.game_type,
      location: courseSummary.location,
      rules: createMatchDto.rules,
      join_code: joinCode,
      status: MatchStatus.CREATED,
    };

    const { data: match, error: matchError } = await this.supabaseService.getClient()
      .from('matches')
      .insert([matchData])
      .select()
      .single();

    if (matchError) {
      console.error('Create match error:', matchError);
      throw new BadRequestException(matchError.message || matchError.details || matchError.hint || 'Failed to create match');
    }

    // Add host as first player
    const playerData = {
      match_id: match.id,
      user_id: userId,
      status: PlayerStatus.JOINED,
      entry_fee_paid: false,
    };

    const { error: playerError } = await this.supabaseService.getClient()
      .from('match_players')
      .insert([playerData]);

    if (playerError) {
      console.error('Add host to match error:', playerError);
      // Continue anyway, the match was created
    }

    // Create holes for the match using real course data
    await this.createHolesForMatch(match.id, course, tee);

    return this.getMatchById(match.id);
  }

  async createMatch(userId: string, createMatchDto: CreateMatchDto): Promise<MatchDto> {
    const { data: user, error: userError } = await this.supabaseService.getUserById(userId);
    if (userError || !user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate unique 6-digit join code
    const joinCode = this.generateJoinCode();

    const matchData = {
      host_id: userId,
      course_name: createMatchDto.course_name,
      date: createMatchDto.date,
      time: createMatchDto.time,
      max_players: createMatchDto.max_players,
      entry_fee: createMatchDto.entry_fee,
      game_type: createMatchDto.game_type,
      location: createMatchDto.location,
      rules: createMatchDto.rules,
      join_code: joinCode,
      status: MatchStatus.CREATED,
    };

    const { data: match, error: matchError } = await this.supabaseService.getClient()
      .from('matches')
      .insert([matchData])
      .select()
      .single();

    if (matchError) {
      console.error('Create match error:', matchError);
      throw new BadRequestException(matchError.message || matchError.details || matchError.hint || 'Failed to create match');
    }

    // Add host as first player
    const playerData = {
      match_id: match.id,
      user_id: userId,
      status: PlayerStatus.JOINED,
      entry_fee_paid: false,
    };

    const { error: playerError } = await this.supabaseService.getClient()
      .from('match_players')
      .insert([playerData]);

    if (playerError) {
      console.error('Add host to match error:', playerError);
      // Continue anyway, the match was created
    }

    return this.getMatchById(match.id);
  }

  async getMatches(
    page: number = 1,
    limit: number = 10,
    status?: MatchStatus,
    date?: string
  ): Promise<MatchListResponseDto> {
    // Ensure page and limit are numbers and have defaults
    page = page ? Number(page) : 1;
    limit = limit ? Number(limit) : 10;

    let query = this.supabaseService.getClient()
      .from('matches')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('date', date);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: matches, error, count } = await query;

    if (error) {
      console.error('Get matches error:', error);
      throw new BadRequestException('Failed to get matches');
    }

    // Get players for each match separately to avoid foreign key issues
    const matchesWithPlayers = await Promise.all(
      matches.map(async (match) => {
        const { data: players, error: playersError } = await this.supabaseService.getClient()
          .from('match_players')
          .select(`
            id,
            user_id,
            status,
            entry_fee_paid,
            joined_at,
            user:users(name, avatar_url, handicap)
          `)
          .eq('match_id', match.id);

        if (playersError) {
          console.error('Get players error:', playersError);
          return this.formatMatchResponse({ ...match, players: [] });
        }

        return this.formatMatchResponse({ ...match, players });
      })
    );

    return {
      matches: matchesWithPlayers,
      total: count || 0,
      page,
      limit,
    };
  }

  async getMatchById(matchId: string): Promise<MatchDto> {
    const { data: match, error } = await this.supabaseService.getClient()
      .from('matches')
      .select(`
        *,
        host:users!matches_host_id_fkey(name),
        players:match_players(
          id,
          user_id,
          status,
          entry_fee_paid,
          joined_at,
          user:users(name, avatar_url, handicap)
        )
      `)
      .eq('id', matchId)
      .single();

    if (error || !match) {
      throw new NotFoundException('Match not found');
    }

    return this.formatMatchResponse(match);
  }

  async updateMatch(userId: string, matchId: string, updateMatchDto: UpdateMatchDto): Promise<MatchDto> {
    // Check if user is the host
    const { data: match, error: matchError } = await this.supabaseService.getClient()
      .from('matches')
      .select('host_id, status')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      throw new NotFoundException('Match not found');
    }

    if (match.host_id !== userId) {
      throw new UnauthorizedException('Only the host can update the match');
    }

    if (match.status !== MatchStatus.CREATED) {
      throw new BadRequestException('Cannot update match that is not in created status');
    }

    const { data: updatedMatch, error: updateError } = await this.supabaseService.getClient()
      .from('matches')
      .update(updateMatchDto)
      .eq('id', matchId)
      .select()
      .single();

    if (updateError) {
      console.error('Update match error:', updateError);
      throw new BadRequestException('Failed to update match');
    }

    return this.getMatchById(matchId);
  }

  async deleteMatch(userId: string, matchId: string): Promise<{ message: string }> {
    // Check if user is the host
    const { data: match, error: matchError } = await this.supabaseService.getClient()
      .from('matches')
      .select('host_id, status')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      throw new NotFoundException('Match not found');
    }

    if (match.host_id !== userId) {
      throw new UnauthorizedException('Only the host can delete the match');
    }

    if (match.status !== MatchStatus.CREATED) {
      throw new BadRequestException('Cannot delete match that is not in created status');
    }

    const { error: deleteError } = await this.supabaseService.getClient()
      .from('matches')
      .delete()
      .eq('id', matchId);

    if (deleteError) {
      console.error('Delete match error:', deleteError);
      throw new BadRequestException('Failed to delete match');
    }

    return { message: 'Match deleted successfully' };
  }

  async joinMatch(userId: string, matchId: string): Promise<MatchDto> {
    // Check if match exists and has space
    const { data: match, error: matchError } = await this.supabaseService.getClient()
      .from('matches')
      .select('max_players, status')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.CREATED) {
      throw new BadRequestException('Cannot join match that is not in created status');
    }

    // Check current player count
    const { data: players, error: playersError } = await this.supabaseService.getClient()
      .from('match_players')
      .select('id')
      .eq('match_id', matchId)
      .eq('status', PlayerStatus.JOINED);

    if (playersError) {
      console.error('Get players error:', playersError);
      throw new BadRequestException('Failed to get match players');
    }

    if (players.length >= match.max_players) {
      throw new BadRequestException('Match is full');
    }

    // Check if user is already in the match
    const { data: existingPlayer, error: existingError } = await this.supabaseService.getClient()
      .from('match_players')
      .select('id, status')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single();

    if (existingPlayer) {
      if (existingPlayer.status === PlayerStatus.JOINED) {
        throw new BadRequestException('Already joined this match');
      } else if (existingPlayer.status === PlayerStatus.LEFT) {
        // Rejoin the match
        const { error: rejoinError } = await this.supabaseService.getClient()
          .from('match_players')
          .update({ status: PlayerStatus.JOINED })
          .eq('id', existingPlayer.id);

        if (rejoinError) {
          console.error('Rejoin match error:', rejoinError);
          throw new BadRequestException('Failed to rejoin match');
        }
      }
    } else {
      // Join the match
      const playerData = {
        match_id: matchId,
        user_id: userId,
        status: PlayerStatus.JOINED,
        entry_fee_paid: false,
      };

      const { error: joinError } = await this.supabaseService.getClient()
        .from('match_players')
        .insert([playerData]);

      if (joinError) {
        console.error('Join match error:', joinError);
        throw new BadRequestException('Failed to join match');
      }
    }

    return this.getMatchById(matchId);
  }

  async leaveMatch(userId: string, matchId: string): Promise<MatchDto> {
    // Check if user is in the match
    const { data: player, error: playerError } = await this.supabaseService.getClient()
      .from('match_players')
      .select('id, status')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single();

    if (playerError || !player) {
      throw new NotFoundException('Not a member of this match');
    }

    if (player.status !== PlayerStatus.JOINED) {
      throw new BadRequestException('Not currently joined to this match');
    }

    // Check if user is the host
    const { data: match, error: matchError } = await this.supabaseService.getClient()
      .from('matches')
      .select('host_id')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      throw new NotFoundException('Match not found');
    }

    if (match.host_id === userId) {
      throw new BadRequestException('Host cannot leave the match. Transfer ownership or delete the match.');
    }

    const { error: leaveError } = await this.supabaseService.getClient()
      .from('match_players')
      .update({ status: PlayerStatus.LEFT })
      .eq('id', player.id);

    if (leaveError) {
      console.error('Leave match error:', leaveError);
      throw new BadRequestException('Failed to leave match');
    }

    return this.getMatchById(matchId);
  }

  async startMatch(userId: string, matchId: string): Promise<MatchDto> {
    // Only host can start, and only if status is 'created'
    const { data: match, error } = await this.supabaseService.getClient()
      .from('matches')
      .select('host_id, status')
      .eq('id', matchId)
      .single();
    if (error || !match) throw new NotFoundException('Match not found');
    if (match.host_id !== userId) throw new UnauthorizedException('Only the host can start the match');
    if (match.status !== MatchStatus.CREATED) throw new BadRequestException('Match must be in created status to start');
    const { error: updateError } = await this.supabaseService.getClient()
      .from('matches')
      .update({ status: MatchStatus.ACTIVE })
      .eq('id', matchId);
    if (updateError) throw new BadRequestException('Failed to start match');
    return this.getMatchById(matchId);
  }

  async completeMatch(userId: string, matchId: string): Promise<MatchDto> {
    // Only host can complete, and only if status is 'active'
    const { data: match, error } = await this.supabaseService.getClient()
      .from('matches')
      .select('host_id, status')
      .eq('id', matchId)
      .single();
    if (error || !match) throw new NotFoundException('Match not found');
    if (match.host_id !== userId) throw new UnauthorizedException('Only the host can complete the match');
    if (match.status !== MatchStatus.ACTIVE) throw new BadRequestException('Match must be active to complete');
    const { error: updateError } = await this.supabaseService.getClient()
      .from('matches')
      .update({ status: MatchStatus.COMPLETED })
      .eq('id', matchId);
    if (updateError) throw new BadRequestException('Failed to complete match');
    return this.getMatchById(matchId);
  }

  async cancelMatch(userId: string, matchId: string): Promise<MatchDto> {
    // Only host can cancel, and only if status is 'created' or 'active'
    const { data: match, error } = await this.supabaseService.getClient()
      .from('matches')
      .select('host_id, status')
      .eq('id', matchId)
      .single();
    if (error || !match) throw new NotFoundException('Match not found');
    if (match.host_id !== userId) throw new UnauthorizedException('Only the host can cancel the match');
    if (![MatchStatus.CREATED, MatchStatus.ACTIVE].includes(match.status)) throw new BadRequestException('Match can only be cancelled if created or active');
    const { error: updateError } = await this.supabaseService.getClient()
      .from('matches')
      .update({ status: MatchStatus.CANCELLED })
      .eq('id', matchId);
    if (updateError) throw new BadRequestException('Failed to cancel match');
    return this.getMatchById(matchId);
  }

  async recordScore(userId: string, matchId: string, recordScoreDto: RecordScoreDto): Promise<MatchScoresDto> {
    const { hole_number, score, par } = recordScoreDto;

    // Check if match exists and is active
    const { data: match, error: matchError } = await this.supabaseService.getClient()
      .from('matches')
      .select('id, status, entry_fee')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.ACTIVE) {
      throw new BadRequestException('Can only record scores for active matches');
    }

    // Check if user is a player in the match
    const { data: player, error: playerError } = await this.supabaseService.getClient()
      .from('match_players')
      .select('id')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .eq('status', PlayerStatus.JOINED)
      .single();

    if (playerError || !player) {
      throw new UnauthorizedException('You must be a player in this match to record scores');
    }

    // Get or create the hole
    let { data: hole, error: holeError } = await this.supabaseService.getClient()
      .from('holes')
      .select('id')
      .eq('match_id', matchId)
      .eq('hole_number', hole_number)
      .single();

    if (holeError) {
      // Create the hole if it doesn't exist
      const { data: newHole, error: createHoleError } = await this.supabaseService.getClient()
        .from('holes')
        .insert([{
          match_id: matchId,
          hole_number,
          par,
          skin_value: match.entry_fee, // Basic skin value
          carryover_from_previous: false,
          completed: false,
        }])
        .select()
        .single();

      if (createHoleError) {
        console.error('Create hole error:', createHoleError);
        throw new BadRequestException('Failed to create hole');
      }
      hole = newHole;
    }

    if (!hole) {
      throw new BadRequestException('Failed to get or create hole');
    }

    // Check if score already exists for this user and hole
    const { data: existingScore, error: scoreCheckError } = await this.supabaseService.getClient()
      .from('hole_scores')
      .select('id')
      .eq('hole_id', hole.id)
      .eq('user_id', userId)
      .single();

    if (existingScore) {
      throw new BadRequestException('Score already recorded for this hole');
    }

    // Record the score
    const { data: scoreRecord, error: scoreError } = await this.supabaseService.getClient()
      .from('hole_scores')
      .insert([{
        hole_id: hole.id,
        user_id: userId,
        score,
        is_skin_winner: false, // Will be calculated below
      }])
      .select()
      .single();

    if (scoreError) {
      console.error('Record score error:', scoreError);
      throw new BadRequestException('Failed to record score');
    }

    // Calculate skins for this hole
    await this.calculateSkinsForHole(hole.id);

    return this.getMatchScores(matchId);
  }

  async getMatchScores(matchId: string): Promise<MatchScoresDto> {
    // Get match details
    const { data: match, error: matchError } = await this.supabaseService.getClient()
      .from('matches')
      .select('id, status, entry_fee')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      throw new NotFoundException('Match not found');
    }

    // Get all holes for the match
    const { data: holes, error: holesError } = await this.supabaseService.getClient()
      .from('holes')
      .select('*')
      .eq('match_id', matchId)
      .order('hole_number');

    if (holesError) {
      console.error('Get holes error:', holesError);
      throw new BadRequestException('Failed to get match holes');
    }

    // Get scores for each hole
    const holesWithScores = await Promise.all(
      holes.map(async (hole) => {
        const { data: scores, error: scoresError } = await this.supabaseService.getClient()
          .from('hole_scores')
          .select(`
            id,
            user_id,
            score,
            is_skin_winner,
            recorded_at,
            user:users(name)
          `)
          .eq('hole_id', hole.id);

        if (scoresError) {
          console.error('Get scores error:', scoresError);
          return this.formatHoleResponse(hole, []);
        }

        const formattedScores: HoleScoreDto[] = scores.map((score: any) => ({
          id: score.id,
          hole_id: hole.id,
          user_id: score.user_id,
          user_name: score.user?.name || 'Unknown',
          score: score.score,
          is_skin_winner: score.is_skin_winner,
          recorded_at: score.recorded_at,
        }));

        return this.formatHoleResponse(hole, formattedScores);
      })
    );

    const completedHoles = holesWithScores.filter(h => h.completed).length;
    const totalSkins = holesWithScores.reduce((total, hole) => {
      return total + hole.scores.filter(s => s.is_skin_winner).length;
    }, 0);

    return {
      match_id: matchId,
      match_status: match.status,
      holes: holesWithScores,
      total_skins: totalSkins,
      completed_holes: completedHoles,
    };
  }

  async getMatchScorecard(matchID: string) {
    // Fetch match
    const { data: match, error: matchError } = await this.supabaseService.getClient()
      .from('matches')
      .select('*')
      .eq('id', matchID)
      .single();
    if (matchError || !match) {
      throw new BadRequestException('Match not found');
    }

    // Fetch holes
    const { data: holes, error: holesError } = await this.supabaseService.getClient()
      .from('holes')
      .select('*')
      .eq('match_id', matchID)
      .order('hole_number', { ascending: true });
    if (holesError) {
      throw new BadRequestException('Failed to fetch holes');
    }

    // Fetch players
    const { data: players, error: playersError } = await this.supabaseService.getClient()
      .from('match_players')
      .select('user_id')
      .eq('match_id', matchID);
    if (playersError) {
      throw new BadRequestException('Failed to fetch players');
    }

    // Fetch user details for all players
    const userIds = players.map(p => p.user_id);
    const { data: users, error: usersError } = await this.supabaseService.getClient()
      .from('users')
      .select('id, name')
      .in('id', userIds);
    if (usersError) {
      throw new BadRequestException('Failed to fetch user details');
    }

    // Create a map of user_id to user name
    const userMap = new Map(users.map(user => [user.id, user.name]));

    // Fetch scores
    const { data: scores, error: scoresError } = await this.supabaseService.getClient()
      .from('hole_scores')
      .select('*')
      .in('hole_id', holes.map(h => h.id));
    if (scoresError) {
      throw new BadRequestException('Failed to fetch scores');
    }

    // Build scorecard
    const scorecard = holes.map(hole => {
      const holeScores = players.map(player => {
        const score = scores.find(s => s.hole_id === hole.id && s.user_id === player.user_id);
        return {
          user_id: player.user_id,
          name: userMap.get(player.user_id) || 'Unknown Player',
          strokes: score ? score.score : null,
        };
      });
      return {
        hole_number: hole.hole_number,
        par: hole.par,
        distance: hole.distance || null,
        scores: holeScores,
      };
    });

    return {
      matchID,
      course_name: match.course_name,
      scorecard,
      message: 'Scorecard retrieved successfully',
    };
  }

  async joinByCode(userId: string, joinCode: string): Promise<MatchDto> {
    // Find match by join code
    const { data: match, error: matchError } = await this.supabaseService.getClient()
      .from('matches')
      .select('id, max_players, status')
      .eq('join_code', joinCode)
      .single();

    if (matchError || !match) {
      throw new NotFoundException('Match not found with this join code');
    }

    if (match.status !== MatchStatus.CREATED) {
      throw new BadRequestException('Cannot join match that is not in created status');
    }

    // Check current player count
    const { data: players, error: playersError } = await this.supabaseService.getClient()
      .from('match_players')
      .select('id')
      .eq('match_id', match.id)
      .eq('status', PlayerStatus.JOINED);

    if (playersError) {
      console.error('Get players error:', playersError);
      throw new BadRequestException('Failed to get match players');
    }

    if (players.length >= match.max_players) {
      throw new BadRequestException('Match is full');
    }

    // Check if user is already in the match
    const { data: existingPlayer, error: existingError } = await this.supabaseService.getClient()
      .from('match_players')
      .select('id, status')
      .eq('match_id', match.id)
      .eq('user_id', userId)
      .single();

    if (existingPlayer) {
      if (existingPlayer.status === PlayerStatus.JOINED) {
        throw new BadRequestException('Already joined this match');
      } else if (existingPlayer.status === PlayerStatus.LEFT) {
        // Rejoin the match
        const { error: rejoinError } = await this.supabaseService.getClient()
          .from('match_players')
          .update({ status: PlayerStatus.JOINED })
          .eq('id', existingPlayer.id);

        if (rejoinError) {
          console.error('Rejoin match error:', rejoinError);
          throw new BadRequestException('Failed to rejoin match');
        }
      }
    } else {
      // Join the match
      const playerData = {
        match_id: match.id,
        user_id: userId,
        status: PlayerStatus.JOINED,
        entry_fee_paid: false,
      };

      const { error: joinError } = await this.supabaseService.getClient()
        .from('match_players')
        .insert([playerData]);

      if (joinError) {
        console.error('Join match error:', joinError);
        throw new BadRequestException('Failed to join match');
      }
    }

    return this.getMatchById(match.id);
  }

  async getCourseDetails(courseID: string) {
    try {
      const course = await this.golfService.getCourse(courseID);
      return {
        course,
        message: 'Course details retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch course details');
    }
  }

  async searchCourses(query: string, state?: string, city?: string) {
    // For now, return a mock response since the Golf API doesn't have a search endpoint
    // In a real implementation, you'd call the Golf API search endpoint
    return {
      courses: [
        {
          courseID: '012141520658891108829',
          courseName: 'Pebble Beach',
          clubName: 'Pebble Beach Golf Links',
          city: 'Pebble Beach',
          state: 'CA',
          country: 'USA',
        },
        // Add more mock courses as needed
      ],
      message: 'Course search completed',
    };
  }

  async listTees(courseID: string) {
    const course = await this.golfService.getCourse(courseID);
    return {
      tees: course.tees,
      message: 'Tees listed successfully',
    };
  }

  async getTeeDetails(courseID: string, teeID: string) {
    const course = await this.golfService.getCourse(courseID);
    const tee = this.golfService.getTeeByID(course, teeID);
    if (!tee) {
      throw new BadRequestException('Tee not found');
    }
    return {
      tee,
      message: 'Tee details retrieved successfully',
    };
  }

  async searchClubs(query: string, city?: string, state?: string) {
    // Mock response since Golf API does not provide a search endpoint for clubs
    return {
      clubs: [
        {
          clubID: '141520610397251566',
          clubName: 'Pebble Beach Golf Links',
          city: 'Pebble Beach',
          state: 'CA',
          country: 'USA',
        },
        // Add more mock clubs as needed
      ],
      message: 'Club search completed',
    };
  }

  async getClubDetails(clubID: string) {
    const club = await this.golfService.getClub(clubID);
    return {
      club,
      message: 'Club details retrieved successfully',
    };
  }

  private generateJoinCode(): string {
    // Generate a random 6-digit number
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async calculateSkinsForHole(holeId: string): Promise<void> {
    // Get all scores for this hole
    const { data: scores, error: scoresError } = await this.supabaseService.getClient()
      .from('hole_scores')
      .select('id, score, user_id')
      .eq('hole_id', holeId);

    if (scoresError || !scores.length) {
      return;
    }

    // Find the lowest score (winner)
    const lowestScore = Math.min(...scores.map(s => s.score));
    const winners = scores.filter(s => s.score === lowestScore);

    // If there's a tie, no skin winner
    if (winners.length > 1) {
      // Mark hole as carryover
      await this.supabaseService.getClient()
        .from('holes')
        .update({ carryover_from_previous: true })
        .eq('id', holeId);
      return;
    }

    // Mark the winner
    await this.supabaseService.getClient()
      .from('hole_scores')
      .update({ is_skin_winner: true })
      .eq('id', winners[0].id);

    // Mark hole as completed
    await this.supabaseService.getClient()
      .from('holes')
      .update({ completed: true })
      .eq('id', holeId);
  }

  private async createHolesForMatch(matchId: string, course: any, tee: any): Promise<void> {
    const holes = [];
    
    for (let holeNumber = 1; holeNumber <= 18; holeNumber++) {
      const par = this.golfService.getParForHole(course, holeNumber);
      const distance = this.golfService.getDistanceForHole(tee, holeNumber);
      const handicap = this.golfService.getHandicapForHole(course, holeNumber);

      holes.push({
        match_id: matchId,
        hole_number: holeNumber,
        par: par,
        skin_value: 0, // Will be set when match starts
        carryover_from_previous: false,
        completed: false,
      });
    }

    const { error: holesError } = await this.supabaseService.getClient()
      .from('holes')
      .insert(holes);

    if (holesError) {
      console.error('Create holes error:', holesError);
      // Continue anyway, the match was created
    }
  }

  private formatMatchResponse(match: any): MatchDto {
    const players: MatchPlayerDto[] = match.players?.map((player: any) => ({
      id: player.id,
      user_id: player.user_id,
      name: player.user?.name || 'Unknown',
      avatar_url: player.user?.avatar_url,
      handicap: player.user?.handicap,
      status: player.status,
      entry_fee_paid: player.entry_fee_paid,
      joined_at: player.joined_at,
    })) || [];

    const currentPlayers = players.filter(p => p.status === PlayerStatus.JOINED).length;

    return {
      id: match.id,
      host_id: match.host_id,
      host_name: match.host?.name || 'Unknown',
      course_id: match.course_id,
      course_name: match.course_name,
      date: match.date,
      time: match.time,
      max_players: match.max_players,
      entry_fee: match.entry_fee,
      game_type: match.game_type,
      status: match.status,
      join_code: match.join_code,
      location: match.location,
      rules: match.rules,
      created_at: match.created_at,
      updated_at: match.updated_at,
      players,
      current_players: currentPlayers,
    };
  }

  private formatHoleResponse(hole: any, scores: HoleScoreDto[]): HoleDto {
    return {
      id: hole.id,
      hole_number: hole.hole_number,
      par: hole.par,
      skin_value: hole.skin_value,
      carryover_from_previous: hole.carryover_from_previous,
      completed: hole.completed,
      scores,
    };
  }
} 