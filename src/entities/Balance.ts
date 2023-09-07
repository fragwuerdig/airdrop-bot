// src/entities/Balance.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Snapshot } from './Snapshot';

@Entity()
export class Balance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column('bigint')
  balance: number;

  @ManyToOne(() => Snapshot, snapshot => snapshot.balances)
  snapshot: Snapshot;
}
