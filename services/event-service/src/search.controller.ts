import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { SearchService } from "./search.service.js";

type AuthRequest = Request & { user: { role: string } };

/**
 * Ein Endpunkt für die Suche im Seitenkopf.  Der Rechteschnitt liegt im
 * Dienst, nicht hier: er gilt auch, wenn jemand die Adresse direkt aufruft.
 */
@ApiTags("search")
@Controller("api/v1/search")
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get() suchen(@Query("q") q: string | undefined, @Req() req: AuthRequest) {
    return this.search.search(q ?? "", req.user.role);
  }
}
