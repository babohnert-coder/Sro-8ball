export function normalizeTwitchContext(input={}) {
  return { channelId:input.channelId??null, messageId:input.messageId??null, userId:input.userId??'anonymous', chatVelocity:Number(input.chatVelocity??0), recentReactions:Array.isArray(input.recentReactions)?input.recentReactions:[] };
}
