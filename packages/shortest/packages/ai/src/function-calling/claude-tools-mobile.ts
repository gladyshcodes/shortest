import { BetaToolUnion } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { getComputerUse, getSleep, getRunCallback } from "./tools";

interface ClaudeToolsMobileArgs {
  display_width_px: number;
  display_height_px: number;
}

export const getClaudeToolsMobile = ({
  display_width_px,
  display_height_px,
}: ClaudeToolsMobileArgs) =>
  [
    getComputerUse(display_width_px, display_height_px),
    getSleep(),
    getRunCallback(),
  ] as BetaToolUnion[];
