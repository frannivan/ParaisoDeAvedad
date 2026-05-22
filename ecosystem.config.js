module.exports = {
  apps: [
    {
      name: "paraiso-backend",
      script: "src/index.js",
      cwd: "./server",
      watch: false,
      env: {
        PORT: 3041, 
        NODE_ENV: "production",
      }
    },
    {
      name: "paraiso-frontend",
      script: "node_modules/vite/bin/vite.js",
      args: "preview --port 3030 --host",
      cwd: "./client",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
