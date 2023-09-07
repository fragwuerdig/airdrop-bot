// src/entities/Snapshot.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Balance } from './Balance';

@Entity()
export class Snapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @OneToMany(() => Balance, balance => balance.snapshot, {cascade : true})
  balances: Balance[];
}
