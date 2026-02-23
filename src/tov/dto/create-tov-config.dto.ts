/* eslint-disable @typescript-eslint/no-unsafe-call -- class-validator decorators have unresolved types in this env */
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTovConfigDto {
  @ApiPropertyOptional({ example: 'Professional Warm' })
  @IsOptional()
  @IsString()
  name?: string;

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

  @ApiPropertyOptional({ example: {} })
  @IsOptional()
  @IsObject()
  extraParams?: Record<string, unknown>;
}
