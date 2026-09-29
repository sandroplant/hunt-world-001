# STAGE 7 — Hunt World Package v0.1

**Branch:** feat/stage-7-portal-proof  
**Status:** Active specification  
**Source precedence:** v10 §§ 27–28; v10 §4.4; Deep Research §2 (World-authoring-studio phased architecture)

---

## Purpose

The Hunt World Package v0.1 is the constrained declarative format for a complete Hunt world. It is the primary output of the World Foundry Alpha and the primary input to the Hunt platform runtime.

A world package is:

- **immutable once frozen** — no content may change after the package is signed;
- **declarative** — it describes the world in structured data; it does not contain arbitrary executable code;
- **signed** — the package signature confirms the content has not been altered since the founder approved it;
- **self-contained** — all assets, metadata, schemas, and references needed to render and run the world are present or explicitly referenced.

No arbitrary uploaded JavaScript may appear in a World Package v0.1. Behavior is expressed through the approved interaction grammar (§8 below), not through executable scripts.

---

## Schema Overview

The package root contains eight named components. All components are required for a package to pass automated validation. Optional fields within components may be empty but the component itself must be present.

```
{world_id}/
  manifest.json            World manifest
  scene_graph.json         Scene nodes, portals, branch hierarchy
  assets/                  Tile pyramids (DZI manifests + _files/ directories)
  districts.json           Named district definitions
  objects.json             Interactive object state machines
  atlas.json               Atlas geometry for each scene node
  anchors.json             Candidate anchor library
  clues.json               Clue fact schemas and frozen clue packs
  tasks.json               Non-prize tasks, collectibles, conditions
  analytics_schema.json    Analytics event vocabulary
  accessibility.json       Accessibility metadata
  performance_budgets.json Declared performance budgets
  production_report.json   World Foundry production evidence
  package.sig              Package signature
```

---

## Component Definitions

### 1. World Manifest (`manifest.json`)

Top-level metadata about the world.

```json
{
  "world_id": "uuid-v4",
  "title": "string",
  "version": "0.1.0",
  "status": "draft | staged | published | archived",
  "author": {
    "name": "string",
    "role": "founder | art_director | world_designer",
    "is_eligible_for_hunt": false
  },
  "rights": {
    "asset_records": [
      {
        "asset_id": "string",
        "source": "string",
        "ai_tool": "string | null",
        "license": "string",
        "disclosure_required": true
      }
    ],
    "ai_disclosure_summary": "string",
    "license_scope": "internal | exclusive | nonexclusive"
  },
  "hunt_parameters": {
    "format": "vertical_slice | rehearsal_world | full_world",
    "simulated_prizes": true,
    "real_prizes": false,
    "disclaimer": "Technical rehearsal — no real prize or cash value.",
    "min_age": 13
  },
  "world_attribute_profile": {
    "recursive_depth": 0,
    "visual_density": 0,
    "interaction_density": 0,
    "riddle_intensity": 0,
    "clue_dependence": 0,
    "estimated_duration_minutes_solo": 0,
    "estimated_duration_minutes_team_3": 0,
    "intended_age_range": "13+",
    "theme_tags": []
  },
  "created_at": "ISO8601",
  "frozen_at": "ISO8601 | null",
  "package_format_version": "0.1"
}
```

The `author.is_eligible_for_hunt` field must be `false`. Any person named as author or reviewer in the manifest is ineligible for the hunt's prizes.

### 2. Scene Graph (`scene_graph.json`)

Defines every scene node, its parent-child relationships, and its portal connections.

```json
{
  "root_node_id": "string",
  "nodes": [
    {
      "node_id": "string",
      "parent_node_id": "string | null",
      "branch_id": "string",
      "depth": 0,
      "label": "string",
      "named_district": "string | null",
      "tile_source": "assets/{node_id}/{node_id}.dzi",
      "aspect_ratio": 1.333,
      "resolution_px": [4096, 3072],
      "portals": [
        {
          "portal_id": "string",
          "destination_node_id": "string",
          "label": "string",
          "normalized_x": 0.0,
          "normalized_y": 0.0,
          "normalized_w": 0.0,
          "normalized_h": 0.0,
          "trigger": "click | proximity | zoom_threshold"
        }
      ],
      "ai_recipe_ids": [],
      "has_lateral_exploration": true,
      "is_primary_branch": false
    }
  ]
}
```

Scene node IDs are stable — they must not change between world versions without a migration record. Clue facts, anchor records, and analytics events all reference node IDs.

### 3. Named Districts (`districts.json`)

```json
{
  "districts": [
    {
      "district_id": "string",
      "name": "string",
      "node_ids": ["string"],
      "is_sponsored": false,
      "sponsor_disclosure": "string | null",
      "audio_zone_id": "string | null",
      "theme_tags": []
    }
  ]
}
```

Sponsored districts must set `is_sponsored: true` and provide a non-null `sponsor_disclosure`. A sponsored district must never confer a gameplay advantage or require a commercial action for access.

### 4. Interactive Objects (`objects.json`)

State machines for all openable and stateful objects.

```json
{
  "objects": [
    {
      "object_id": "string",
      "node_id": "string",
      "label": "string",
      "states": ["closed", "open"],
      "initial_state": "closed",
      "is_candidate_anchor": false,
      "anchor_id": "string | null",
      "transitions": [
        {
          "from": "closed",
          "to": "open",
          "trigger": "tap | drag | long_press | sequence",
          "conditions": [],
          "effects": [
            {
              "type": "reveal_layer | change_state | play_sfx | emit_event | submit_discovery",
              "params": {}
            }
          ]
        }
      ],
      "server_authority": {
        "required_for": ["prize_reveal"],
        "nonce_window_ms": 30000
      },
      "accessibility": {
        "aria_label": "string",
        "min_touch_target_px": 44,
        "keyboard_navigable": true
      }
    }
  ]
}
```

Transitions that submit a discovery attempt must have `server_authority.required_for` populated. Client code must not resolve the outcome of a prize-bearing discovery attempt — the server response determines the result.

### 5. Atlas Geometry (`atlas.json`)

```json
{
  "atlas": {
    "reveal_mode": "on_enter | on_inspect | manual",
    "fog_default": true,
    "nodes": [
      {
        "node_id": "string",
        "atlas_shape": [[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]],
        "atlas_label": "string | null",
        "reveal_condition": "on_enter",
        "fog_opacity": 0.9,
        "connections": ["string"]
      }
    ]
  }
}
```

Atlas shapes are normalized polygons (0.0–1.0) in Atlas canvas space, not in tile source space. The Atlas layout is authored separately from the tile layout and does not need to match geographically.

### 6. Candidate Anchors (`anchors.json`)

```json
{
  "anchors": [
    {
      "anchor_id": "string",
      "node_id": "string",
      "label": "string",
      "visual_description": "string",
      "local_x": 0.0,
      "local_y": 0.0,
      "valid_radius_normalized": 0.01,
      "object_id": "string | null",
      "difficulty": "easy | moderate | hard",
      "accessibility_notes": "string",
      "fallback_path": "string",
      "clue_fact_id": "string",
      "is_active": false,
      "is_decoy": false
    }
  ]
}
```

The `is_active` field must be `false` in the package file. Active anchor selection occurs through the future-randomness selection process described in v10 §14.2 and is never stored in the client-accessible package. Decoy anchors (`is_decoy: true`) are present to prevent brute-force clicking from being viable.

**No real treasure coordinates may appear in any package file committed to the repository.**

### 7. Clue Facts and Frozen Clue Packs (`clues.json`)

```json
{
  "clue_facts": [
    {
      "clue_fact_id": "string",
      "anchor_id": "string",
      "region": "string",
      "visible_objects": ["string"],
      "colors": ["string"],
      "story_context": "string",
      "allowed_references": ["string"],
      "forbidden_references": ["string"],
      "target_difficulty": "easy | moderate | hard",
      "clue_ladder_count": 4
    }
  ],
  "clue_packs": [
    {
      "pack_id": "string",
      "anchor_id": "string",
      "generator_version": "string",
      "input_hash": "sha256:string",
      "output_hash": "sha256:string",
      "generated_at": "ISO8601",
      "clues": [
        {
          "step": 1,
          "text": "string",
          "release_offset_minutes": 0
        }
      ],
      "automated_check_results": {
        "ambiguity_score": 0.0,
        "forbidden_word_detected": false,
        "duplicate_wording": false,
        "passed": true
      },
      "frozen_at": "ISO8601 | null"
    }
  ]
}
```

Clue packs must be generated for every candidate anchor before selection, not only for the anchor that becomes active. This prevents anyone working on clue generation from learning the selected anchor by seeing which pack appears during the hunt.

For the World Foundry Alpha, the ClueGenerator may use deterministic local generation or frozen fixture sets. An external AI API is not required.

### 8. Tasks, Collectibles, and Conditions (`tasks.json`)

Non-prize tasks and collectibles for the vertical slice and rehearsal world. This component may be empty (`{ "tasks": [], "collectibles": [], "conditions": [] }`) for the first vertical slice.

```json
{
  "tasks": [
    {
      "task_id": "string",
      "label": "string",
      "type": "exploration | interaction | collection",
      "is_prize_bearing": false,
      "conditions": ["string"],
      "effects": ["string"]
    }
  ],
  "collectibles": [],
  "conditions": []
}
```

Prize-bearing tasks (`is_prize_bearing: true`) require the same server-authority and frozen-pack requirements as candidate anchor clue packs. For the Alpha, all tasks are non-prize.

### 9. Analytics Event Vocabulary (`analytics_schema.json`)

Declares every analytics event emitted by this world. The runtime records only events declared here. No analytics events may be sent to external advertising platforms.

```json
{
  "events": [
    {
      "event_name": "string",
      "description": "string",
      "emitted_by": "client | server",
      "fields": [
        { "name": "string", "type": "string | number | boolean", "required": true }
      ]
    }
  ]
}
```

### 10. Accessibility Metadata (`accessibility.json`)

```json
{
  "global": {
    "high_contrast_mode": true,
    "aria_live_regions": true,
    "keyboard_navigable_portals": true,
    "read_aloud_clue_text": true
  },
  "per_node": [
    {
      "node_id": "string",
      "aria_label": "string",
      "district_entry_haptic": false,
      "district_entry_audio_cue": false
    }
  ]
}
```

### 11. Performance Budgets (`performance_budgets.json`)

```json
{
  "budgets": {
    "max_tiles_per_viewport": 32,
    "max_simultaneous_tile_requests": 8,
    "max_interactable_objects_per_node": 20,
    "max_portal_transition_time_ms": 1500,
    "max_object_interaction_latency_ms": 200,
    "target_tile_load_time_ms_p90": 800
  }
}
```

The automated validation checklist verifies that performance measurements taken during QA are within these budgets.

### 12. Production Report (`production_report.json`)

The World Foundry production evidence log in summary form. This is the exportable output of the production logger (World Foundry Alpha Scope item 17).

```json
{
  "world_id": "string",
  "total_production_time_hours": 0,
  "total_cost_usd": 0,
  "summary_by_category": [
    {
      "category": "string",
      "hours": 0,
      "cost_usd": 0,
      "accepted_output_rate": 0.0,
      "continuity_defects_found": 0
    }
  ],
  "ai_tools_used": ["string"],
  "recipe_ids_used": ["string"],
  "qa_results": {
    "median_solo_exploration_minutes": 0,
    "tester_count": 0,
    "benchmark_target_minutes": [45, 75],
    "benchmark_passed": false
  },
  "recommended_improvements": ["string"]
}
```

---

## Small JSON Example — Root Node (No Real Treasure Coordinates)

This example shows a single scene node from a fictional world. All coordinates are illustrative. No real candidate anchor positions appear here or in any file committed to the repository.

```json
{
  "node_id": "root-district",
  "parent_node_id": null,
  "branch_id": "root",
  "depth": 0,
  "label": "The Midnight District",
  "named_district": "Midnight District",
  "tile_source": "assets/root-district/root-district.dzi",
  "aspect_ratio": 1.333,
  "resolution_px": [4096, 3072],
  "portals": [
    {
      "portal_id": "portal-gallery-entry",
      "destination_node_id": "midnight-gallery-level1",
      "label": "Midnight Gallery",
      "normalized_x": 0.30,
      "normalized_y": 0.645,
      "normalized_w": 0.38,
      "normalized_h": 0.07,
      "trigger": "click"
    }
  ],
  "ai_recipe_ids": ["recipe-district-root-v1"],
  "has_lateral_exploration": true,
  "is_primary_branch": false
}
```

---

## What Is NOT in World Package v0.1

| Excluded item | Why |
|---|---|
| Arbitrary JavaScript or executable code | Security boundary; behavior is expressed through the interaction grammar |
| Real selected anchor coordinates or active treasure location | Server-only; selected after package is frozen via future-randomness process |
| Unreleased clue texts during an active hunt | Server-only; clue scheduler holds unreleased clues |
| Player notes, Atlas state, or exploration history | Player-generated; stored per-participant on the server, not in the world package |
| Sponsor analytics targeting or tracking pixels | Prohibited; all analytics are first-party |
| Audio files | Deferred; audio authoring is a later stage |
| Team configuration | Deferred; team support is Build Next |
| Marketplace metadata or listing information | Build Later; Alpha is not a marketplace product |
| Package-level pricing or commercial terms | Deferred; commercial packaging is not an Alpha feature |

---

## Package Signing

A completed World Package v0.1 is signed before any hunt that uses it. The signing process:

1. All component files are hashed (SHA-256).
2. The hash of each file is recorded in `manifest.json` under a `file_hashes` field.
3. The entire manifest is hashed.
4. The manifest hash is signed using the founder's signing key.
5. The signature is stored in `package.sig`.

Automated validation verifies the signature before the package is staged or published. Any modification to a component file after signing invalidates the signature.

For the World Foundry Alpha, a simple HMAC-SHA256 with a locally held key is sufficient. Public-key signing is recommended for any hunt that runs with external participants.
