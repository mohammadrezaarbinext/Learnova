import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../core/entity/base.entity';

export const FileType = {
  VIDEO: 'video',
  IMAGE: 'image',
  FILE: 'file',
} as const;

export type FileType = (typeof FileType)[keyof typeof FileType];

export const FileVisibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;

export type FileVisibility = (typeof FileVisibility)[keyof typeof FileVisibility];

@Entity('File')
export class FileEntity extends BaseEntity {
  @Column({ length: 1024 })
  path!: string | null;

  @Column({ length: 255 })
  originalName!: string;

  @Column({ length: 120 })
  mimeType!: string;

  @Column({ type: 'bigint' })
  size!: bigint;

  @Index()
  @Column({ type: 'enum', enum: Object.values(FileType) })
  type!: FileType;

  @Index()
  @Column({ type: 'enum', enum: Object.values(FileVisibility) })
  visibility!: FileVisibility;

  @Index()
  @Column({ nullable: true, type: 'int' })
  ownerUserId!: number | null;

  @Index()
  @Column({ nullable: true, type: 'int' })
  courseId!: number | null;
}

export type FileResponseEntity = {
  uuid: string;
  type: FileType;
  visibility: FileVisibility;
  url: string;
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
};
