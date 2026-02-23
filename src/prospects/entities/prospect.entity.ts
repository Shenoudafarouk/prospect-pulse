import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { MessageSequence } from '../../sequences/entities/message-sequence.entity.js';

@Entity('prospects')
export class Prospect {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 500, name: 'linkedin_url' })
  linkedinUrl!: string;

  @Column({ type: 'varchar', length: 255, name: 'full_name' })
  fullName!: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'headline' })
  headline!: string | null;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'current_company',
  })
  currentCompany!: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'current_title',
  })
  currentTitle!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'profile_data' })
  profileData!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => MessageSequence, (seq) => seq.prospect)
  sequences!: MessageSequence[];
}
