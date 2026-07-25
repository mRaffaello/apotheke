export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': [2, 'always', ['core', 'cli', 'plugin', 'docs', 'skill', 'ci', 'root']],
        'scope-empty': [2, 'never']
    }
};
