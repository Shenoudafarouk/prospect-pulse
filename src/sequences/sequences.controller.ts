import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SequencesService } from './sequences.service.js';
import { GenerateSequenceDto } from './dto/generate-sequence.dto.js';

@ApiTags('Sequences')
@Controller()
export class SequencesController {
  constructor(private readonly sequencesService: SequencesService) {}

  @Post('generate-sequence')
  @ApiOperation({ summary: 'Generate a personalized messaging sequence' })
  @ApiBody({ type: GenerateSequenceDto })
  @ApiResponse({
    status: 201,
    description: 'Sequence generated successfully',
    schema: {
      example: {
        sequence_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'completed',
        prospect: {
          name: 'John Doe',
          headline: 'VP of Sales at TechCorp',
          analysis: {
            industry_insights:
              'SaaS sales leadership role in a scaling company...',
            pain_points: ['Pipeline visibility at scale', 'SDR ramp time'],
            talking_points: [
              'Hiring SDRs suggests growth phase',
              'Posted about pipeline quality',
            ],
            communication_style_recommendation:
              'Direct, data-driven approach befitting a VP-level buyer.',
          },
        },
        tov_summary:
          'Use a formal, personable tone with a direct messaging style.',
        messages: [
          {
            step: 1,
            channel: 'linkedin_connection',
            subject: null,
            body: 'Hi John, ...',
            signals_used: ['VP Sales at TechCorp', 'Hiring SDRs'],
            personalization_rationale:
              'Opened with scaling/pipeline angle because he leads sales and is actively hiring.',
            assumptions: ['Likely owns tooling decisions for sales ops'],
            risk_checks: ['No sensitive inference', 'No unverifiable claims'],
            confidence_score: 0.85,
          },
        ],
        overall_confidence: 0.82,
        generation_metadata: {
          model: 'gpt-4o-mini',
          total_tokens: 1523,
          estimated_cost: 0.00023,
          latency_ms: 2100,
          phases: 2,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 502, description: 'AI provider error' })
  generate(@Body() dto: GenerateSequenceDto) {
    return this.sequencesService.generate(dto);
  }

  @Get('sequences/:id')
  @ApiOperation({ summary: 'Retrieve a stored sequence by ID' })
  @ApiResponse({ status: 200, description: 'Sequence found' })
  @ApiResponse({ status: 404, description: 'Sequence not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.sequencesService.findById(id);
  }
}
