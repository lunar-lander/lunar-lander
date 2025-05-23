export * from './baseHandler';
export * from './isolatedHandler';
export * from './discussHandler';
export * from './roundRobinHandler';
export * from './collaborativeRefinementHandler';
export * from './expertPanelHandler';
export * from './debateHandler';
export * from './consensusBuildingHandler';
export * from './customHandler';

import { BaseChatHandler } from './baseHandler';
import { IsolatedChatHandler } from './isolatedHandler';
import { DiscussChatHandler } from './discussHandler';
import { RoundRobinChatHandler } from './roundRobinHandler';
import { CollaborativeRefinementHandler } from './collaborativeRefinementHandler';
import { ExpertPanelHandler } from './expertPanelHandler';
import { DebateHandler } from './debateHandler';
import { ConsensusBuildingHandler } from './consensusBuildingHandler';
import { CustomChatHandler } from './customHandler';

import { ConversationModeType } from '../../../components/Settings/ConversationMode';
import { ChatHandlerDeps, StreamingStateHandlers } from '../chatHandler';
import { CustomConfig } from '../../../contexts/AppContext';

// Factory function to create the appropriate handler based on conversation mode
export function createChatHandler(
  mode: ConversationModeType,
  deps: ChatHandlerDeps,
  streamHandlers: StreamingStateHandlers,
  systemPrompt: string,
  customConfig: CustomConfig | null = null
): BaseChatHandler {
  switch (mode) {
    case ConversationModeType.ISOLATED:
      return new IsolatedChatHandler(deps, streamHandlers, systemPrompt);
    case ConversationModeType.DISCUSS:
      return new DiscussChatHandler(deps, streamHandlers, systemPrompt);
    case ConversationModeType.ROUND_ROBIN:
      return new RoundRobinChatHandler(deps, streamHandlers, systemPrompt);
    case ConversationModeType.COLLABORATIVE_REFINEMENT:
      return new CollaborativeRefinementHandler(deps, streamHandlers, systemPrompt);
    case ConversationModeType.EXPERT_PANEL:
      return new ExpertPanelHandler(deps, streamHandlers, systemPrompt);
    case ConversationModeType.DEBATE:
      return new DebateHandler(deps, streamHandlers, systemPrompt);
    case ConversationModeType.CONSENSUS_BUILDING:
      return new ConsensusBuildingHandler(deps, streamHandlers, systemPrompt);
    case ConversationModeType.CUSTOM:
      return new CustomChatHandler(deps, streamHandlers, systemPrompt, customConfig);
    default:
      return new IsolatedChatHandler(deps, streamHandlers, systemPrompt);
  }
}