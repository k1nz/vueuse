---
category: Utilities
---

# useEventBus

A basic event bus.

## Usage

```ts
import { useEventBus } from '@vueuse/core'

const bus = useEventBus<string>('news')

const listener = (event: string) => {
  console.log(`news: ${event}`)
}
const specificListener = (event: string) => {
  console.log(`news(specific): ${event}`)
}

// listen to an event
const unsubscribe = bus.on(listener)
const unsubscribeSpecific = bus.on('specific', specificListener)

// fire an event
bus.emit('The Tokyo Olympics has begun')
bus.emit('specific', 'The China Olympics has begun')

// unregister the listener
unsubscribe()
unsubscribeSpecific()
// or
bus.off(listener)
bus.off('specific', specificListener)

// clearing all listeners
bus.reset()
```

Listeners registered inside of components `setup` will be unregistered automatically when the component gets unmounted.

## TypeScript

Using `EventBusKey` is the key to bind the event type to the key, similar to Vue's [`InjectionKey`](https://antfu.me/notes#typed-provide-and-inject-in-vue) util.

```ts
// fooKey.ts
import type { EventBusKey } from '@vueuse/core'

export const fooKey: EventBusKey<{ name: foo }> = Symbol('symbol-key')
```

```ts
import { useEventBus } from '@vueuse/core'

import { fooKey } from './fooKey'

const bus = useEventBus(fooKey)

bus.on((e) => {
  // `e` will be `{ name: foo }`
})
```
