# MindCore · Forge

> **Start building, not configuring.**

MindCore · Forge is an opinionated, deterministic, CLI-first project bootstrapper designed specifically for hackathons.

It eliminates hours of repetitive setup by generating a **hackathon-ready repository** with clean structure, installed dependencies, and development skeletons — immediately after your idea is chosen.

Forge is not a general-purpose scaffolding tool.  
It is intentionally narrow, fast, and strict.

---

## Why Forge Exists

Hackathon teams consistently lose 5–10 hours to:
- Choosing templates
- Wiring frontend and backend together
- Installing dependencies
- Arguing about folder structure
- Writing boilerplate README files
- Fixing broken setups mid-hackathon

Forge removes all of that.

You answer a few questions.  
Forge outputs a repository you can immediately build on.

---

## Core Principles

- **Hackathon-first**
- **Opinionated over flexible**
- **Deterministic output**
- **Local-only**
- **No authentication**
- **No Docker**
- **One-shot execution**

If Forge cannot guarantee a clean, working output, it fails loudly.

---

## What Forge Is

- A CLI tool
- A one-time project generator
- A structure enforcer
- A time saver

## What Forge Is NOT

- A framework marketplace
- A plugin system
- A long-running service
- A GUI tool
- A replacement for package managers
- A solution for game engines or native mobile apps

---

## Supported Use Case

**When to use Forge:**
- After the hackathon idea is finalized
- Before any real coding starts
- When speed and clarity matter more than customization

**When not to use Forge:**
- If you want total control over structure
- If you are building a game engine project
- If you need Docker-based infra
- If you want to experiment with architecture during setup

---

## Supported Project Types (MVP)

### Project Categories
- Web Application (Frontend + Backend)
- API-only Service
- Infrastructure-lite Scripted Service

### Explicitly NOT Supported
- Game engines (Unity, Unreal, Godot, etc.)
- Mobile-native apps
- Embedded systems
- Robotics
- Complex microservice architectures

---

## High-Level Flow

1. User runs `forge`
2. Forge asks a small, fixed set of questions
3. Forge validates the chosen stack
4. Forge generates a repository
5. Dependencies are installed
6. Skeleton code is created
7. README is auto-generated
8. Forge exits

No background processes.  
No telemetry.  
No cloud calls (unless installing dependencies).

---

## CLI Usage

### Interactive Mode (Primary)
```bash
forge
````

### Non-Interactive Mode (Optional)

```bash
forge \
  --language typescript \
  --project web \
  --frontend react \
  --backend node \
  --auth yes \
  --database postgres
```

If invalid combinations are provided, Forge exits with a non-zero code.
