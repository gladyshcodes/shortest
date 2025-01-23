import { BetaToolUnion } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import {
  getComputerUse,
  getGithubLogin,
  getCheckEmail,
  getSleep,
  getRunCallback,
  getNavigate,
} from "./tools";

interface ClaudeToolsWebArgs {
  display_width_px: number;
  display_height_px: number;
}

export const getClaudeToolsWeb = ({
  display_width_px,
  display_height_px,
}: ClaudeToolsWebArgs) =>
  [
    getComputerUse(display_width_px, display_height_px),
    getGithubLogin(),
    getCheckEmail(),
    getSleep(),
    getRunCallback(),
    getNavigate(),
  ] as BetaToolUnion[];
