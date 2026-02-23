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

export class TovConfigInput {
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
}

export class GenerateSequenceDto {
  @IsUrl({}, { message: 'prospect_url must be a valid URL' })
  prospect_url!: string;

  @ValidateNested()
  @Type(() => TovConfigInput)
  tov_config!: TovConfigInput;

  @IsString()
  company_context!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  sequence_length!: number;
}
