/* eslint-disable @typescript-eslint/no-unsafe-call -- class-validator decorators have unresolved types in this env */
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  IsObject,
} from 'class-validator';

export class CreateTovConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  formality!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  warmth!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  directness!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  humor?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  technicality?: number;

  @IsOptional()
  @IsObject()
  extraParams: Record<string, unknown> = {};
}
