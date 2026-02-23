import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { MessageSequence } from '../../sequences/entities/message-sequence.entity.js';
import { GenerationStatus } from '../enums/generation-status.enum.js';

@Entity('ai_generations')
export class AiGeneration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true, name: 'sequence_id' })
  sequenceId!: string | null;

  @Column({ type: 'varchar', length: 100 })
  model!: string;

  @Column({ type: 'varchar', length: 100 })
  provider!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'prompt_version',
  })
  promptVersion!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'request_hash' })
  requestHash!: string | null;

  @Column({ type: 'int', nullable: true, name: 'prompt_tokens' })
  promptTokens!: number | null;

  @Column({ type: 'int', nullable: true, name: 'completion_tokens' })
  completionTokens!: number | null;

  @Column({ type: 'int', nullable: true, name: 'total_tokens' })
  totalTokens!: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 6,
    nullable: true,
    name: 'estimated_cost',
  })
  estimatedCost!: string | null;

  @Column({ type: 'int', nullable: true, name: 'latency_ms' })
  latencyMs!: number | null;

  @Column({ type: 'enum', enum: GenerationStatus })
  status!: GenerationStatus;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage!: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'request_payload' })
  requestPayload!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'response_payload' })
  responsePayload!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => MessageSequence, (seq) => seq.generations, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'sequence_id' })
  sequence!: MessageSequence | null;
}
