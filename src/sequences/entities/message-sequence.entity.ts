import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Prospect } from '../../prospects/entities/prospect.entity.js';
import { TovConfig } from '../../tov/entities/tov-config.entity.js';
import { SequenceMessage } from './sequence-message.entity.js';
import { AiGeneration } from '../../ai/entities/ai-generation.entity.js';
import { SequenceStatus } from '../enums/sequence-status.enum.js';

@Entity('message_sequences')
export class MessageSequence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'prospect_id' })
  prospectId!: string;

  @Index()
  @Column({ type: 'uuid', name: 'tov_config_id' })
  tovConfigId!: string;

  @Column({ type: 'text', name: 'company_context' })
  companyContext!: string;

  @Column({ type: 'int', name: 'sequence_length' })
  sequenceLength!: number;

  @Column({
    type: 'enum',
    enum: SequenceStatus,
    default: SequenceStatus.PENDING,
  })
  status!: SequenceStatus;

  @Column({ type: 'jsonb', nullable: true, name: 'prospect_analysis' })
  prospectAnalysis!: Record<string, unknown> | null;

  @Column({ type: 'float', nullable: true, name: 'overall_confidence' })
  overallConfidence!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Prospect, (prospect) => prospect.sequences, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'prospect_id' })
  prospect!: Prospect;

  @ManyToOne(() => TovConfig, (tov) => tov.sequences, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tov_config_id' })
  tovConfig!: TovConfig;

  @OneToMany(() => SequenceMessage, (msg) => msg.sequence)
  messages!: SequenceMessage[];

  @OneToMany(() => AiGeneration, (gen) => gen.sequence)
  generations!: AiGeneration[];
}
