import { startFlowsServer } from '@google-genkit/flow';
import './chat-flow'; // Ensure chat-flow is imported so flows are registered

// This file can be used to start the Genkit flows server locally
// For example, by running `genkit start` if package.json scripts are set up,
// or by running `node src/ai/dev.js` (after compiling TS to JS).

// If you are not running a separate flows server and are calling flows directly
// from Next.js API routes, then starting the server here is not strictly necessary
// for deployment, but useful for local development and testing of flows.

// Example of how you might start the server:
// if (require.main === module) { // Check if the script is being run directly
//   startFlowsServer();
// }