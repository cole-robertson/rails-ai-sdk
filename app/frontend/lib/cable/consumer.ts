import { createConsumer } from '@rails/actioncable';

// Create a single consumer instance that can be shared across the app
const consumer = createConsumer();

export default consumer; 