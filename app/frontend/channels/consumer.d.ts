// Type definitions for ActionCable consumer
declare module '@/channels/consumer' {
  interface Subscription {
    unsubscribe(): void;
    send(data: any): void;
  }

  interface Consumer {
    subscriptions: {
      create(
        params: { channel: string; [key: string]: any },
        callbacks: { [key: string]: any }
      ): Subscription;
    };
  }

  const consumer: Consumer;
  export default consumer;
} 