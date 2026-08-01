export { auditVoice } from './voice.js';
export function renderApprovedLine(response) { return response?.text ?? 'ASK AGAIN LATER - no approved answer is available.'; }
