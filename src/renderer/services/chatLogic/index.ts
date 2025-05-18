export * from './chatHandler';
export * from './chatModes';

import { ConversationModeType } from "../../components/Settings/ConversationMode";
import { ChatMode } from "../../components/Chat/ChatInput";

// Utility function to convert from ConversationModeType to ChatMode
export function getModeFromConversationMode(conversationMode: ConversationModeType): ChatMode {
  switch (conversationMode) {
    case ConversationModeType.ISOLATED:
      return ChatMode.ISOLATED;
    case ConversationModeType.DISCUSS:
      return ChatMode.DISCUSS;
    case ConversationModeType.ROUND_ROBIN:
      return ChatMode.ROUND_ROBIN;
    case ConversationModeType.CUSTOM:
      return ChatMode.CUSTOM;
    default:
      return ChatMode.ISOLATED;
  }
}

// This file serves as an export point for all chat logic modules