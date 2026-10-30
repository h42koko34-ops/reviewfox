module.exports = {
  plugins: [],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['theme', 'import', 'layer'],
      },
    ],
  },
};