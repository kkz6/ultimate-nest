import type { TemplateEngine } from "@common/@types";
import { Logger } from "@nestjs/common";

// @ts-expect-error - consolidate has no types
import cons from "@ladjs/consolidate";

export interface Adapter {
  logger: Logger
  compile(template: string, data: Record<string, any>): Promise<string>
}

export class BaseAdapter implements Adapter {
  logger: Logger = new Logger(BaseAdapter.name);
  constructor(private engine: TemplateEngine) {}

  async compile(template: string, data: Record<string, any>): Promise<string> {
    return cons[this.engine](template, data);
  }
}