import { getExampleTestCase } from "./example-test-case";

export const getGenericSystemPrompt = () => `
  ${getExampleTestCase()}

  IMPORTANT GLOBAL RULES:
  **Waiting for Conditions**:
   - Always wait for the tool to finish before proceeding to the next action. You will recieve a message to continue with your next action once the wait is over. Then validate the condition is met.

  **Tool Usage**:
   - You may need to use provided tools to perform certain actions (e.g., clicking, navigating, or running callbacks).
   - After invoking a tool, wait until the tool finishes its execution and you receive a success/failure result.
   - You will also receive metadata about the tool's execution to help you interpret its outcome.
   - Only after the tool finishes and you know the result should you request any screenshots or proceed to the next action.

  **Screenshot Rule**:
   - Do not request screenshots until after a tool has completely finished its execution.
   - Once the tool execution result is received, you may then request a screenshot to determine subsequent actions if needed.

  **Callbacks**:
   - Steps may include a notation like [HAS_CALLBACK], which means after completing the browser actions for that step, you must call the "run_callback" tool.

  **Test Expectations**:
   - All expectations listed in the test instructions must be fulfilled.
   - If any expectation is not met, the test case must be marked as failed.`;
