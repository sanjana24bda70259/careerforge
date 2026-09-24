// CareerForge deliberately keeps code execution behind a provider boundary.
// Do not execute untrusted learner code inside this Node process.
const provider = process.env.CODE_EXECUTION_PROVIDER || 'disabled';

export const executionStatus = () => ({
  available: false,
  provider,
  message: 'Secure code execution is not configured. Connect an isolated judge provider before enabling Run Code or Submit.'
});

export const runCode = async () => executionStatus();

export const submitCode = async () => executionStatus();
