<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { fade } from "svelte/transition";
  import { X, Building2, Loader, RotateCcw } from "@lucide/svelte";
  import { building3DStore } from "../../lib/store.svelte";
  import { getAppData } from "../../lib/context";
  import { fetchBuildingFootprint } from "../../lib/overpass";
  import {
    footprintToLocalPolygon,
    placeRooms,
    defaultFloorCount,
    maxInferredFloor,
    type LocalPolygon,
    type RoomPlacement,
  } from "../../lib/building-3d";

  const { rooms, buildings } = getAppData();

  let { name }: { name: string } = $props();

  const FLOOR_HEIGHT = 3.5;
  const ROOM_COLOR = 0xdc2626;
  const ROOM_HIGHLIGHT_COLOR = 0xfacc15;
  const SHELL_COLOR = 0xb89e84;
  const SHELL_OPACITY = 0.18;
  const FLOOR_SLAB_COLOR = 0xf5efe6;
  const FLOOR_SLAB_OPACITY = 0.75;

  let canvasContainer: HTMLDivElement | null = $state(null);
  let labelContainer: HTMLDivElement | null = $state(null);

  let loading = $state(true);
  let errorMsg: string | null = $state(null);
  let totalFloors = $state(1);
  let selectedFloor = $state<number | "all">("all");
  let activeRoomCode = $state<string | null>(null);
  let hoveredRoomCode = $state<string | null>(null);
  let footprintNote = $state<string | null>(null);

  // Three.js objects (not reactive — just refs we hand off to render loop / cleanup).
  let scene: any = null;
  let camera: any = null;
  let renderer: any = null;
  let labelRenderer: any = null;
  let controls: any = null;
  let raycaster: any = null;
  let pointer: any = null;
  let pointerNDC: { x: number; y: number } | null = null;
  let frameId: number | null = null;
  let resizeObs: ResizeObserver | null = null;
  let onPointerMoveBound: ((e: PointerEvent) => void) | null = null;
  let onClickBound: ((e: MouseEvent) => void) | null = null;
  let disposers: Array<() => void> = [];
  let roomMeshes: Array<{
    mesh: any;
    placement: RoomPlacement;
    baseColor: number;
  }> = [];
  let floorGroups: Array<{ floor: number; group: any }> = [];

  const buildingMeta = $derived(
    buildings.find((b) => b.building_name === name) ?? null,
  );

  const buildingRooms = $derived(
    rooms.filter((r) => r.building?.name === name),
  );

  const roomCodes = $derived(buildingRooms.map((r) => r.code));

  const placements = $derived(
    polygon
      ? placeRooms(roomCodes, polygon, totalFloors)
      : ([] as RoomPlacement[]),
  );

  let polygon: LocalPolygon | null = $state(null);

  const floorOptions = $derived.by(() => {
    const opts: Array<{ value: number | "all"; label: string }> = [
      { value: "all", label: "All floors" },
    ];
    for (let f = totalFloors; f >= 1; f--) {
      opts.push({ value: f, label: `Floor ${f}` });
    }
    return opts;
  });

  const visibleRooms = $derived.by(() => {
    if (selectedFloor === "all") return placements;
    return placements.filter((p) => p.floor === selectedFloor);
  });

  function close() {
    building3DStore.close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  async function init() {
    if (!canvasContainer || !labelContainer) return;
    if (!buildingMeta?.lat || !buildingMeta?.lon) {
      errorMsg = "This building has no coordinates yet.";
      loading = false;
      return;
    }

    try {
      const [THREE, OrbitMod, CSS2DMod] = await Promise.all([
        import("three"),
        import("three/examples/jsm/controls/OrbitControls.js"),
        import("three/examples/jsm/renderers/CSS2DRenderer.js"),
      ]);

      const footprint = await fetchBuildingFootprint(
        buildingMeta.lat,
        buildingMeta.lon,
      );

      if (!footprint) {
        errorMsg =
          "Could not pull a building footprint from OpenStreetMap. The building may not be mapped yet.";
        loading = false;
        return;
      }

      const localPoly = footprintToLocalPolygon(footprint);
      polygon = localPoly;

      const inferred = maxInferredFloor(roomCodes);
      const floors = defaultFloorCount(footprint, inferred);
      totalFloors = floors;

      footprintNote = footprint.levels
        ? `OSM has \`building:levels=${footprint.levels}\`.`
        : footprint.heightMeters
          ? `Floor count estimated from OSM height (~${footprint.heightMeters.toFixed(0)} m).`
          : inferred
            ? `Floor count inferred from room codes (max ${inferred}).`
            : "Floor count is a default guess (3); OSM has no levels or height tag.";

      // === Scene setup ===
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xeef2f7);

      const width = canvasContainer.clientWidth;
      const height = canvasContainer.clientHeight;

      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      const radius = Math.max(localPoly.widthMeters, localPoly.depthMeters);
      camera.position.set(radius * 1.4, radius * 1.2, radius * 1.4);
      camera.lookAt(0, totalFloors * FLOOR_HEIGHT * 0.4, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      canvasContainer.appendChild(renderer.domElement);

      labelRenderer = new CSS2DMod.CSS2DRenderer();
      labelRenderer.setSize(width, height);
      labelRenderer.domElement.style.position = "absolute";
      labelRenderer.domElement.style.top = "0";
      labelRenderer.domElement.style.left = "0";
      labelRenderer.domElement.style.pointerEvents = "none";
      labelContainer.appendChild(labelRenderer.domElement);

      controls = new OrbitMod.OrbitControls(camera, renderer.domElement);
      controls.target.set(0, totalFloors * FLOOR_HEIGHT * 0.4, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 4;
      controls.maxDistance = radius * 6;
      controls.maxPolarAngle = Math.PI * 0.495; // don't let users go below ground
      controls.update();

      // === Lighting ===
      const ambient = new THREE.AmbientLight(0xffffff, 0.55);
      scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffffff, 0.85);
      dir.position.set(radius, radius * 2.5, radius * 0.6);
      dir.castShadow = true;
      scene.add(dir);
      const hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 0.4);
      scene.add(hemi);

      // === Ground ===
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(radius * 3.5, 64),
        new THREE.MeshStandardMaterial({
          color: 0xd9d4cb,
          roughness: 0.95,
        }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.02;
      ground.receiveShadow = true;
      scene.add(ground);

      // === Building shape ===
      const shape = new THREE.Shape();
      const pts = localPoly.points;
      if (pts.length === 0) {
        errorMsg = "Building footprint is empty.";
        loading = false;
        return;
      }
      shape.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i]!;
        shape.lineTo(p.x, p.y);
      }

      // Outer translucent shell — shows the whole building height.
      const shellGeom = new THREE.ExtrudeGeometry(shape, {
        depth: floors * FLOOR_HEIGHT,
        bevelEnabled: false,
      });
      shellGeom.rotateX(-Math.PI / 2);
      const shellMat = new THREE.MeshStandardMaterial({
        color: SHELL_COLOR,
        transparent: true,
        opacity: SHELL_OPACITY,
        roughness: 0.9,
        depthWrite: false,
      });
      const shellMesh = new THREE.Mesh(shellGeom, shellMat);
      shellMesh.castShadow = false;
      shellMesh.receiveShadow = false;
      scene.add(shellMesh);

      const edgeGeom = new THREE.EdgesGeometry(shellGeom);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x6b5b48,
        transparent: true,
        opacity: 0.6,
      });
      const edges = new THREE.LineSegments(edgeGeom, edgeMat);
      scene.add(edges);

      // Per-floor slabs.
      floorGroups = [];
      for (let f = 1; f <= floors; f++) {
        const slabGeom = new THREE.ExtrudeGeometry(shape, {
          depth: 0.18,
          bevelEnabled: false,
        });
        slabGeom.rotateX(-Math.PI / 2);
        const slabMat = new THREE.MeshStandardMaterial({
          color: FLOOR_SLAB_COLOR,
          transparent: true,
          opacity: FLOOR_SLAB_OPACITY,
          roughness: 0.85,
          side: THREE.DoubleSide,
        });
        const slab = new THREE.Mesh(slabGeom, slabMat);
        slab.position.y = (f - 1) * FLOOR_HEIGHT;
        slab.castShadow = false;
        slab.receiveShadow = true;

        const group = new THREE.Group();
        group.add(slab);

        // Floor label sprite
        const labelEl = document.createElement("div");
        labelEl.className = "viewer-floor-label";
        labelEl.textContent = `F${f}`;
        const labelObj = new CSS2DMod.CSS2DObject(labelEl);
        labelObj.position.set(
          localPoly.widthMeters / 2 + 1.5,
          (f - 1) * FLOOR_HEIGHT + 0.4,
          localPoly.depthMeters / 2 + 1.5,
        );
        group.add(labelObj);

        scene.add(group);
        floorGroups.push({ floor: f, group });
      }

      // === Room markers ===
      roomMeshes = [];
      const stableRooms = placements;
      for (const placement of stableRooms) {
        const cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.55, 0.55, 1.4, 16),
          new THREE.MeshStandardMaterial({
            color: ROOM_COLOR,
            emissive: 0x1a0606,
            roughness: 0.45,
            metalness: 0.05,
          }),
        );
        cyl.position.set(
          placement.x,
          (placement.floor - 1) * FLOOR_HEIGHT + 0.95,
          placement.y,
        );
        cyl.userData.roomCode = placement.code;
        cyl.userData.floor = placement.floor;
        cyl.castShadow = true;
        cyl.receiveShadow = false;
        scene.add(cyl);

        const labelEl = document.createElement("div");
        labelEl.className = "viewer-room-label";
        labelEl.textContent = placement.code;
        const labelObj = new CSS2DMod.CSS2DObject(labelEl);
        labelObj.position.set(0, 1.0, 0);
        cyl.add(labelObj);

        roomMeshes.push({ mesh: cyl, placement, baseColor: ROOM_COLOR });
      }

      raycaster = new THREE.Raycaster();
      pointer = new THREE.Vector2();

      onPointerMoveBound = (e: PointerEvent) => {
        if (!canvasContainer) return;
        const rect = canvasContainer.getBoundingClientRect();
        pointerNDC = {
          x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
          y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
        };
      };
      onClickBound = (e: MouseEvent) => {
        if (!pointerNDC || !raycaster || !camera || !scene) return;
        pointer.set(pointerNDC.x, pointerNDC.y);
        raycaster.setFromCamera(pointer, camera);
        const meshes = roomMeshes.map((rm) => rm.mesh);
        const hits = raycaster.intersectObjects(meshes, false);
        if (hits.length > 0) {
          const hit = hits[0]!.object;
          const code = hit.userData.roomCode as string | undefined;
          const floor = hit.userData.floor as number | undefined;
          if (code) {
            activeRoomCode = activeRoomCode === code ? null : code;
            if (activeRoomCode && floor) {
              selectedFloor = floor;
            }
          }
        } else {
          activeRoomCode = null;
        }
      };
      renderer.domElement.addEventListener("pointermove", onPointerMoveBound);
      renderer.domElement.addEventListener("click", onClickBound);

      // === Cleanup registration ===
      disposers.push(() => {
        renderer.domElement.removeEventListener(
          "pointermove",
          onPointerMoveBound!,
        );
        renderer.domElement.removeEventListener("click", onClickBound!);
      });
      disposers.push(() => {
        for (const rm of roomMeshes) {
          rm.mesh.geometry.dispose();
          rm.mesh.material.dispose();
        }
        shellGeom.dispose();
        shellMat.dispose();
        edgeGeom.dispose();
        edgeMat.dispose();
        ground.geometry.dispose();
        (ground.material as any).dispose();
        for (const fg of floorGroups) {
          fg.group.traverse((obj: any) => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
          });
        }
        renderer.dispose();
      });

      // === Resize observer ===
      resizeObs = new ResizeObserver(() => {
        if (!canvasContainer || !renderer || !camera || !labelRenderer) return;
        const w = canvasContainer.clientWidth;
        const h = canvasContainer.clientHeight;
        if (w === 0 || h === 0) return;
        renderer.setSize(w, h);
        labelRenderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      resizeObs.observe(canvasContainer);

      const animate = () => {
        controls?.update();
        // Hover detection
        if (pointerNDC && raycaster && camera) {
          pointer.set(pointerNDC.x, pointerNDC.y);
          raycaster.setFromCamera(pointer, camera);
          const meshes = roomMeshes.map((rm) => rm.mesh);
          const hits = raycaster.intersectObjects(meshes, false);
          hoveredRoomCode = hits.length > 0
            ? ((hits[0]!.object.userData.roomCode as string | undefined) ?? null)
            : null;
        }
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };

      loading = false;
      animate();
    } catch (err) {
      console.error("Building3DViewer init failed", err);
      errorMsg = "Failed to load the 3D viewer.";
      loading = false;
    }
  }

  function resetCamera() {
    if (!camera || !controls || !polygon) return;
    const radius = Math.max(polygon.widthMeters, polygon.depthMeters);
    camera.position.set(radius * 1.4, radius * 1.2, radius * 1.4);
    controls.target.set(0, totalFloors * FLOOR_HEIGHT * 0.4, 0);
    controls.update();
  }

  $effect(() => {
    // Hide rooms not on the selected floor (or show all).
    const selected = selectedFloor;
    untrack(() => {
      for (const rm of roomMeshes) {
        const visible = selected === "all" || rm.placement.floor === selected;
        rm.mesh.visible = visible;
      }
      for (const fg of floorGroups) {
        const slabVisible = selected === "all" || fg.floor === selected;
        fg.group.children.forEach((child: any) => {
          // Always show the floor labels; only hide the slab itself when filtered.
          if (child.isMesh) child.visible = slabVisible;
        });
      }
    });
  });

  $effect(() => {
    const code = activeRoomCode;
    const hover = hoveredRoomCode;
    untrack(() => {
      for (const rm of roomMeshes) {
        const isActive = rm.placement.code === code;
        const isHover = rm.placement.code === hover;
        const targetColor = isActive
          ? ROOM_HIGHLIGHT_COLOR
          : isHover
            ? 0xfb923c
            : rm.baseColor;
        const mat = rm.mesh.material as { color: { setHex: (hex: number) => void } };
        mat.color.setHex(targetColor);
        const scale = isActive ? 1.4 : isHover ? 1.15 : 1;
        rm.mesh.scale.setScalar(scale);
      }
    });
  });

  onMount(() => {
    init();
    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      resizeObs?.disconnect();
      for (const dispose of disposers) {
        try {
          dispose();
        } catch (e) {
          console.warn("3D dispose error", e);
        }
      }
      if (renderer?.domElement?.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      if (labelRenderer?.domElement?.parentNode) {
        labelRenderer.domElement.parentNode.removeChild(
          labelRenderer.domElement,
        );
      }
      scene = null;
      camera = null;
      renderer = null;
      labelRenderer = null;
      controls = null;
      raycaster = null;
      pointer = null;
      roomMeshes = [];
      floorGroups = [];
      disposers = [];
    };
  });

  const activeRoomMeta = $derived(
    activeRoomCode
      ? (buildingRooms.find((r) => r.code === activeRoomCode) ?? null)
      : null,
  );
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="viewer-overlay" transition:fade={{ duration: 180 }}>
  <div class="viewer-frame">
    <header class="viewer-header">
      <div class="viewer-title">
        <Building2 size={20} />
        <div>
          <div class="viewer-name">{name}</div>
          <div class="viewer-subtitle">
            3D model fabricated from OpenStreetMap footprint &middot; mock room
            positions
          </div>
        </div>
      </div>
      <button class="viewer-close" onclick={close} aria-label="Close 3D viewer">
        <X size={20} />
      </button>
    </header>

    <div class="viewer-body">
      <aside class="viewer-sidebar">
        <section class="viewer-section">
          <h3>Floor</h3>
          <div class="floor-pills">
            {#each floorOptions as opt (opt.value)}
              <button
                class="floor-pill"
                class:active={selectedFloor === opt.value}
                onclick={() => (selectedFloor = opt.value)}
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </section>

        <section class="viewer-section">
          <div class="rooms-header">
            <h3>Rooms</h3>
            <span class="rooms-count">{visibleRooms.length}</span>
          </div>
          <ul class="room-list">
            {#each visibleRooms as p (p.code + p.floor)}
              <li>
                <button
                  class="room-item"
                  class:active={activeRoomCode === p.code}
                  onmouseenter={() => (hoveredRoomCode = p.code)}
                  onmouseleave={() => {
                    if (hoveredRoomCode === p.code) hoveredRoomCode = null;
                  }}
                  onclick={() => {
                    activeRoomCode =
                      activeRoomCode === p.code ? null : p.code;
                    if (activeRoomCode) selectedFloor = p.floor;
                  }}
                >
                  <span class="room-code">{p.code}</span>
                  <span class="room-floor">F{p.floor}</span>
                </button>
              </li>
            {/each}
            {#if visibleRooms.length === 0}
              <li class="room-empty">No rooms on this floor.</li>
            {/if}
          </ul>
        </section>

        {#if footprintNote}
          <p class="viewer-note">{footprintNote}</p>
        {/if}

        <button class="viewer-reset" onclick={resetCamera}>
          <RotateCcw size={14} /> Reset camera
        </button>
      </aside>

      <div class="viewer-stage">
        {#if loading}
          <div class="viewer-status">
            <Loader size={20} class="viewer-spin" />
            <span>Loading building from OpenStreetMap…</span>
          </div>
        {/if}
        {#if errorMsg}
          <div class="viewer-status error">{errorMsg}</div>
        {/if}
        <div bind:this={canvasContainer} class="viewer-canvas"></div>
        <div bind:this={labelContainer} class="viewer-labels"></div>

        {#if activeRoomMeta}
          <div class="room-info-card" transition:fade={{ duration: 120 }}>
            <div class="room-info-header">
              <strong>{activeRoomMeta.code}</strong>
              <span class="room-info-floor">Floor {placements.find((p) => p.code === activeRoomMeta.code)?.floor ?? "?"}</span>
            </div>
            {#if activeRoomMeta.collegeName}
              <div class="room-info-row">
                <span>College</span>
                <span>{activeRoomMeta.collegeName}</span>
              </div>
            {/if}
            {#if activeRoomMeta.divisionName}
              <div class="room-info-row">
                <span>Division</span>
                <span>{activeRoomMeta.divisionName}</span>
              </div>
            {/if}
            <p class="room-info-mock">
              Position is a mock placement. Real indoor coordinates are not
              published in OpenStreetMap for this building.
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .viewer-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(8, 12, 22, 0.55);
    backdrop-filter: blur(2px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    pointer-events: auto;
  }
  .viewer-frame {
    width: min(72rem, 100%);
    height: min(46rem, 100%);
    background-color: white;
    border-radius: 1rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .viewer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.125rem;
    border-bottom: 1px solid hsl(0, 0%, 92%);
    flex: 0 0 auto;
  }
  .viewer-title {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    color: hsl(0, 0%, 15%);
  }
  .viewer-name {
    font-weight: 700;
    font-size: 1rem;
    line-height: 1.2;
  }
  .viewer-subtitle {
    font-size: 0.75rem;
    color: hsl(0, 0%, 45%);
    margin-top: 0.125rem;
  }
  .viewer-close {
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    padding: 0.375rem;
    color: hsl(0, 0%, 30%);
    display: flex;
  }
  .viewer-close:hover {
    background-color: hsl(0, 0%, 95%);
  }

  .viewer-body {
    flex: 1 1 auto;
    display: flex;
    min-height: 0;
  }

  .viewer-sidebar {
    width: 17rem;
    border-right: 1px solid hsl(0, 0%, 92%);
    padding: 0.875rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background-color: hsl(0, 0%, 99%);
  }
  .viewer-section h3 {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: hsl(0, 0%, 35%);
    margin-bottom: 0.4rem;
  }
  .floor-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .floor-pill {
    border: 1px solid hsl(0, 0%, 88%);
    background-color: white;
    border-radius: 999px;
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
    cursor: pointer;
    color: hsl(0, 0%, 25%);
    transition: background-color 0.15s, border-color 0.15s;
  }
  .floor-pill:hover {
    background-color: hsl(0, 0%, 96%);
  }
  .floor-pill.active {
    background-color: hsl(5, 53%, 32%);
    color: white;
    border-color: hsl(5, 53%, 32%);
  }

  .rooms-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .rooms-count {
    font-size: 0.75rem;
    color: hsl(0, 0%, 50%);
  }
  .room-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 16rem;
    overflow-y: auto;
  }
  .room-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.4rem 0.625rem;
    border-radius: 0.5rem;
    border: 1px solid transparent;
    background-color: white;
    cursor: pointer;
    text-align: left;
  }
  .room-item:hover {
    background-color: hsl(0, 0%, 96%);
  }
  .room-item.active {
    background-color: hsl(45, 92%, 95%);
    border-color: hsl(45, 92%, 60%);
  }
  .room-code {
    font-size: 0.8125rem;
    font-weight: 600;
    color: hsl(0, 0%, 15%);
  }
  .room-floor {
    font-size: 0.6875rem;
    color: hsl(0, 0%, 45%);
    background-color: hsl(0, 0%, 95%);
    padding: 0.0625rem 0.375rem;
    border-radius: 999px;
  }
  .room-empty {
    font-size: 0.8125rem;
    color: hsl(0, 0%, 50%);
    padding: 0.25rem 0.125rem;
  }

  .viewer-note {
    font-size: 0.6875rem;
    color: hsl(0, 0%, 45%);
    line-height: 1.4;
    background-color: hsl(45, 90%, 96%);
    border: 1px solid hsl(45, 92%, 88%);
    padding: 0.5rem 0.625rem;
    border-radius: 0.5rem;
  }

  .viewer-reset {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.75rem;
    padding: 0.4rem 0.625rem;
    border: 1px solid hsl(0, 0%, 88%);
    background: white;
    border-radius: 0.5rem;
    cursor: pointer;
    width: max-content;
  }
  .viewer-reset:hover {
    background-color: hsl(0, 0%, 96%);
  }

  .viewer-stage {
    position: relative;
    flex: 1 1 auto;
    background-color: hsl(212, 24%, 95%);
    overflow: hidden;
  }
  .viewer-canvas {
    position: absolute;
    inset: 0;
  }
  .viewer-labels {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .viewer-status {
    position: absolute;
    top: 0.75rem;
    left: 50%;
    translate: -50% 0;
    background-color: white;
    border: 1px solid hsl(0, 0%, 90%);
    border-radius: 999px;
    padding: 0.4rem 0.875rem;
    font-size: 0.8125rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 5;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
  }
  .viewer-status.error {
    color: hsl(5, 65%, 32%);
    border-color: hsl(5, 50%, 80%);
    background-color: hsl(5, 90%, 97%);
  }
  :global(.viewer-spin) {
    animation: viewer-spin 1s linear infinite;
  }
  @keyframes viewer-spin {
    to {
      transform: rotate(360deg);
    }
  }

  :global(.viewer-room-label) {
    background-color: white;
    color: hsl(0, 0%, 15%);
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 0.375rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
    white-space: nowrap;
    transform: translate(-50%, -130%);
    pointer-events: none;
  }
  :global(.viewer-floor-label) {
    background-color: hsl(5, 53%, 32%);
    color: white;
    font-size: 0.6875rem;
    font-weight: 700;
    padding: 0.0625rem 0.375rem;
    border-radius: 0.25rem;
    pointer-events: none;
    opacity: 0.85;
  }

  .room-info-card {
    position: absolute;
    bottom: 0.875rem;
    left: 0.875rem;
    background-color: white;
    border-radius: 0.75rem;
    padding: 0.75rem 0.875rem;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
    width: 17rem;
    z-index: 4;
  }
  .room-info-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .room-info-header strong {
    font-size: 0.9375rem;
    color: hsl(0, 0%, 15%);
  }
  .room-info-floor {
    font-size: 0.6875rem;
    color: white;
    background-color: hsl(5, 53%, 32%);
    padding: 0.0625rem 0.375rem;
    border-radius: 999px;
  }
  .room-info-row {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.75rem;
    margin-top: 0.4rem;
  }
  .room-info-row span:first-child {
    color: hsl(0, 0%, 45%);
  }
  .room-info-row span:last-child {
    color: hsl(0, 0%, 15%);
    text-align: right;
  }
  .room-info-mock {
    margin-top: 0.5rem;
    font-size: 0.6875rem;
    color: hsl(0, 0%, 50%);
    line-height: 1.4;
  }

  @media screen and (max-width: 48rem) {
    .viewer-overlay {
      padding: 0;
    }
    .viewer-frame {
      width: 100%;
      height: 100%;
      border-radius: 0;
    }
    .viewer-body {
      flex-direction: column;
    }
    .viewer-sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid hsl(0, 0%, 92%);
      max-height: 16rem;
    }
    .room-info-card {
      width: calc(100% - 1.75rem);
    }
  }
</style>
