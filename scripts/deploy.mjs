/**
 * Deploy without GitHub Actions: build the site and force-push dist/ to the
 * `gh-pages` branch. In the repo, set Settings → Pages → Source to
 * "Deploy from a branch" → gh-pages / (root).
 */
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const run = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd })
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim()

const remote = out('git remote get-url origin')
const sha = out('git rev-parse --short HEAD')

run('npm run build')
if (!existsSync('dist/.nojekyll')) throw new Error('dist/.nojekyll missing — GitHub would run Jekyll')

// dist/ becomes a throwaway repo whose only commit is the built site.
run('rm -rf .git', 'dist')
run('git init -q -b gh-pages', 'dist')
run('git add -A', 'dist')
run(`git commit -q -m "Deploy ${sha}"`, 'dist')
run(`git push -f ${remote} gh-pages`, 'dist')
run('rm -rf .git', 'dist')

console.log('\nDeployed. Site: https://prasad1101.github.io/code-with-prasad-web/')
