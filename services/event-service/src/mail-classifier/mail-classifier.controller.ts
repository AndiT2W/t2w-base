import { Body, Controller, Post } from "@nestjs/common";
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PrismaService } from "../prisma.service.js";
import { Roles } from "../authorization.js";
import {
  MailClassifierService,
  type MailClassificationInput,
  type MailEventCandidate,
} from "./mail-classifier.service.js";

export class MailEventCandidateDto implements MailEventCandidate {
  @IsString() eventCode!: string;
  @IsString() name!: string;
  @IsOptional() @IsISO8601() startAt?: string;
  @IsOptional() @IsISO8601() endAt?: string;
  @IsOptional() @IsString() location?: string | null;
  @IsOptional() @IsString() organizerName?: string | null;
  @IsOptional() @IsEmail() organizerEmail?: string | null;
  @IsOptional() @IsString() folderId?: string | null;
}

export class TestMailDto {
  @IsString() @MaxLength(320) from!: string;
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) to!: string[];
  @IsString() @MaxLength(500) subject!: string;
  @IsString() @MaxLength(50_000) body!: string;
  @IsOptional() @IsISO8601() receivedAt?: string;
}

export class TestMailClassificationDto {
  @ValidateNested() @Type(() => TestMailDto) mail!: TestMailDto;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MailEventCandidateDto)
  eventCandidates?: MailEventCandidateDto[];
}

@Controller("api/v1/mail-classifier")
@Roles("ADMIN", "USER")
export class MailClassifierController {
  constructor(
    private readonly classifier: MailClassifierService,
    private readonly prisma: PrismaService,
  ) {}

  /** Dry-run endpoint. It returns proposed Outlook changes and never mutates Outlook. */
  @Post("test")
  async test(@Body() dto: TestMailClassificationDto) {
    const eventCandidates = dto.eventCandidates?.length
      ? dto.eventCandidates
      : await this.defaultEventCandidates();
    const input: MailClassificationInput = {
      mail: dto.mail,
      eventCandidates,
    };
    return this.classifier.classify(input);
  }

  private async defaultEventCandidates(): Promise<MailEventCandidate[]> {
    const events = await this.prisma.event.findMany({
      where: { archived: false },
      orderBy: { startAt: "asc" },
      select: {
        eventCode: true,
        name: true,
        startAt: true,
        endAt: true,
        location: true,
        outlookFolderId: true,
        organizer: { select: { name: true, email: true } },
      },
      take: 500,
    });
    return events.map((event) => ({
      eventCode: event.eventCode,
      name: event.name,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      location: event.location,
      folderId: event.outlookFolderId,
      organizerName: event.organizer?.name,
      organizerEmail: event.organizer?.email,
    }));
  }
}
