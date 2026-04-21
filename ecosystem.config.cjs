module.exports = {
  apps: [
    {
      name: 'accessiscan-backend',
      script: 'venv/bin/uvicorn',
      args: 'main:app --host 127.0.0.1 --port 8000',
      cwd: './backend',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
    }
  ],
};
