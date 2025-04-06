declare module '@rails/actioncable' {
  export function createConsumer(url?: string): Consumer;

  export interface Consumer {
    subscriptions: Subscriptions;
  }

  export interface Subscriptions {
    create(channelName: string | object, mixin?: object): Subscription;
  }

  export interface Subscription {
    unsubscribe(): void;
    perform(action: string, data?: object): void;
    received(callback: (data: any) => void): void;
  }
} 