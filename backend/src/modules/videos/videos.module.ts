import { Module } from '@nestjs/common';
import { VideoRepository } from './entity/video.repository';
import { VideosService } from './service/videos.service';

@Module({
  providers: [VideoRepository, VideosService],
  exports: [VideosService],
})
export class VideosModule {}
