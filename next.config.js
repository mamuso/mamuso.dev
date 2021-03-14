module.exports = {
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/posts/1",
      },
    ];
  },
};
