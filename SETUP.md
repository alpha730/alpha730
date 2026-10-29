# Setup: manual steps for you

Nothing here has been pushed or changed on GitHub. These are the steps only you can do.

## 1. Create the repo and push
1. On GitHub, create a **public** repo named exactly `alpha730/alpha730` (no README, no .gitignore).
2. From this folder:
   ```sh
   git init -b main
   git add .
   git commit -m "feat: mission control profile"
   git remote add origin https://github.com/alpha730/alpha730.git
   git push -u origin main
   ```
   `node_modules/` and `preview/` are git-ignored.

## 2. Enable the live-stats workflow
1. Repo **Settings > Actions > General > Workflow permissions**: choose **Read and write permissions**.
2. **Actions** tab > "Update profile stats" > **Run workflow** once, so the placeholder panels become real data.
3. It then runs daily and commits only files under `assets/` with the message `chore: refresh profile stats [skip ci]`.

**Limitations**
- **The live stats count public contributions only.** The built-in `GITHUB_TOKEN` can't see your private contributions. A personal access token could, but I deliberately didn't use one, so no secrets are stored.
- The streak and "longest streak" cover the **last 12 months** (the window the contributions API returns), not your all-time record.
- GitHub pauses scheduled workflows after 60 days without repo activity. Check the Actions tab if the stats stop updating, and re-enable the workflow if needed.
- The SVGs follow your **operating system or browser** light/dark setting, not GitHub's own theme switcher.

## 3. Pin repos on your profile (GitHub UI only)
On your profile, choose **Customize your pins** and select:
`Prompt-injection-Tester-`, `sih-project`, `ASHA-Voice-Logging-Agent`, `DUO-Game`.
**Remove the DRISHTI pin**, which belongs to another account.

## 4. Optional renames
`Aryan---cv` and `Prompt-injection-Tester-` could have cleaner names. If you rename `Prompt-injection-Tester-`, update `repo` in `profile.config.json`, then run `npm run build` and commit. GitHub redirects the old URL, but fix the links anyway. The README card links are written by hand, so edit those too.

## 5. Fill the missing metric (remote-sensing platform)
The `sih-project` card shows no metric on purpose. The resume had an unfilled placeholder. When you have a real number:
1. Add it as a `result` object on mission 2 in `profile.config.json`, copying the shape used by the other missions: `{ "text": "...", "tone": "gr" }`.
2. Run `npm run build`.
3. Delete the `<!-- TODO: add metric -->` comment in `README.md`.

## 6. Check mission 2's stack against the resume
I derived the `sih-project` card's stack from the repo itself (`pyproject.toml` and README), not from the resume line. The card says **Python, PyTorch, LangGraph, Rasterio**. I left out LangChain, GDAL and RAG, which the repo doesn't use. It says "SAR + optical" rather than "SAR + multispectral", because the repo handles SAR and optical imagery but never mentions multispectral. Edit `profile.config.json` if you want different wording.

## Rebuilding locally
```sh
npm install        # only needed for the PNG preview (resvg)
npm run build      # regenerate static SVGs in assets/
npm run render     # PNG previews in preview/ (desktop + 380px, dark + light)
npm run validate   # README/asset checks
```
Live-stat SVGs come from `node scripts/live-stats.mjs`. It needs a `GITHUB_TOKEN` in your environment, which the workflow supplies, and it refuses to run without one.
