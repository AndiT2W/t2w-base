import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "./prisma.service.js";
import { CrmCommands, type CrmCommandResult } from "@t2w/domain/crm";
import {
  PrismaCrmCommandAdapter,
  type ContactInput,
  type CustomerProfileInput,
  type OrganizerInput,
} from "./crm-command.adapter.js";
import { SelectionLists } from "@t2w/domain/selection-lists";
import { PrismaSelectionListAdapter } from "./selection-list.adapter.js";

@ApiTags("master-data")
@Controller("api/v1")
export class MasterDataController {
  private readonly crm: CrmCommands<
    CustomerProfileInput,
    unknown,
    OrganizerInput,
    unknown,
    ContactInput,
    unknown
  >;
  private readonly selectionLists: SelectionLists;

  constructor(private readonly prisma: PrismaService) {
    this.crm = new CrmCommands(new PrismaCrmCommandAdapter(prisma));
    this.selectionLists = new SelectionLists(new PrismaSelectionListAdapter(prisma));
  }

  private unwrap(result: CrmCommandResult<unknown>) {
    if (result.kind === "saved") return result.value;
    if (result.reason === "NOT_FOUND") throw new NotFoundException(result.reason);
    throw new ConflictException(result.reason);
  }

  @Get("organizers") organizers() {
    return this.crm.organizers();
  }
  @Post("organizers") organizer(
    @Body()
    body: OrganizerInput,
  ) {
    return this.crm.createOrganizer(body).then((result) => this.unwrap(result));
  }
  @Patch("organizers/:id") organizerUpdate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    body: Partial<OrganizerInput>,
  ) {
    return this.crm.updateOrganizer(id, body).then((result) => this.unwrap(result));
  }
  @Patch("organizers/:id/deactivate") deactivateOrganizer(@Param("id", ParseUUIDPipe) id: string) {
    return this.crm.deactivateOrganizer(id).then((result) => this.unwrap(result));
  }
  @Delete("organizers/:id")
  @HttpCode(204)
  async deleteOrganizer(@Param("id", ParseUUIDPipe) id: string) {
    this.unwrap(await this.crm.deleteOrganizer(id));
  }
  @Put("organizers/:organizerId/contacts/:contactId")
  @HttpCode(204)
  async linkContact(
    @Param("organizerId", ParseUUIDPipe) organizerId: string,
    @Param("contactId", ParseUUIDPipe) contactId: string,
  ) {
    this.unwrap(await this.crm.linkContact(organizerId, contactId));
  }
  @Delete("organizers/:organizerId/contacts/:contactId")
  @HttpCode(204)
  async unlinkContact(
    @Param("organizerId", ParseUUIDPipe) organizerId: string,
    @Param("contactId", ParseUUIDPipe) contactId: string,
  ) {
    this.unwrap(await this.crm.unlinkContact(organizerId, contactId));
  }

  @Get("sports") sports(@Query("includeInactive") includeInactive?: string) {
    return this.selectionLists.list("sports", includeInactive === "true");
  }
  @Post("sports") sport(@Body() body: { name: string }) {
    return this.selectionLists.create("sports", body.name);
  }
  @Patch("sports/:id") updateSport(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { name?: string; active?: boolean },
  ) {
    return this.selectionLists.update("sports", id, body);
  }
  @Patch("sports/:id/deactivate") deactivateSport(@Param("id", ParseUUIDPipe) id: string) {
    return this.selectionLists.update("sports", id, { active: false });
  }

  @Get("event-roles") eventRoles(@Query("includeInactive") includeInactive?: string) {
    return this.selectionLists.list("eventRoles", includeInactive === "true");
  }
  @Post("event-roles") eventRole(@Body() body: { name: string }) {
    return this.selectionLists.create("eventRoles", body.name);
  }
  @Patch("event-roles/:id") updateEventRole(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { name?: string; active?: boolean },
  ) {
    return this.selectionLists.update("eventRoles", id, body);
  }

  @Get("contacts") contacts() {
    return this.crm.contacts();
  }
  @Post("contacts") contact(
    @Body()
    body: ContactInput,
  ) {
    return this.crm.createContact(body).then((result) => this.unwrap(result));
  }
  @Patch("contacts/:id") contactUpdate(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    body: Partial<ContactInput>,
  ) {
    return this.crm.updateContact(id, body).then((result) => this.unwrap(result));
  }
  @Delete("contacts/:id")
  @HttpCode(204)
  async deleteContact(@Param("id", ParseUUIDPipe) id: string) {
    this.unwrap(await this.crm.deleteContact(id));
  }
  @Post("contacts/:id/customer-profile") customerProfile(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    body: CustomerProfileInput,
  ) {
    return this.crm.upsertCustomerProfile(id, body).then((result) => this.unwrap(result));
  }
}
