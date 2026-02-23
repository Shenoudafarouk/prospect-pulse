import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MessageSequence } from '../../sequences/entities/message-sequence.entity.js';

@Entity('tov_configs')
export class TovConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'float' })
  formality!: number;

  @Column({ type: 'float' })
  warmth!: number;

  @Column({ type: 'float' })
  directness!: number;

  @Column({ type: 'float', nullable: true })
  humor!: number | null;

  @Column({ type: 'float', nullable: true })
  technicality!: number | null;

  @Column({ type: 'jsonb', nullable: true, name: 'extra_params' })
  extraParams!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => MessageSequence, (seq) => seq.tovConfig)
  sequences!: MessageSequence[];
}
