/**
 * @fileoverview ESLint plugin to warn against the usage of console and recommend using Logger from @shortest/logger.
 */

const plugin = {
  meta: {
    name: "eslint-plugin-no-console-usage",
    type: "problem",
    docs: {
      description:
        "Warn about usage of console and recommend using Logger from @shortest/logger",
      category: "Best Practices",
    },
  },
  configs: {},
  rules: {
    main: {
      meta: {
        fixable: "code",
        messages: {
          noConsole:
            "Avoid using console. Please use Logger from '@shortest/logger' instead.",
        },
      },
      create(context) {
        return {
          MemberExpression(node) {
            if (node.object.name === "console") {
              context.report({
                node,
                messageId: "noConsole",
              });
            }
          },
        };
      },
    },
  },
};

Object.assign(plugin.configs, {
  recommended: [
    {
      plugins: {
        "no-console-usage": plugin,
      },
      rules: {
        "no-console-usage/main": "warn",
      },
      languageOptions: {
        globals: {
          myGlobal: "readonly",
        },
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
    },
  ],
});

export default plugin;
