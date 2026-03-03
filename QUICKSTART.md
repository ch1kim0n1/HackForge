# Quickstart (v2)

## 1) Install

```bash
git clone https://github.com/ch1kim0n1/HackForge.git
cd HackForge
npm install
```

## 2) Run guided setup

```bash
./runner.sh
```

The runner opens an interactive configuration flow in terminal. You select stack/options without memorizing commands.

## 3) Open generated project

Runner generates your template in the parent directory of HackForge. Example:

```bash
cd ../my-hackathon-project
npm start
# or
./run.sh
```

## 4) Important behavior

After successful generation, runner mode schedules deletion of the HackForge directory.
Deletion runs only when HackForge safety checks verify the exact repo path and folder identity.

If you want to keep HackForge:

```bash
HACKFORGE_SKIP_SELF_DESTRUCT=1 ./runner.sh
```

## 5) Need detailed workflow?

See `STARTUP.md`.
