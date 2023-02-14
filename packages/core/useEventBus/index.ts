import type { Fn } from '@vueuse/shared'
import { getCurrentScope } from 'vue-demi'
import { events } from './internal'

export type EventBusEventFreeHandler<Payload = any> = (payload?: Payload) => void
export type EventBusListener<EventName = unknown, Payload = any> = (event: EventName, payload?: Payload) => void
export interface Listeners<EventName = unknown, Payload = any> {
  listeners: EventBusListener<EventName, Payload>[]
  handlerMap: Map<any, EventBusEventFreeHandler<Payload>[]>
}

// eslint-disable-next-line unused-imports/no-unused-vars
export interface EventBusKey<EventName> extends Symbol { }

export type EventBusIdentifier<EventName = unknown> = EventBusKey<EventName> | string | number

export interface UseEventBusReturn<EventName, Payload> {
  /**
   * Subscribe to an event. When calling emit, the listeners will execute.
   * Overload 1: Subscribe global event. When calling emit, the listeners will execute without distinguish event.
   * @param listener watch listener.
   * @returns a stop function to remove the current callback.
   */
  on(listener: EventBusListener<EventName, Payload>): Fn
  /**
   * Subscribe to an event. When calling emit, the listeners will execute.
   * Overload 2: Subscribe specific event. When calling emit, the listeners corresponding to event will execute.
   * @param event event name.
   * @param listener watch listener.
   * @returns a stop function to remove the current callback.
   */
  on(event: EventName, handler: EventBusEventFreeHandler<Payload>): Fn
  /**
   * Similar to `on`, but only fires once.
   * Overload 1: Subscribe global event. When calling emit, the listeners will execute without distinguish event.
   * @param listener watch listener.
   * @returns a stop function to remove the current callback.
   */
  once(listener: EventBusListener<EventName, Payload>): Fn
  /**
   * Similar to `on`, but only fires once.
   * Overload 2: Subscribe specific event. When calling emit, the listeners corresponding to event will execute.
   * @param event event name.
   * @param listener watch listener.
   * @returns a stop function to remove the current callback.
   */
  once(event: EventName, handler: EventBusEventFreeHandler<Payload>): Fn
  /**
   * Emit an event, the corresponding event listeners will execute.
   * @param event data sent.
   */
  emit: (event?: EventName, payload?: Payload) => void
  /**
   * Remove the corresponding listener.
   * @param listener watch listener.
   */
  /**
   * Remove the corresponding listener.
   * @param listener watch listener.
   */
  off(listener: EventBusListener<EventName, Payload>): void
  /**
   * Remove the corresponding listener.
   * @param event event name.
   * @param listener watch listener.
   */
  off(event: EventName, handler: EventBusEventFreeHandler<Payload>): void
  /**
   * Clear all events
   */
  reset: () => void
}

export function useEventBus<EventName = unknown, Payload = any>(key: EventBusIdentifier<EventName>): UseEventBusReturn<EventName, Payload> {
  const scope = getCurrentScope()

  function on(listener: EventBusListener<EventName, Payload>): Fn
  function on(event: EventName, handler: EventBusEventFreeHandler<Payload>): Fn
  function on(...args: any[]): Fn {
    let _off: Fn
    const listenerRecord = (events.get(key) || { listeners: [], handlerMap: new Map() }) as Listeners<EventName, Payload>
    if (args.length === 1) {
      const [listener] = args as [EventBusListener<EventName, Payload>]
      listenerRecord.listeners.push(listener)
      events.set(key, listenerRecord)

      _off = () => off(listener)
    }
    else {
      const [event, handler] = args as [EventName, EventBusEventFreeHandler<Payload>]
      const eventFreeHandlers = (listenerRecord.handlerMap.get(key) || []) as EventBusEventFreeHandler<Payload>[]
      eventFreeHandlers.push(handler)
      listenerRecord.handlerMap.set(event, eventFreeHandlers)
      events.set(key, listenerRecord)

      _off = () => off(event, handler)
    }
    // auto unsubscribe when scope get disposed
    // @ts-expect-error vue3 and vue2 mis-align
    scope?.cleanups?.push(_off)
    return _off
  }

  function once(listener: EventBusListener<EventName, Payload>): Fn
  function once(event: EventName, handler: EventBusEventFreeHandler<Payload>): Fn
  function once(...args: any[]): Fn {
    if (args.length === 1) {
      const [listener] = args
      function _listener(...argv: any[]) {
        off(_listener)
        listener(...argv)
      }
      return on(_listener)
    }
    else {
      const [event, handler] = args
      function _handler(...argv: any[]) {
        off(event, _handler)
        handler(...argv)
      }
      return on(event, _handler)
    }
  }

  function off(listener: EventBusListener<EventName>): void
  function off(event: EventName, handler: EventBusEventFreeHandler<Payload>): void
  function off(...args: any[]): void {
    if (args.length === 1) {
      const [listener] = args as [EventBusListener<EventName>]
      const listeners = events.get(key)?.listeners
      if (!listeners)
        return

      const index = listeners.indexOf(listener)
      if (index > -1)
        listeners.splice(index, 1)
      if (!listeners.length)
        events.delete(key)
    }
    else {
      const [event, handler] = args as [any, EventBusEventFreeHandler<Payload>]
      const handlerMap = events.get(key)?.handlerMap
      if (!handlerMap)
        return

      const eventFreeHandlers = (handlerMap.get(event) || []) as EventBusEventFreeHandler<Payload>[]
      const index = eventFreeHandlers.indexOf(handler)
      if (index > -1)
        eventFreeHandlers.splice(index, 1)
      if (!eventFreeHandlers.length)
        handlerMap.delete(event)
      if (!handlerMap.size)
        events.delete(key)
    }
  }

  function reset() {
    events.delete(key)
  }

  function emit(event?: EventName, payload?: Payload) {
    const listenerRecord = events.get(key)
    if (!listenerRecord)
      return

    listenerRecord.handlerMap.get(event)?.forEach(v => v(payload))
    listenerRecord.listeners.forEach(v => v(event, payload))
  }

  return { on, once, off, emit, reset }
}
