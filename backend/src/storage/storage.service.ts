import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, rename, unlink } from 'fs/promises';
import path from 'path';
import { AuthUser } from '../common/types/auth-user.type';
import { PrismaService } from '../infra/prisma/prisma.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileResponseEntity, FileType, FileVisibility } from './entities/file.entity';

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const FILE_MAX_BYTES = 100 * 1024 * 1024;
const VIDEO_MAX_BYTES = 500 * 1024 * 1024;

const ALLOWED_MIME_TYPES: Record<FileType, Set<string>> = {
  [FileType.VIDEO]: new Set(['video/mp4', 'video/webm', 'video/quicktime']),
  [FileType.IMAGE]: new Set(['image/jpeg', 'image/png', 'image/webp']),
  [FileType.FILE]: new Set([
    'application/pdf',
    'application/zip',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
};

const MAX_BYTES_BY_TYPE: Record<FileType, number> = {
  [FileType.IMAGE]: IMAGE_MAX_BYTES,
  [FileType.FILE]: FILE_MAX_BYTES,
  [FileType.VIDEO]: VIDEO_MAX_BYTES,
};

type UploadedDiskFile = {
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
};

type StoredFile = {
  id: number;
  uuid: string;
  path: string | null;
  originalName: string;
  mimeType: string;
  size: bigint;
  type: FileType;
  visibility: FileVisibility;
  ownerUserId: number | null;
  courseId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class StorageService {
  private readonly uploadDir: string;
  private readonly publicUploadBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.uploadDir = path.resolve(this.configService.get<string>('UPLOAD_DIR', './uploads'));
    this.publicUploadBaseUrl = this.configService
      .get<string>('PUBLIC_UPLOAD_BASE_URL', 'http://localhost:3001/api/uploads')
      .replace(/\/+$/g, '');
  }

  async uploadFile(dto: UploadFileDto, file: UploadedDiskFile | undefined, user: AuthUser) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      this.validateFile(file, dto.type);
      const courseId = await this.resolveCourseId(dto.courseId);
      const uuid = randomUUID();
      const relativePath = this.buildRelativePath(uuid, dto.type, file.originalname);
      const absolutePath = this.toAbsolutePath(relativePath);
      const visibility = dto.visibility ?? FileVisibility.PUBLIC;

      await mkdir(path.dirname(absolutePath), { recursive: true });
      await rename(file.path, absolutePath);

      const storedFile = await this.prisma.file.create({
        data: {
          uuid,
          path: relativePath,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: BigInt(file.size),
          type: dto.type,
          visibility,
          ownerUserId: user.id,
          courseId,
        },
      });

      return this.serializeFile(storedFile);
    } catch (error) {
      await this.removeTempFile(file.path);
      throw error;
    }
  }

  async createDownloadUrl(uuid: string, user: AuthUser, _asAttachment = false) {
    const file = await this.getFileOrThrow(uuid);
    await this.ensureCanRead(file, user);
    const serializedFile = this.serializeFile(file);

    return {
      url: serializedFile.url,
      expiresIn: null,
      file: serializedFile,
    };
  }

  async deleteFile(uuid: string, user: AuthUser) {
    const file = await this.getFileOrThrow(uuid);
    await this.ensureCanDelete(file, user);

    if (file.path) {
      await this.removeStoredFile(file.path);
    }
    await this.prisma.file.delete({ where: { uuid } });

    return { id: file.id, uuid: file.uuid, deleted: true };
  }

  private validateFile(file: UploadedDiskFile, type: FileType): void {
    const mimeType = file.mimetype.toLowerCase();
    if (!ALLOWED_MIME_TYPES[type].has(mimeType)) {
      throw new BadRequestException(`Unsupported ${type} MIME type`);
    }

    const maxBytes = MAX_BYTES_BY_TYPE[type];
    if (file.size > maxBytes) {
      throw new BadRequestException(`${type} size exceeds the ${this.formatBytes(maxBytes)} limit`);
    }
  }

  private async resolveCourseId(courseUuid?: string): Promise<number | null> {
    if (!courseUuid) {
      return null;
    }

    const course = await this.prisma.course.findUnique({
      where: { uuid: courseUuid },
      select: { id: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course.id;
  }

  private async ensureCanRead(file: StoredFile, user: AuthUser): Promise<void> {
    if (file.visibility === FileVisibility.PUBLIC || user.roles.includes('ADMIN') || file.ownerUserId === user.id) {
      return;
    }

    if (!file.courseId) {
      throw new ForbiddenException('You do not have access to this file');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: file.courseId },
      select: { teacherId: true },
    });

    if (course?.teacherId === user.id) {
      return;
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: user.id, courseId: file.courseId } },
      select: { id: true },
    });

    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course to access this file');
    }
  }

  private async ensureCanDelete(file: StoredFile, user: AuthUser): Promise<void> {
    if (user.roles.includes('ADMIN') || file.ownerUserId === user.id) {
      return;
    }

    if (file.courseId) {
      const course = await this.prisma.course.findUnique({
        where: { id: file.courseId },
        select: { teacherId: true },
      });
      if (course?.teacherId === user.id) {
        return;
      }
    }

    throw new ForbiddenException('You do not have access to delete this file');
  }

  private async getFileOrThrow(uuid: string): Promise<StoredFile> {
    const file = await this.prisma.file.findUnique({ where: { uuid } });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  private buildRelativePath(uuid: string, type: FileType, originalName: string): string {
    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');

    return `${type}/${year}/${month}/${uuid}-${this.safeFileName(originalName)}`;
  }

  private safeFileName(originalName: string): string {
    const basename = path.basename(originalName);
    const extension = path.extname(basename).toLowerCase();
    const name = basename.slice(0, basename.length - extension.length);
    const safeName = name
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '')
      .toLowerCase();
    const safeExtension = extension.replace(/[^.\w-]/g, '').toLowerCase();

    return `${safeName || 'file'}${safeExtension}`;
  }

  private toAbsolutePath(relativePath: string): string {
    return path.join(this.uploadDir, relativePath);
  }

  private getPublicUrl(relativePath: string): string {
    return `${this.publicUploadBaseUrl}/${relativePath.split('/').map(encodeURIComponent).join('/')}`;
  }

  private serializeFile(file: StoredFile): FileResponseEntity {
    if (!file.path) {
      throw new BadRequestException('Stored file has no local disk path');
    }

    return {
      uuid: file.uuid,
      type: file.type,
      visibility: file.visibility,
      url: this.getPublicUrl(file.path),
      path: this.toAbsolutePath(file.path),
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: Number(file.size),
    };
  }

  private async removeTempFile(filePath: string): Promise<void> {
    await unlink(filePath).catch(() => undefined);
  }

  private async removeStoredFile(relativePath: string): Promise<void> {
    await unlink(this.toAbsolutePath(relativePath)).catch(() => undefined);
  }

  private formatBytes(bytes: number): string {
    return `${bytes / (1024 * 1024)}MB`;
  }
}
