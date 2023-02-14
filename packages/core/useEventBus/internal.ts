import type { EventBusIdentifier, Listeners } from '.'

/* #__PURE__ */
export const events = new Map<EventBusIdentifier<any>, Listeners<any, any>>()
