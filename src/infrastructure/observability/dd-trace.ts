// src/infrastructure/observability/dd-trace.ts
// Mock implementation for dd-trace
const mockSpan = {
  addTags: (tags: Record<string, any>) => {},
  setTag: (key: string, value: any) => {},
  finish: () => {}, // Add finish method for completeness
};

const mockScope = {
  active: () => mockSpan,
  activate: (span: any, callback: () => void) => callback(), // Simulate activate
};

const tracer = {
  scope: () => mockScope,
  startSpan: (name: string, options?: any) => {
    console.log(`Mock Span: startSpan(${name})`);
    return mockSpan;
  },
};

export default tracer;