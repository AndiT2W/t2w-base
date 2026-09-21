import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { IconService } from "./icon.service.js";
import { Roles } from "./authorization.js";

type AuthRequest = Request & { user: { id: string } };

/**
 * Die Symbolbibliothek ist Stammdaten wie die Auswahllisten selbst — und die
 * Seite, auf der sie gepflegt wird, sehen ohnehin nur Admins.  Lesen darf
 * jeder Angemeldete: die Symbole erscheinen in jeder Tabellenzeile.
 */
@ApiTags("icons")
@Controller("api/v1/icons")
export class IconController {
  constructor(private readonly icons: IconService) {}

  @Get() list(@Query("includeArchived") includeArchived?: string) {
    return this.icons.list(includeArchived === "true");
  }

  @Roles("ADMIN")
  @Post()
  upload(
    @Body() body: { fileName?: string; mimeType?: string; contentBase64?: string },
    @Req() req: AuthRequest,
  ) {
    return this.icons.upload(body, req.user.id);
  }

  /**
   * Ausgeliefert wird mit `ETag` und langer Cache-Zeit: ein Symbol steht in
   * jeder Zeile, und sein Inhalt ändert sich nie — ein neues Symbol bekommt
   * eine neue Kennung.  Als base64 in der Stammdatenantwort wüchse die bei
   * jedem Aufruf und ohne Zwischenspeicher.
   */
  @Get(":id") async content(
    @Param("id", ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const symbol = await this.icons.content(id);
    res.setHeader("Content-Type", symbol.mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("ETag", `"${id}"`);
    res.send(symbol.content);
  }

  @Roles("ADMIN")
  @Patch(":id/archive")
  archive(@Param("id", ParseUUIDPipe) id: string, @Body() body: { active?: boolean }) {
    return this.icons.archive(id, body.active ?? false);
  }
}
