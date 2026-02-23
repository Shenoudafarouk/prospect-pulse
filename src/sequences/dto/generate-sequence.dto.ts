/* eslint-disable @typescript-eslint/no-unsafe-call -- class-validator decorators have unresolved types in this env */
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TovConfigInput {
  @ApiProperty({ example: 0.8, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  formality!: number;

  @ApiProperty({ example: 0.6, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  warmth!: number;

  @ApiProperty({ example: 0.7, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  directness!: number;

  @ApiPropertyOptional({ example: 0.4, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  humor?: number;

  @ApiPropertyOptional({ example: 0.5, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  technicality?: number;
}

export class GenerateSequenceDto {
  @ApiProperty({ example: 'https://linkedin.com/in/john-doe' })
  @IsUrl({}, { message: 'prospect_url must be a valid URL' })
  prospect_url!: string;

  @ApiProperty({ type: TovConfigInput })
  @ValidateNested()
  @Type(() => TovConfigInput)
  tov_config!: TovConfigInput;

  @ApiProperty({ example: 'We help SaaS companies automate sales' })
  @IsString()
  company_context!: string;

  @ApiProperty({ example: 3, minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  sequence_length!: number;
}
