import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { MessageSequence } from './message-sequence.entity.js';

@Entity('sequence_messages')
export class SequenceMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'sequence_id' })
  sequenceId!: string;

  @Column({ type: 'int', name: 'step_number' })
  stepNumber!: number;

  @Column({ type: 'varchar', length: 100 })
  channel!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  subject!: string | null;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'jsonb', nullable: true, name: 'signals_used' })
  signalsUsed!: string[] | null;

  @Column({ type: 'text', nullable: true, name: 'personalization_rationale' })
  personalizationRationale!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  assumptions!: string[] | null;

  @Column({ type: 'jsonb', nullable: true, name: 'risk_checks' })
  riskChecks!: string[] | null;

  @Column({ type: 'float', nullable: true, name: 'confidence_score' })
  confidenceScore!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => MessageSequence, (seq) => seq.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sequence_id' })
  sequence!: MessageSequence;
}
